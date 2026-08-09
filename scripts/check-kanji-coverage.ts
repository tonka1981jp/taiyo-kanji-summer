// 小4・1学期 配当漢字102字が問題データに漏れなく含まれるかの機械検証。
//   npx tsx scripts/check-kanji-coverage.ts

import { ALL_QUESTIONS, UNITS } from "../src/data/questions";
import { KANJI_LIST } from "../src/data/kanji";

const TARGET_KANJI = KANJI_LIST;

console.log(`対象漢字: ${TARGET_KANJI.length} 字 / 問題数: ${ALL_QUESTIONS.length} 問\n`);

// 1) カバレッジ: 各漢字がどの問題に含まれるか
const missing: string[] = [];
const coverage = new Map<string, string[]>();
for (const k of TARGET_KANJI) {
  const words = ALL_QUESTIONS.filter((qu) => qu.text.includes(k)).map((qu) => qu.text);
  coverage.set(k, words);
  if (words.length === 0) missing.push(k);
}

if (missing.length > 0) {
  console.log(`❌ 漏れ: ${missing.join("・")}`);
} else {
  console.log("✅ 102字すべてカバー(漏れなし)");
}

// 2) 問題側の検査: 対象外の漢字(習っていない字)が混ざっていないか
const targetSet = new Set(TARGET_KANJI);
// 小3までの既習字・かなは出題語に含まれてよい。ここでは「小5以上の字」の混入だけ人力確認用に列挙
const kanjiInWords = new Set(
  ALL_QUESTIONS.flatMap((qu) => [...qu.text].filter((c) => /[一-鿿]/.test(c))),
);
const outside = [...kanjiInWords].filter((k) => !targetSet.has(k));
console.log(`\n出題語に含まれる対象外の漢字(既習字なら問題なし): ${outside.join("・") || "なし"}`);

// 3) accepted の整合: reading が accepted に含まれるか / ID重複
const idSet = new Set<string>();
let ok = true;
for (const qu of ALL_QUESTIONS) {
  if (!qu.accepted.includes(qu.reading)) {
    console.log(`❌ ${qu.text}: accepted に reading が無い`);
    ok = false;
  }
  if (idSet.has(qu.id)) {
    console.log(`❌ ID重複: ${qu.id}`);
    ok = false;
  }
  idSet.add(qu.id);
}
if (ok) console.log("✅ accepted整合・ID一意性 OK");

// 4) 単元サイズ(1ステージ9〜12問に対して十分か)
console.log("\n単元プールのサイズ:");
for (const [id, pool] of Object.entries(UNITS)) {
  const mark = pool.length >= 13 ? "✅" : "⚠ (1ステージの出題数を下回る可能性)";
  console.log(`  ${id}: ${pool.length} 問 ${mark}`);
}

// 5) 音訓ペアの確認用: 同じ漢字を含む問題が2語以上ある字
const pairs = [...coverage.entries()].filter(([, w]) => w.length >= 2);
console.log(`\n2語以上で出題される字: ${pairs.length} 字`);
console.log(
  pairs.map(([k, w]) => `${k}(${w.join("/")})`).join(" "),
);

process.exit(missing.length > 0 || !ok ? 1 : 0);
