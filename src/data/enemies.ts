import type { EnemyDefinition } from "../domain/battle/StageDefinition";

// 仕様書 §50: EnemyDefinition(能力)と EnemySkin(見た目)を分離する。
// スキンは現在絵文字ベース。本番アート導入時は spriteKey に差し替える。

export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  { id: "slime", name: "スライム" },
  { id: "horn_rabbit", name: "ツノウサギ" },
  { id: "mush_goblin", name: "キノコゴブリン" },
  { id: "grass_golem", name: "草原ゴーレム" },
  { id: "grass_dragon", name: "草原のぬし ドラゴン" },
];

export const ENEMY_MAP: Map<string, EnemyDefinition> = new Map(
  ENEMY_DEFINITIONS.map((e) => [e.id, e]),
);

export interface EnemySkin {
  enemyId: string;
  emoji: string;
}

export const ENEMY_SKINS: Record<string, EnemySkin> = {
  slime: { enemyId: "slime", emoji: "🟢" },
  horn_rabbit: { enemyId: "horn_rabbit", emoji: "🐰" },
  mush_goblin: { enemyId: "mush_goblin", emoji: "🍄" },
  grass_golem: { enemyId: "grass_golem", emoji: "🗿" },
  grass_dragon: { enemyId: "grass_dragon", emoji: "🐉" },
};
