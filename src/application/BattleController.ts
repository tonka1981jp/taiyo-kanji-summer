import type { BattleEvent } from "../domain/battle/BattleEvent";
import type { BattleEngine } from "../domain/battle/BattleEngine";
import type { StageDefinition } from "../domain/battle/StageDefinition";
import { AnswerEvaluator } from "../domain/learning/AnswerEvaluator";
import type { ReadingQuestion } from "../domain/learning/Question";
import type { QuestionSession } from "../domain/learning/QuestionRepository";
import {
  recordSttHit,
  type PlayerProgress,
} from "../domain/progression/PlayerProgress";
import type {
  SpeechRecognizer,
  SpeechResult,
} from "../infrastructure/speech/SpeechRecognizer";
import type { BattleRenderer, StageSummary } from "./BattleRenderer";

// 仕様書 §33 の Battle State Machine を回す司令塔。
// Speech → 正規化 → 判定 → BattleEngine → BattleEvent → Renderer の一方向(§62)。

const LISTEN_DELAY_MS = 450; // QUESTION_SHOW → LISTENING(テンポ目標 §58)
const SILENCE_PROMPT_MS = 5000;

export interface BattleControllerDeps {
  stage: StageDefinition;
  recognizer: SpeechRecognizer;
  session: QuestionSession;
  engine: BattleEngine;
  renderer: BattleRenderer;
  progress: PlayerProgress;
  onStageCleared: (summary: StageSummary) => void;
}

export class BattleController {
  private evaluator = new AnswerEvaluator();

  private question: ReadingQuestion | null = null;
  private accepting = false;
  private finished = false;
  private silenceTimer: number | undefined;

  private speechDetectedAt: number | undefined;
  private retriesThisQuestion = 0;

  private stats = {
    utterances: 0,
    correct: 0,
    ambiguous: 0,
    incorrect: 0,
    skipped: 0,
  };
  private startedAt = Date.now();

  constructor(private deps: BattleControllerDeps) {}

  /** START タップ(ユーザージェスチャー)から呼ぶこと。マイク許可がここで走る */
  async start(): Promise<void> {
    const { recognizer, renderer } = this.deps;

    recognizer.onResult((r) => this.handleResult(r));
    recognizer.onSpeechStart(() => {
      this.speechDetectedAt ??= Date.now();
    });
    recognizer.onError((e) => {
      if (e.fatal) {
        this.clearSilenceTimer();
        renderer.showFatalError(
          `マイクが使えません(${e.code})。設定を確認してページを再読み込みしてください。`,
        );
      }
    });

    try {
      await recognizer.init();
    } catch (err) {
      renderer.showFatalError(
        `このブラウザでは音声認識を利用できません: ${String(err)}`,
      );
      return;
    }

    await this.renderEvents(this.deps.engine.start());
    this.nextQuestion();
  }

  async destroy(): Promise<void> {
    this.finished = true;
    this.clearSilenceTimer();
    await this.deps.recognizer.stop();
  }

  // ---------- 進行 ----------

  private nextQuestion(): void {
    if (this.finished) return;
    this.question = this.deps.session.next();
    this.retriesThisQuestion = 0;
    this.deps.engine.beginQuestion();
    this.deps.renderer.showQuestion(this.question.text);
    this.deps.renderer.setMic("off");
    window.setTimeout(() => this.listen(), LISTEN_DELAY_MS);
  }

  private listen(): void {
    if (this.finished) return;
    this.accepting = true;
    this.speechDetectedAt = undefined;
    this.deps.renderer.setMic("listening");
    void this.deps.recognizer.start();
    this.armSilenceTimer();
  }

  private handleResult(result: SpeechResult): void {
    if (!this.accepting || this.finished || !this.question) return;
    if (this.speechDetectedAt === undefined && result.transcript.trim() !== "") {
      this.speechDetectedAt = Date.now();
    }
    if (!result.isFinal) {
      // 声が届いていることを即フィードバック(答えの連呼防止)
      if (result.transcript.trim() !== "") {
        this.deps.renderer.showHearing();
      }
      return;
    }
    void this.handleFinal(result);
  }

  private async handleFinal(result: SpeechResult): Promise<void> {
    const { renderer, engine, recognizer, progress } = this.deps;
    const question = this.question!;

    this.accepting = false;
    this.clearSilenceTimer();
    renderer.setMic("evaluating");

    const transcripts = [result.transcript, ...(result.alternatives ?? [])];
    const evaluation = this.evaluator.evaluate(transcripts, question);
    const latencyMs =
      this.speechDetectedAt !== undefined
        ? Date.now() - this.speechDetectedAt
        : undefined;

    // ---- 統計(§47, §52-53) ----
    this.stats.utterances += 1;
    this.retriesThisQuestion += 1;
    switch (evaluation.type) {
      case "CORRECT":
        this.stats.correct += 1;
        recordSttHit(progress, question.id, "accepted", evaluation.matched);
        break;
      case "STT_AMBIGUOUS":
        this.stats.ambiguous += 1;
        recordSttHit(progress, question.id, "confusion", evaluation.matched);
        break;
      case "INCORRECT":
        this.stats.incorrect += 1;
        recordSttHit(
          progress,
          question.id,
          "unknown",
          evaluation.normalizedTranscript,
        );
        break;
      case "NO_SPEECH":
        break;
    }

    renderer.updateDebug({
      expected: question.reading,
      raw: result.transcript,
      normalized:
        evaluation.type === "NO_SPEECH" ? "" : evaluation.normalizedTranscript,
      evaluation: evaluation.type,
      confidence: result.confidence,
      retries: this.retriesThisQuestion,
      latencyMs,
    });

    const events = engine.submitEvaluation(evaluation, question.reading);

    // 正解確定・スキップ時は次問まで認識を止める(次問で再start = §58テンポ)
    const advances = events.some(
      (e) =>
        e.type === "ANSWER_CORRECT" ||
        e.type === "QUESTION_SKIPPED" ||
        e.type === "STAGE_CLEARED",
    );
    if (advances) {
      await recognizer.stop();
    }

    await this.renderEvents(events);

    if (this.finished) return;

    if (events.some((e) => e.type === "STAGE_CLEARED")) {
      this.finish();
      return;
    }
    if (advances) {
      this.nextQuestion();
    } else {
      // RETRY / HINT / REVEAL_ANSWER: 同じ問題を聞き続ける
      this.listen();
    }
  }

  private finish(): void {
    this.finished = true;
    this.clearSilenceTimer();
    void this.deps.recognizer.stop();
    const summary: StageSummary = {
      stageId: this.deps.stage.id,
      stageName: this.deps.stage.name,
      ...this.stats,
      maxCombo: this.deps.engine.maxCombo,
      elapsedMs: Date.now() - this.startedAt,
    };
    this.deps.onStageCleared(summary);
  }

  // ---------- BattleEvent → Renderer(§32) ----------

  private async renderEvents(events: BattleEvent[]): Promise<void> {
    const r = this.deps.renderer;
    for (const e of events) {
      switch (e.type) {
        case "ENCOUNTER_STARTED":
          await r.showEncounter(e);
          break;
        case "ANSWER_CORRECT":
          r.showCorrect();
          break;
        case "COMBO_CHANGED":
          r.updateCombo(e.combo);
          break;
        case "DAMAGE":
          await r.playAttack(e.amount, e.critical);
          break;
        case "ENEMY_HP_CHANGED":
          r.updateEnemyHp(e.hp, e.maxHp);
          break;
        case "ENEMY_DEFEATED":
          await r.playEnemyDefeat(e.name);
          break;
        case "STAGE_CLEARED":
          break; // handleFinal 側で finish する
        case "RETRY":
          await r.showRetry(e.reason);
          break;
        case "HINT":
          await r.showHint(e.text);
          break;
        case "REVEAL_ANSWER":
          await r.showRevealAnswer(e.reading);
          break;
        case "QUESTION_SKIPPED":
          this.stats.skipped += 1;
          await r.showSkip(e.reading);
          break;
      }
    }
  }

  // ---------- 無言対応(ゲームオーバーにしない §21) ----------

  private armSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = window.setTimeout(() => {
      if (!this.accepting || this.finished) return;
      this.deps.renderer.showSilencePrompt();
      this.armSilenceTimer();
    }, SILENCE_PROMPT_MS);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer !== undefined) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = undefined;
    }
  }
}
