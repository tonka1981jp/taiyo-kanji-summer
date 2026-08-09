import type { RetryReason } from "../domain/battle/BattleEvent";

// 仕様書 §57: Presentation は Domain Event を受けて再生するだけ。
// このインターフェースが application → presentation の唯一の接点。

export type MicState = "listening" | "evaluating" | "off";

export interface EncounterInfo {
  enemyId: string;
  name: string;
  hp: number;
  maxHp: number;
  index: number;
  total: number;
  isBoss: boolean;
}

export interface DebugInfo {
  expected: string;
  raw: string;
  normalized: string;
  evaluation: string;
  confidence?: number;
  retries: number;
  latencyMs?: number;
}

export interface StageSummary {
  stageId: string;
  stageName: string;
  utterances: number;
  correct: number;
  ambiguous: number;
  incorrect: number;
  skipped: number;
  maxCombo: number;
  elapsedMs: number;
}

export interface BattleRenderer {
  showEncounter(info: EncounterInfo): Promise<void>;
  showQuestion(text: string): void;

  setMic(state: MicState): void;
  /**
   * interim結果を受信した瞬間に呼ぶ。
   * 「きこえてる！」を即座に見せることで、子どもが
   * 「あれ、聞こえてないのかな」と答えを連呼するのを防ぐ。
   */
  showHearing(): void;
  showCorrect(): void;
  showRetry(reason: RetryReason): Promise<void>;
  showHint(text: string): Promise<void>;
  showRevealAnswer(reading: string): Promise<void>;
  showSkip(reading: string): Promise<void>;
  /** 無言が続いたときの促し(ゲームオーバーにしない) */
  showSilencePrompt(): void;

  playAttack(damage: number, critical: boolean): Promise<void>;
  updateEnemyHp(hp: number, maxHp: number): void;
  updateCombo(combo: number): void;
  playEnemyDefeat(name: string): Promise<void>;

  showFatalError(message: string): void;
  /** ?debug=1 のときのみ意味を持つ(§36) */
  updateDebug(info: DebugInfo): void;
}
