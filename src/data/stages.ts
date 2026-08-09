import type { StageDefinition } from "../domain/battle/StageDefinition";

// WORLD 1「はじまりの草原」(§14)。
// 1ステージ = 8〜12問・3〜5分(§15, §43)を想定したHP配分。
// 通常正解 20〜30ダメージ、コンボで伸びる前提。

export const STAGES: StageDefinition[] = [
  {
    id: "world1-stage1",
    worldId: "world1",
    name: "はじまりの草原",
    questionPoolId: "g4-term1-001",
    encounters: [
      { enemyId: "slime", hp: 60 },
      { enemyId: "horn_rabbit", hp: 80 },
      { enemyId: "grass_golem", hp: 130, isBoss: true },
    ],
  },
  {
    id: "world1-stage2",
    worldId: "world1",
    name: "ゆうぐれの草原",
    questionPoolId: "g4-term1-001",
    encounters: [
      { enemyId: "horn_rabbit", hp: 70 },
      { enemyId: "mush_goblin", hp: 90 },
      { enemyId: "grass_golem", hp: 150, isBoss: true },
    ],
  },
  {
    id: "world1-stage3",
    worldId: "world1",
    name: "草原のぬし",
    questionPoolId: "g4-term1-001",
    encounters: [
      { enemyId: "slime", hp: 60 },
      { enemyId: "mush_goblin", hp: 90 },
      { enemyId: "grass_dragon", hp: 200, isBoss: true },
    ],
  },
];

export function findStage(id: string): StageDefinition | undefined {
  return STAGES.find((s) => s.id === id);
}

export function nextUnclearedStage(clearedIds: string[]): StageDefinition {
  return STAGES.find((s) => !clearedIds.includes(s.id)) ?? STAGES[STAGES.length - 1];
}
