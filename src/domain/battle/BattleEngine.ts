import type { EvaluationResult } from "../learning/AnswerEvaluator";
import type { BattleEvent } from "./BattleEvent";
import type { EnemyDefinition, StageDefinition } from "./StageDefinition";
import { ComboSystem } from "./ComboSystem";
import { DamageCalculator } from "./DamageCalculator";

// 仕様書 §31: BattleEngine は画面を知らない。
// 入力: submitEvaluation(result) / 出力: BattleEvent[]。

const MAX_AMBIGUOUS_BEFORE_ESCALATE = 3; // ambiguousループの詰み防止(§21)

export class BattleEngine {
  private comboSystem = new ComboSystem();
  private damageCalc = new DamageCalculator();

  private encounterIndex = -1;
  private enemyHp = 0;

  /** 現在の問題での INCORRECT 回数(段階的ヒント §20 の状態) */
  private failCount = 0;
  private ambiguousCount = 0;
  /** 答えを見せた後か(復唱フェーズ) */
  private revealed = false;

  maxCombo = 0;

  constructor(
    private stage: StageDefinition,
    private enemies: Map<string, EnemyDefinition>,
  ) {}

  get isCleared(): boolean {
    return this.encounterIndex >= this.stage.encounters.length;
  }

  get combo(): number {
    return this.comboSystem.current;
  }

  /** バトル開始。最初の ENCOUNTER_STARTED を返す */
  start(): BattleEvent[] {
    return this.nextEncounter();
  }

  /** 新しい問題に入るたびに呼ぶ(ヒント状態のリセット) */
  beginQuestion(): void {
    this.failCount = 0;
    this.ambiguousCount = 0;
    this.revealed = false;
  }

  submitEvaluation(result: EvaluationResult, reading: string): BattleEvent[] {
    switch (result.type) {
      case "CORRECT":
        return this.handleCorrect();
      case "STT_AMBIGUOUS":
        return this.handleAmbiguous(reading);
      case "INCORRECT":
        return this.handleIncorrect(reading);
      case "NO_SPEECH":
        return [{ type: "RETRY", reason: "no-speech" }];
    }
  }

  private handleCorrect(): BattleEvent[] {
    const events: BattleEvent[] = [{ type: "ANSWER_CORRECT" }];

    let roll;
    if (this.revealed) {
      // 復唱正解: 攻撃は出すが控えめ。コンボは増やさない
      roll = this.damageCalc.rollAfterReveal();
    } else {
      const combo = this.comboSystem.increment();
      this.maxCombo = Math.max(this.maxCombo, combo);
      events.push({ type: "COMBO_CHANGED", combo });
      roll = this.damageCalc.roll(combo, this.comboSystem.multiplier);
    }

    events.push({ type: "DAMAGE", amount: roll.amount, critical: roll.critical });

    this.enemyHp = Math.max(0, this.enemyHp - roll.amount);
    const encounter = this.stage.encounters[this.encounterIndex];
    events.push({
      type: "ENEMY_HP_CHANGED",
      hp: this.enemyHp,
      maxHp: encounter.hp,
    });

    if (this.enemyHp <= 0) {
      events.push({
        type: "ENEMY_DEFEATED",
        name: this.enemyName(encounter.enemyId),
      });
      events.push(...this.nextEncounter());
    }
    return events;
  }

  private handleAmbiguous(reading: string): BattleEvent[] {
    // §18: コンボ維持・ダメージなし・敵も攻撃しない・ノーペナルティ再認識
    this.ambiguousCount += 1;
    if (this.ambiguousCount >= MAX_AMBIGUOUS_BEFORE_ESCALATE) {
      // 何度も曖昧なら本当に読めていない可能性がある。ヒント経路へ合流させて前へ進める
      return this.handleIncorrect(reading);
    }
    return [{ type: "RETRY", reason: "ambiguous" }];
  }

  private handleIncorrect(reading: string): BattleEvent[] {
    // §19: 初期版はコンボを切らない(罰が強いと「声を出さない」方向へ学習するため)
    this.failCount += 1;

    if (this.failCount === 1) {
      return [{ type: "RETRY", reason: "incorrect" }];
    }
    if (this.failCount === 2) {
      return [{ type: "HINT", text: maskReading(reading) }];
    }
    if (this.failCount === 3) {
      this.revealed = true;
      return [{ type: "REVEAL_ANSWER", reading }];
    }
    // 復唱もできない場合の最終救済(§21 進行不能禁止)
    return [{ type: "QUESTION_SKIPPED", reading }];
  }

  private nextEncounter(): BattleEvent[] {
    this.encounterIndex += 1;
    if (this.isCleared) {
      return [{ type: "STAGE_CLEARED" }];
    }
    const encounter = this.stage.encounters[this.encounterIndex];
    this.enemyHp = encounter.hp;
    return [
      {
        type: "ENCOUNTER_STARTED",
        enemyId: encounter.enemyId,
        name: this.enemyName(encounter.enemyId),
        hp: encounter.hp,
        maxHp: encounter.hp,
        index: this.encounterIndex,
        total: this.stage.encounters.length,
        isBoss: encounter.isBoss ?? false,
      },
    ];
  }

  private enemyName(enemyId: string): string {
    return this.enemies.get(enemyId)?.name ?? enemyId;
  }
}

/** 「ひこう」→「ひ○う」: 最初と最後だけ見せる段階ヒント(§20) */
export function maskReading(reading: string): string {
  const chars = [...reading];
  if (chars.length <= 1) return "○";
  if (chars.length === 2) return `${chars[0]}○`;
  return chars[0] + "○".repeat(chars.length - 2) + chars[chars.length - 1];
}
