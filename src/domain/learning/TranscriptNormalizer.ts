// 仕様書 §10: raw transcript の正規化。
// 将来「漢字STT結果 → 読み仮名化」を追加できるようクラスとして分離しておく。

const KATAKANA_START = 0x30a1; // ァ
const KATAKANA_END = 0x30f6; // ヶ
const KANA_OFFSET = 0x60; // カタカナ → ひらがな

export class TranscriptNormalizer {
  /**
   * - Unicode NFKC 正規化(全角英数・半角カナなど)
   * - カタカナ → ひらがな
   * - 空白・句読点・記号・長音記号の除去
   */
  normalize(raw: string): string {
    const nfkc = raw.normalize("NFKC");
    let out = "";
    for (const ch of nfkc) {
      const code = ch.codePointAt(0)!;
      if (code >= KATAKANA_START && code <= KATAKANA_END) {
        out += String.fromCodePoint(code - KANA_OFFSET);
        continue;
      }
      if (/[\s、。，．,.!?！?？・「」『』()（）〜~ー－\-]/.test(ch)) {
        continue;
      }
      out += ch;
    }
    return out;
  }
}
