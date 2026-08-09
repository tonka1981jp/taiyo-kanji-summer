import type { EnemyDefinition } from "../domain/battle/StageDefinition";

// 仕様書 §50: EnemyDefinition(能力)と EnemySkin(見た目)を分離する。
// スキンは現在絵文字ベース。本番アート導入時は spriteKey に差し替える。

export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  { id: "slime", name: "スライム" },
  { id: "horn_rabbit", name: "ツノウサギ" },
  { id: "mush_goblin", name: "キノコゴブリン" },
  { id: "grass_golem", name: "草原ゴーレム" },
  { id: "grass_dragon", name: "草原のぬし ドラゴン" },
  { id: "wind_bird", name: "かぜのとり" },
  { id: "elder_treant", name: "もりのぬし トレント" },
];

export const ENEMY_MAP: Map<string, EnemyDefinition> = new Map(
  ENEMY_DEFINITIONS.map((e) => [e.id, e]),
);

export interface EnemySkin {
  enemyId: string;
  /** 生成アート(public/game/enemies/)。無ければ emoji にフォールバック */
  image?: string;
  emoji: string;
}

export const ENEMY_SKINS: Record<string, EnemySkin> = {
  slime: { enemyId: "slime", image: "/game/enemies/slime.png", emoji: "🟢" },
  horn_rabbit: {
    enemyId: "horn_rabbit",
    image: "/game/enemies/horn_rabbit.png",
    emoji: "🐰",
  },
  mush_goblin: {
    enemyId: "mush_goblin",
    image: "/game/enemies/mush_goblin.png",
    emoji: "🍄",
  },
  grass_golem: {
    enemyId: "grass_golem",
    image: "/game/enemies/grass_golem.png",
    emoji: "🗿",
  },
  grass_dragon: {
    enemyId: "grass_dragon",
    image: "/game/enemies/grass_dragon.png",
    emoji: "🐉",
  },
  wind_bird: {
    enemyId: "wind_bird",
    image: "/game/enemies/wind_bird.png",
    emoji: "🐦",
  },
  elder_treant: {
    enemyId: "elder_treant",
    image: "/game/enemies/elder_treant.png",
    emoji: "🌳",
  },
};
