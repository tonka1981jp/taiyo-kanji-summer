// 仕様書 §46〜47: ローカルファーストのセーブデータ。

/** STT改善用のローカル統計(§47)。音声そのものは保存しない(§48) */
export interface SttQuestionStats {
  questionId: string;

  acceptedHits: Record<string, number>;
  confusionHits: Record<string, number>;
  unknownHits: Record<string, number>;
}

export interface PlayerProgress {
  /** クリア済みステージID */
  clearedStageIds: string[];
  /** 最後に遊んだステージID */
  lastStageId?: string;
  /** 問題ごとのSTT統計 */
  sttStats: Record<string, SttQuestionStats>;
  updatedAt: number;
}

export function createInitialProgress(): PlayerProgress {
  return {
    clearedStageIds: [],
    sttStats: {},
    updatedAt: Date.now(),
  };
}

export function recordSttHit(
  progress: PlayerProgress,
  questionId: string,
  kind: "accepted" | "confusion" | "unknown",
  transcript: string,
): void {
  const stats = (progress.sttStats[questionId] ??= {
    questionId,
    acceptedHits: {},
    confusionHits: {},
    unknownHits: {},
  });
  const bucket =
    kind === "accepted"
      ? stats.acceptedHits
      : kind === "confusion"
        ? stats.confusionHits
        : stats.unknownHits;
  bucket[transcript] = (bucket[transcript] ?? 0) + 1;
}
