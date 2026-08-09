// 仕様書 §6: 問題データ仕様

export interface ReadingQuestion {
  id: string;

  text: string;
  reading: string;

  /** 正解として確定してよいSTT出力(§7.1) */
  accepted: string[];
  /**
   * STTが音響的に取り違えやすい候補(§7.2)。
   * 無条件で正解にしない。マッチしたら STT_AMBIGUOUS としてノーペナルティ再認識。
   * 実機ログ(SttQuestionStats)から育てる辞書(§11)。
   */
  sttConfusions: string[];

  grade: number;
  term: number;

  tags?: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;

  audioHint?: string;
}
