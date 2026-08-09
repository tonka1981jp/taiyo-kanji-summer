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

// カイ二乗の棄却点(Wilson–Hilferty 近似)
function chi2Crit(df: number, z: number): number {
  return df * (1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df))) ** 3;
}

interface Draw {
  scenario: "game" | "continuous";
  stageId: string;
  poolId: string;
  stageRun: number;
  posInStage: number;
  questionId: string;
  text: string;
}

const draws: Draw[] = [];
const lines: string[] = [];
const log = (s: string) => lines.push(s);

// ---------- シナリオA: 実ゲーム同等(全7ステージを周回・全問正解プレイ) ----------
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
      poolId: stage.questionPoolId,
      stageRun,
      posInStage: pos,
      questionId: q.id,
      text: q.text,
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

// ---------- シナリオB: 全問題プールで連続1セッション ----------
{
  const session = repo.createSession("g4-term1-all");
  for (let i = 0; i < TARGET; i++) {
    const q = session.next();
    draws.push({
      scenario: "continuous",
      stageId: "-",
      poolId: "g4-term1-all",
      stageRun: 0,
      posInStage: i,
      questionId: q.id,
      text: q.text,
    });
  }
}

// ---------- 共通集計 ----------

function uniformityCheck(label: string, ids: string[], poolSize: number) {
  const total = ids.length;
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const expected = total / poolSize;
  let chi2 = 0;
  for (const c of counts.values()) chi2 += (c - expected) ** 2 / expected;
  // 一度も出なかった問題の分
  chi2 += (poolSize - counts.size) * expected;
  const df = poolSize - 1;
  const crit5 = chi2Crit(df, 1.6449);
  const crit1 = chi2Crit(df, 2.3263);
  const verdict = chi2 < crit5 ? "一様 ✅" : chi2 < crit1 ? "やや偏り ⚠" : "有意な偏り ❌";
  const sorted = [...counts.values()].sort((a, b) => b - a);
  log(
    `  ${label}: n=${total} 期待${expected.toFixed(1)}/問 ` +
      `最多${sorted[0]} 最少${Math.min(...sorted, ...(counts.size < poolSize ? [0] : []))} ` +
      `χ²=${chi2.toFixed(1)} (df=${df}, 5%点${crit5.toFixed(1)}) → ${verdict}`,
  );
  return { counts };
}

function adjacency(ids: string[]): number {
  let n = 0;
  for (let i = 1; i < ids.length; i++) if (ids[i] === ids[i - 1]) n++;
  return n;
}

// ---- シナリオA ----
const game = draws.filter((d) => d.scenario === "game");
log(`===== シナリオA: 実ゲーム(7ステージ周回・${game.length}問) =====`);
log(`単元プール内の一様性:`);
for (const poolId of Object.keys(QUESTION_POOLS).filter((p) => p.startsWith("g4-t1-u"))) {
  const ids = game.filter((d) => d.poolId === poolId).map((d) => d.questionId);
  if (ids.length > 0) uniformityCheck(poolId, ids, QUESTION_POOLS[poolId].length);
}

{
  const ids = game.map((d) => d.questionId);
  const rep = adjacency(ids);
  const byStage = new Map<number, string[]>();
  for (const d of game) {
    if (!byStage.has(d.stageRun)) byStage.set(d.stageRun, []);
    byStage.get(d.stageRun)!.push(d.questionId);
  }
  let withinDup = 0;
  for (const qs of byStage.values()) if (new Set(qs).size !== qs.length) withinDup++;
  const lens = [...byStage.values()].map((v) => v.length);
  log(`ステージ数: ${byStage.size} / 問題数: 平均${(ids.length / byStage.size).toFixed(1)} (${Math.min(...lens)}〜${Math.max(...lens)})`);
  log(`ステージ内の同一問題重複: ${withinDup} ${withinDup === 0 ? "✅" : "⚠"}`);
  log(`隣接重複(全体・境界含む): ${rep} 回(境界重複は許容方針)`);
}

// ---- シナリオB ----
const cont = draws.filter((d) => d.scenario === "continuous");
log(`\n===== シナリオB: 全109問プールで連続1セッション(${cont.length}問) =====`);
uniformityCheck("g4-term1-all", cont.map((d) => d.questionId), QUESTION_POOLS["g4-term1-all"].length);
log(`隣接重複: ${adjacency(cont.map((d) => d.questionId))} 回`);

// ---------- 出力 ----------
mkdirSync("logs", { recursive: true });
writeFileSync("logs/question-sim.log", lines.join("\n"));
writeFileSync(
  "logs/question-sim.json",
  JSON.stringify({ generatedAt: new Date().toISOString(), target: TARGET, draws }, null, 1),
);
console.log(lines.join("\n"));
console.log(`\nログ: logs/question-sim.log / logs/question-sim.json`);
