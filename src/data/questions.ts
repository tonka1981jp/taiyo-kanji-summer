import type { ReadingQuestion } from "../domain/learning/Question";

// 小4・1学期の配当漢字102字を全カバーする問題データ。
// 音読み・訓読みの代表語が両方ある字はペアで収録する(例: 信号/信じる)。
// 単元(u1〜u7)は教材の行グルーピングに対応。u7は7行目+8行目を合体。
// sttConfusions は実機ログから育てる(§11)。
// カバレッジは scripts/check-kanji-coverage.ts で機械検証する。

const q = (
  id: string,
  text: string,
  reading: string,
  acceptedExtra: string[] = [],
  extra: Partial<ReadingQuestion> = {},
): ReadingQuestion => ({
  id: `g4t1-${id}`,
  text,
  reading,
  accepted: [reading, text, ...acceptedExtra],
  sttConfusions: [],
  grade: 4,
  term: 1,
  ...extra,
});

// ---- u1: 信達飛席建菜標例法類機械司典順録 ----
const U1: ReadingQuestion[] = [
  q("shingou", "信号", "しんごう"),
  q("shinjiru", "信じる", "しんじる"),
  q("tomodachi", "友達", "ともだち", ["友だち"]),
  q("hikou", "飛行", "ひこう", ["非行"], {
    sttConfusions: ["きこう", "気候", "機構", "紀行", "寄港"],
  }),
  q("tobu", "飛ぶ", "とぶ", ["跳ぶ"]),
  q("shusseki", "出席", "しゅっせき"),
  q("tatemono", "建物", "たてもの"),
  q("kenkoku", "建国", "けんこく"),
  q("yasai", "野菜", "やさい"),
  q("nanohana", "菜の花", "なのはな"),
  q("mokuhyou", "目標", "もくひょう"),
  q("tatoeba", "例えば", "たとえば", ["たとえ"]),
  q("reibun", "例文", "れいぶん"),
  q("houhou", "方法", "ほうほう"),
  q("bunrui", "分類", "ぶんるい"),
  q("kikai", "機械", "きかい", ["機会", "器械"]),
  q("shikai", "司会", "しかい", ["視界", "歯科医"]),
  q("jiten", "辞典", "じてん", ["事典", "時点", "自転"]),
  q("junban", "順番", "じゅんばん"),
  q("kiroku", "記録", "きろく"),
];

// ---- u2: 辞成訓印静愛昨城初景群必要的 ----
const U2: ReadingQuestion[] = [
  q("kunren", "訓練", "くんれん"),
  q("seikou", "成功", "せいこう"),
  q("insatsu", "印刷", "いんさつ"),
  q("mejirushi", "目印", "めじるし"),
  q("shizuka", "静か", "しずか", ["閑か"]),
  q("aisuru", "愛する", "あいする"),
  q("kinou", "昨日", "きのう", ["さくじつ", "機能"]),
  q("shiro", "城", "しろ", ["白", "お城"]),
  q("saisho", "最初", "さいしょ"),
  q("hajimete", "初めて", "はじめて", ["始めて"]),
  q("keshiki", "景色", "けしき"),
  q("mure", "群れ", "むれ"),
  q("gunma", "群馬", "ぐんま", ["群馬県"]),
  q("hitsuyou", "必要", "ひつよう"),
  q("kanarazu", "必ず", "かならず"),
  q("mokuteki", "目的", "もくてき"),
  q("mato", "的", "まと"),
];

// ---- u3: 府茨栃埼奈潟富井梨量岐阜岡(都道府県①) ----
const U3: ReadingQuestion[] = [
  q("oosakafu", "大阪府", "おおさかふ", ["大阪"]),
  q("ibaraki", "茨城", "いばらき", ["茨城県"], { sttConfusions: ["いばらぎ"] }),
  q("tochigi", "栃木", "とちぎ", ["栃木県"]),
  q("saitama", "埼玉", "さいたま", ["埼玉県"]),
  q("nara", "奈良", "なら", ["奈良県"]),
  q("niigata", "新潟", "にいがた", ["新潟県"]),
  q("fujisan", "富士山", "ふじさん", ["富士"]),
  q("toyama", "富山", "とやま", ["富山県"]),
  q("fukui", "福井", "ふくい", ["福井県"]),
  q("yamanashi", "山梨", "やまなし", ["山梨県"]),
  q("nashi", "梨", "なし", ["無し"]),
  q("tairyou", "大量", "たいりょう"),
  q("hakaru", "量る", "はかる", ["測る", "計る", "図る"]),
  q("gifu", "岐阜", "ぎふ", ["岐阜県"]),
  q("shizuoka", "静岡", "しずおか", ["静岡県"]),
];

// ---- u4: 伝案説試選観旗利材関 ----
const U4: ReadingQuestion[] = [
  q("tsutaeru", "伝える", "つたえる"),
  q("dengon", "伝言", "でんごん"),
  q("annai", "案内", "あんない"),
  q("setsumei", "説明", "せつめい"),
  q("shiai", "試合", "しあい"),
  q("tamesu", "試す", "ためす"),
  q("erabu", "選ぶ", "えらぶ"),
  q("senshu", "選手", "せんしゅ"),
  q("kansatsu", "観察", "かんさつ", ["監察", "鑑札"]),
  q("hata", "旗", "はた"),
  q("kokki", "国旗", "こっき"),
  q("benri", "便利", "べんり"),
  q("zairyou", "材料", "ざいりょう"),
  q("kankei", "関係", "かんけい"),
];

// ---- u5: 以季節郡戦争給飯包帯泣軍兵隊輪 ----
const U5: ReadingQuestion[] = [
  q("ijou", "以上", "いじょう", ["異常", "異状"]),
  q("kisetsu", "季節", "きせつ"),
  q("gun", "郡", "ぐん", ["軍", "群"]),
  q("sensou", "戦争", "せんそう"),
  q("tatakau", "戦う", "たたかう", ["闘う"]),
  q("kyuushoku", "給食", "きゅうしょく"),
  q("gohan", "ご飯", "ごはん", ["御飯"]),
  q("tsutsumu", "包む", "つつむ"),
  q("houtai", "包帯", "ほうたい"),
  q("naku", "泣く", "なく", ["鳴く"]),
  q("guntai", "軍隊", "ぐんたい"),
  q("heitai", "兵隊", "へいたい"),
  q("ichirinsha", "一輪車", "いちりんしゃ"),
];

// ---- u6: 健康夫氏祝貨児器官良徒競芽梅約付清 ----
const U6: ReadingQuestion[] = [
  q("kenkou", "健康", "けんこう"),
  q("kufuu", "工夫", "くふう"),
  q("shimei", "氏名", "しめい", ["使命", "指名"]),
  q("iwau", "祝う", "いわう"),
  q("shukujitsu", "祝日", "しゅくじつ"),
  q("kamotsu", "貨物", "かもつ"),
  q("jidou", "児童", "じどう", ["自動"]),
  q("gakki", "楽器", "がっき", ["学期"]),
  q("kikan", "器官", "きかん", ["機関", "期間", "気管"]),
  q("yoi", "良い", "よい", ["いい"]),
  q("seito", "生徒", "せいと", ["生徒会"]),
  q("kyousou", "競争", "きょうそう", ["競走"]),
  q("me", "芽", "め", ["目", "眼"]),
  q("ume", "梅", "うめ"),
  q("yakusoku", "約束", "やくそく"),
  q("tsukeru", "付ける", "つける", ["着ける", "点ける", "漬ける"]),
  q("seisho", "清書", "せいしょ"),
];

// ---- u7: 滋阪徳香媛佐賀崎熊鹿沖縄(都道府県②)+ 熱働栄養満 ----
const U7: ReadingQuestion[] = [
  q("shiga", "滋賀", "しが", ["滋賀県"]),
  q("tokushima", "徳島", "とくしま", ["徳島県"]),
  q("kagawa", "香川", "かがわ", ["香川県"]),
  q("ehime", "愛媛", "えひめ", ["愛媛県"]),
  q("saga", "佐賀", "さが", ["佐賀県"]),
  q("nagasaki", "長崎", "ながさき", ["長崎県"]),
  q("kumamoto", "熊本", "くまもと", ["熊本県"]),
  q("kagoshima", "鹿児島", "かごしま", ["鹿児島県"]),
  q("okinawa", "沖縄", "おきなわ", ["沖縄県"]),
  q("netsu", "熱", "ねつ"),
  q("hataraku", "働く", "はたらく"),
  q("eiyou", "栄養", "えいよう", ["営養"]),
  q("manzoku", "満足", "まんぞく"),
];

export const UNITS: Record<string, ReadingQuestion[]> = {
  "g4-t1-u1": U1,
  "g4-t1-u2": U2,
  "g4-t1-u3": U3,
  "g4-t1-u4": U4,
  "g4-t1-u5": U5,
  "g4-t1-u6": U6,
  "g4-t1-u7": U7,
};

export const ALL_QUESTIONS: ReadingQuestion[] = Object.values(UNITS).flat();

export const QUESTION_POOLS: Record<string, ReadingQuestion[]> = {
  ...UNITS,
  "g4-term1-all": ALL_QUESTIONS,
};
