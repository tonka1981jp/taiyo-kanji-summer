import type { StageDefinition } from "../domain/battle/StageDefinition";

// 2ワールド×7ステージ。単元プール(u1〜u7)を1ステージ1単元で割り当てる。
// 1ステージ = 9〜12問・3〜5分(§15, §43)を想定したHP配分。

export const WORLD_NAMES: Record<string, string> = {
  world1: "WORLD 1 はじまりの草原",
  world2: "WORLD 2 ささやきの森",
};

export const STAGES: StageDefinition[] = [
  {
    id: "world1-stage1",
    worldId: "world1",
    name: "くさはらの いりぐち",
    questionPoolId: "g4-t1-u1",
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
    questionPoolId: "g4-t1-u2",
    encounters: [
      { enemyId: "horn_rabbit", hp: 70 },
      { enemyId: "mush_goblin", hp: 90 },
      { enemyId: "grass_golem", hp: 150, isBoss: true },
    ],
  },
  {
    id: "world1-stage3",
    worldId: "world1",
    name: "にっぽん りょこう",
    questionPoolId: "g4-t1-u3",
    encounters: [
      { enemyId: "slime", hp: 60 },
      { enemyId: "wind_bird", hp: 90 },
      { enemyId: "grass_golem", hp: 150, isBoss: true },
    ],
  },
  {
    id: "world1-stage4",
    worldId: "world1",
    name: "草原のぬし",
    questionPoolId: "g4-t1-u4",
    encounters: [
      { enemyId: "mush_goblin", hp: 80 },
      { enemyId: "wind_bird", hp: 90 },
      { enemyId: "grass_dragon", hp: 200, isBoss: true },
    ],
  },
  {
    id: "world2-stage1",
    worldId: "world2",
    name: "もりの いりぐち",
    questionPoolId: "g4-t1-u5",
    encounters: [
      { enemyId: "wind_bird", hp: 70 },
      { enemyId: "mush_goblin", hp: 90 },
      { enemyId: "grass_golem", hp: 150, isBoss: true },
    ],
  },
  {
    id: "world2-stage2",
    worldId: "world2",
    name: "しんぴの こみち",
    questionPoolId: "g4-t1-u6",
    encounters: [
      { enemyId: "horn_rabbit", hp: 80 },
      { enemyId: "wind_bird", hp: 90 },
      { enemyId: "elder_treant", hp: 170, isBoss: true },
    ],
  },
  {
    id: "world2-stage3",
    worldId: "world2",
    name: "もりのぬし",
    questionPoolId: "g4-t1-u7",
    encounters: [
      { enemyId: "wind_bird", hp: 80 },
      { enemyId: "grass_golem", hp: 100 },
      { enemyId: "elder_treant", hp: 190, isBoss: true },
    ],
  },
];

export function findStage(id: string): StageDefinition | undefined {
  return STAGES.find((s) => s.id === id);
}

export function nextUnclearedStage(clearedIds: string[]): StageDefinition {
  return STAGES.find((s) => !clearedIds.includes(s.id)) ?? STAGES[STAGES.length - 1];
}
