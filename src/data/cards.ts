import { assetUrl } from "../assetUrl";
import { ENEMY_MAP, ENEMY_SKINS } from "./enemies";

// カードの見た目定義。
// 漢字カード背景はAI生成10種に固定し(API費用の上限)、
// 字ごとの背景割当・枠の色相・光沢角度はハッシュで決定論的に変化させる。

export const CARD_BG_COUNT = 10;
export const CARD_BG_NAMES = [
  "meadow",
  "forest",
  "sky",
  "crystal",
  "flame",
  "ocean",
  "starlight",
  "sunset",
  "snow",
  "gold",
];

/** 文字列 → 安定ハッシュ(セッションをまたいで不変) */
export function stableHash(s: string): number {
  let h = 0;
  for (const ch of s) {
    h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  }
  return h;
}

export interface KanjiCardLook {
  bgUrl: string;
  hue: number;
  shineAngle: number;
}

export function kanjiCardLook(kanji: string): KanjiCardLook {
  const h = stableHash(kanji);
  const bg = CARD_BG_NAMES[h % CARD_BG_COUNT];
  return {
    bgUrl: assetUrl(`game/cards/${bg}.jpg`),
    hue: (h >> 3) % 360,
    shineAngle: 100 + ((h >> 7) % 60),
  };
}

// ---------- レアカード(宝箱ドロップ・全20種) ----------

export type Rarity = "R" | "SR" | "SSR";

export interface RareCardDef {
  id: string;
  name: string;
  image: string;
  rarity: Rarity;
  bgUrl: string;
}

/** 宝箱の排出率 */
export const DROP_RATES: Record<Rarity, number> = {
  R: 0.7,
  SR: 0.24,
  SSR: 0.06,
};

const RARE_CARD_BG: Record<Rarity, string> = {
  R: assetUrl("game/cards/meadow.jpg"),
  SR: assetUrl("game/cards/gold.jpg"),
  SSR: assetUrl("game/cards/starlight.jpg"),
};

/** バトルに登場する敵のカード(7種) */
const BATTLE_RARITY: Record<string, Rarity> = {
  grass_dragon: "SR",
  elder_treant: "SR",
};

const battleCards: RareCardDef[] = [...ENEMY_MAP.values()].map((def) => {
  const rarity = BATTLE_RARITY[def.id] ?? "R";
  return {
    id: def.id,
    name: def.name,
    image: ENEMY_SKINS[def.id]?.image ?? "",
    rarity,
    bgUrl: RARE_CARD_BG[rarity],
  };
});

/** コレクション専用クリーチャーのカード(13種) */
const creature = (id: string, name: string, rarity: Rarity): RareCardDef => ({
  id,
  name,
  image: assetUrl(`game/enemies/${id}.png`),
  rarity,
  bgUrl: RARE_CARD_BG[rarity],
});

const creatureCards: RareCardDef[] = [
  creature("crystal_fox", "クリスタルぎつね", "R"),
  creature("cave_bat", "どうくつコウモリ", "R"),
  creature("rock_turtle", "いわガメ", "R"),
  creature("lava_lizard", "ようがんトカゲ", "R"),
  creature("cloud_sheep", "くもヒツジ", "R"),
  creature("thunder_chick", "かみなりヒヨコ", "R"),
  creature("star_jelly", "ほしクラゲ", "R"),
  creature("ghost_lantern", "ランタンおばけ", "R"),
  creature("sky_whale", "そらクジラ", "SR"),
  creature("ice_yeti", "ゆきのイエティ", "SR"),
  creature("golden_slime", "おうごんスライム", "SR"),
  creature("word_phoenix", "ことばのフェニックス", "SSR"),
  creature("rainbow_dragon", "にじいろドラゴン", "SSR"),
];

export const RARE_CARDS: RareCardDef[] = [...battleCards, ...creatureCards];

export function rareCardById(id: string): RareCardDef | undefined {
  return RARE_CARDS.find((c) => c.id === id);
}
