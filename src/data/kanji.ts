// 小4・1学期の配当漢字102字(コレクションの台帳)。
// scripts/check-kanji-coverage.ts もこのリストを参照する。

export const KANJI_LIST: string[] = (
  "信達飛席建菜標例法類機械司典順録" +
  "辞成訓印静愛昨城初景群必要的" +
  "府茨栃埼奈潟富井梨量岐阜岡" +
  "伝案説試選観旗利材関" +
  "以季節郡戦争給飯包帯泣軍兵隊輪" +
  "健康夫氏祝貨児器官良徒競芽梅約付清" +
  "滋阪徳香媛佐賀崎熊鹿沖縄" +
  "熱働栄養満"
).split("");

export const KANJI_SET = new Set(KANJI_LIST);
