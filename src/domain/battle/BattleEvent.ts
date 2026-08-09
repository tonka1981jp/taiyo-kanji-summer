// 仕様書 §31〜32: Domain は BattleEvent[] を返すだけで、画面を一切知らない。
// Presentation はこの Event 列を順に再生してアニメーションする。

export type RetryReason = "ambiguous" | "incorrect" | "no-speech";

export type BattleEvent =
  | {
      type: "ENCOUNTER_STARTED";
      enemyId: string;
      name: string;
      hp: number;
      maxHp: number;
      index: number;
      total: number;
      isBoss: boolean;
    }
  | { type: "ANSWER_CORRECT" }
  | { type: "COMBO_CHANGED"; combo: number }
  | { type: "DAMAGE"; amount: number; critical: boolean }
  | { type: "ENEMY_HP_CHANGED"; hp: number; maxHp: number }
  | { type: "ENEMY_DEFEATED"; name: string }
  | { type: "STAGE_CLEARED" }
  | { type: "RETRY"; reason: RetryReason }
  | { type: "HINT"; text: string }
  /** 3回失敗: 答えを見せて「いっしょに言ってみよう」(§20) */
  | { type: "REVEAL_ANSWER"; reading: string }
  /** 復唱もできなかった場合の最終救済。進行不能禁止(§21) */
  | { type: "QUESTION_SKIPPED"; reading: string };
