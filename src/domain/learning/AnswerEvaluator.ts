import type { ReadingQuestion } from "./Question";
import { TranscriptNormalizer } from "./TranscriptNormalizer";

// 仕様書 §8: 返り値は boolean にしない。
// 「学習者のミスか機械のミスか分からない時は罰しない」(§7.2)を型で表現する。

export type EvaluationResult =
  | { type: "CORRECT"; normalizedTranscript: string; matched: string }
  | { type: "STT_AMBIGUOUS"; normalizedTranscript: string; matched: string }
  /** 「ヒント！」などの声のヘルプ要求(誤答ではない) */
  | { type: "HINT_REQUESTED"; normalizedTranscript: string }
  | { type: "INCORRECT"; normalizedTranscript: string }
  | { type: "NO_SPEECH" };

/** ヒント要求とみなす語彙(正規化後) */
export const HINT_WORDS = ["ひんと", "わからない", "わかんない", "おしえて"];

export class AnswerEvaluator {
  private normalizer = new TranscriptNormalizer();

  /**
   * 判定順序(§9): accepted → CORRECT / sttConfusions → STT_AMBIGUOUS / それ以外 → INCORRECT。
   * transcripts には STT の全候補(alternatives)を渡してよい。
   * どれか1つでも accepted に一致すれば CORRECT を優先する。
   */
  evaluate(transcripts: string[], question: ReadingQuestion): EvaluationResult {
    const normalized = transcripts
      .map((t) => this.normalizer.normalize(t))
      .filter((t) => t.length > 0);

    if (normalized.length === 0) {
      return { type: "NO_SPEECH" };
    }

    const accepted = this.match(normalized, question.accepted);
    if (accepted) {
      return {
        type: "CORRECT",
        normalizedTranscript: normalized[0],
        matched: accepted,
      };
    }

    // 正解でないなら、ヒント要求(声のヘルプ)かどうかを先に見る
    if (normalized.some((t) => HINT_WORDS.some((w) => t.includes(w)))) {
      return { type: "HINT_REQUESTED", normalizedTranscript: normalized[0] };
    }

    const confusion = this.match(normalized, question.sttConfusions);
    if (confusion) {
      return {
        type: "STT_AMBIGUOUS",
        normalizedTranscript: normalized[0],
        matched: confusion,
      };
    }

    return { type: "INCORRECT", normalizedTranscript: normalized[0] };
  }

  /** 完全一致または部分一致(「きかい、です」対策)で照合する */
  private match(normalizedTranscripts: string[], candidates: string[]): string | null {
    for (const candidate of candidates) {
      const norm = this.normalizer.normalize(candidate);
      if (norm.length === 0) continue;
      for (const transcript of normalizedTranscripts) {
        if (transcript === norm || transcript.includes(norm)) {
          return candidate;
        }
      }
    }
    return null;
  }
}
