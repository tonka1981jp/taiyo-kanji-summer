// 出題傾向シミュレータ。
// 実装そのもの(QuestionSession / BattleEngine / ステージ定義)を使い、
// 出題列を大量生成して偏りを統計チェックする。
//
//   npx tsx scripts/simulate-questions.ts [目標出題数=1000]
//
// 出力: logs/question-sim.log(サマリ) / logs/question-sim.json(全出題列)

import { mkdirSync, writeFileSync } from "node:fs";
import { QuestionRepository } from "../src/domain/learning/QuestionRepository";
import { BattleEngine } from "../src/domain/battle/BattleEngine";
import { QUESTION_POOLS } from "../src/data/questions";
import { STAGES } from "../src/data/stages";
import { ENEMY_MAP } from "../src/data/enemies";

const TARGET = Number(process.argv[2] ?? 1000);
const repo = new QuestionRepository(QUESTION_POOLS);
const POOL = QUESTION_POOLS["g4-term1-001"];
const N = POOL.length;

interface Draw {
  scenario: "game" | "continuous";
  stageId: string;
  stageRun: number; // 何周目のステージか
  posInStage: number;
  questionId: string;
}

const draws: Draw[] = [];

// ---------- シナリオA: 実ゲーム同等 ----------
// App と同じく「ステージ開始ごとに新セッション」。
// 問題数は BattleEngine のダメージ計算(全問正解プレイ)で決まる。
let stageRun = 0;
let gameDraws = 0;
while (gameDraws < TARGET) {
  const stage = STAGES[stageRun % STAGES.length];
  const session = repo.createSession(stage.questionPoolId);
  const engine = new BattleEngine(stage, ENEMY_MAP);
  engine.start();
  let pos = 0;
  for (;;) {
    const q = session.next();
    draws.push({
      scenario: "game",
      stageId: stage.id,
      stageRun,
      posInStage: pos,
      questionId: q.id,
    });
    gameDraws++;
    pos++;
    engine.beginQuestion();
    const events = engine.submitEvaluation(
      { type: "CORRECT", normalizedTranscript: q.reading, matched: q.reading },
      q.reading,
    );
    if (events.some((e) => e.type === "STAGE_CLEARED")) break;
  }
  stageRun++;
}

// ---------- シナリオB: 連続1セッション ----------
// 将来の連続プレイ相当(セッションを作り直さず TARGET 回引く)
{
  const session = repo.createSession("g4-term1-001");
  for (let i = 0; i < TARGET; i++) {
    const q = session.next();
    draws.push({
      scenario: "continuous",
      stageId: "-",
      stageRun: 0,
      posInStage: i,
      questionId: q.id,
    });
  }
}

// ---------- 集計 ----------

const lines: string[] = [];
const log = (s: string) => lines.push(s);

function analyze(scenario: "game" | "continuous") {
  const seq = draws.filter((d) => d.scenario === scenario);
  const ids = seq.map((d) => d.questionId);
  const total = ids.length;

  // 出現回数
  const counts = new Map<string, number>(POOL.map((q) => [q.id, 0]));
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);

  // カイ二乗(一様性)
  const expected = total / N;
  let chi2 = 0;
  for (const c of counts.values()) chi2 += (c - expected) ** 2 / expected;

  // 連続同一(隣接重複)
  let immediateRepeats = 0;
  for (let i = 1; i < ids.length; i++) {
    if (ids[i] === ids[i - 1]) immediateRepeats++;
  }

  // 同一問題の出現間隔
  const lastSeen = new Map<string, number>();
  const gaps: number[] = [];
  ids.forEach((id, i) => {
    const prev = lastSeen.get(id);
    if (prev !== undefined) gaps.push(i - prev);
    lastSeen.set(id, i);
  });
  gaps.sort((a, b) => a - b);
  const gapMin = gaps[0] ?? 0;
  const gapMedian = gaps[Math.floor(gaps.length / 2)] ?? 0;
  const shortGaps = gaps.filter((g) => g <= 3).length;

  log(`\n===== シナリオ ${scenario === "game" ? "A: 実ゲーム(ステージごと新セッション)" : "B: 連続1セッション"} =====`);
  log(`総出題数: ${total}`);
  log(`期待値: 各問題 ${expected.toFixed(1)} 回 (${(100 / N).toFixed(2)}%)`);
  log(`\n問題別出現数:`);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [id, c] of sorted) {
    const q = POOL.find((p) => p.id === id)!;
    const pct = ((c / total) * 100).toFixed(2);
    const bar = "#".repeat(Math.round(c / (expected / 10)));
    log(`  ${q.text.padEnd(4, "　")} ${String(c).padStart(4)} (${pct}%) ${bar}`);
  }
  const cs = sorted.map(([, c]) => c);
  log(`\n最多/最少: ${cs[0]} / ${cs[cs.length - 1]} (比 ${(cs[0] / cs[cs.length - 1]).toFixed(2)})`);
  log(`カイ二乗: ${chi2.toFixed(2)} (df=${N - 1}, 5%棄却点=30.14, 1%棄却点=36.19)`);
  log(`  → ${chi2 < 30.14 ? "一様分布と矛盾しない ✅" : chi2 < 36.19 ? "やや偏りあり ⚠" : "有意な偏り ❌"}`);
  log(`隣接重複(同じ問題が連続): ${immediateRepeats} 回 ${immediateRepeats === 0 ? "✅" : "❌"}`);
  log(`同一問題の再出現間隔: 最小 ${gapMin} / 中央値 ${gapMedian} / 間隔3以下 ${shortGaps} 回`);

  return { seq, ids, counts };
}

const a = analyze("game");
analyze("continuous");

// ---------- シナリオA特有の追加チェック ----------

// ステージ境界をまたぐ隣接重複(前ステージ最後 = 次ステージ最初)
{
  const byStage = new Map<number, string[]>();
  for (const d of a.seq) {
    if (!byStage.has(d.stageRun)) byStage.set(d.stageRun, []);
    byStage.get(d.stageRun)!.push(d.questionId);
  }
  const runs = [...byStage.keys()].sort((x, y) => x - y);
  let boundaryRepeats = 0;
  for (let i = 1; i < runs.length; i++) {
    const prev = byStage.get(runs[i - 1])!;
    const cur = byStage.get(runs[i])!;
    if (prev[prev.length - 1] === cur[0]) boundaryRepeats++;
  }
  // ステージ内の同一問題重複
  let withinDup = 0;
  for (const qs of byStage.values()) {
    if (new Set(qs).size !== qs.length) withinDup++;
  }
  const stageLens = [...byStage.values()].map((q) => q.length);
  const lenMin = Math.min(...stageLens);
  const lenMax = Math.max(...stageLens);
  const lenAvg = stageLens.reduce((x, y) => x + y, 0) / stageLens.length;

  log(`\n===== シナリオA 追加チェック =====`);
  log(`ステージ数: ${runs.length} / 1ステージの問題数: 平均 ${lenAvg.toFixed(1)} (${lenMin}〜${lenMax})`);
  log(`ステージ内で同じ問題が2回出たステージ: ${withinDup} ${withinDup === 0 ? "✅" : "⚠"}`);
  log(
    `ステージ境界の隣接重複(前の最後=次の最初): ${boundaryRepeats} 回 / ${runs.length - 1} 境界 ` +
      `(${(((boundaryRepeats) / (runs.length - 1)) * 100).toFixed(1)}%, 理論値≈${(100 / N).toFixed(1)}%)`,
  );

  // 1問目の分布(シャッフルの位置バイアス確認)
  const firstCounts = new Map<string, number>();
  for (const qs of byStage.values()) {
    firstCounts.set(qs[0], (firstCounts.get(qs[0]) ?? 0) + 1);
  }
  const firstSorted = [...firstCounts.entries()].sort((x, y) => y[1] - x[1]);
  log(`\nステージ1問目の分布(上位5 / 期待 ${(runs.length / N).toFixed(1)} 回):`);
  for (const [id, c] of firstSorted.slice(0, 5)) {
    const q = POOL.find((p) => p.id === id)!;
    log(`  ${q.text}: ${c} 回`);
  }
}

// ---------- 出力 ----------
mkdirSync("logs", { recursive: true });
writeFileSync("logs/question-sim.log", lines.join("\n"));
writeFileSync(
  "logs/question-sim.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), target: TARGET, draws }, null, 1),
);
console.log(lines.join("\n"));
console.log(`\nログ: logs/question-sim.log / logs/question-sim.json`);
