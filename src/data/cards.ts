import { ENEMY_MAP, ENEMY_SKINS } from "./enemies";

// カードの見た目定義。
// 背景画像はAI生成10種に固定し(API費用の上限)、
// 字ごとの背景割当・枠の色相・光沢角度はハッシュで決定論的に変化させる。
// → 同じ字はいつ見ても同じカードになり、種類は 10背景 × 色相 × 装飾 で広がる。

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
  /** 枠のアクセント色相(deg) */
  hue: number;
  /** 光沢の角度(deg) */
  shineAngle: number;
}

export function kanjiCardLook(kanji: string): KanjiCardLook {
  const h = stableHash(kanji);
  const bg = CARD_BG_NAMES[h % CARD_BG_COUNT];
  return {
    bgUrl: `/game/cards/${bg}.jpg`,
    hue: (h >> 3) % 360,
    shineAngle: 100 + ((h >> 7) % 60),
  };
}

// ---------- レアカード(宝箱ドロップ) ----------

export type Rarity = "R" | "SR";

export interface RareCardDef {
  id: string; // enemyId
  name: string;
  image: string;
  rarity: Rarity;
  bgUrl: string;
}

const RARITY_MAP: Record<string, Rarity> = {
  grass_dragon: "SR",
  elder_treant: "SR",
};

const RARE_CARD_BG: Record<Rarity, string> = {
  R: "/game/cards/meadow.jpg",
  SR: "/game/cards/gold.jpg",
};

export const RARE_CARDS: RareCardDef[] = [...ENEMY_MAP.values()].map((def) => {
  const rarity = RARITY_MAP[def.id] ?? "R";
  return {
    id: def.id,
    name: def.name,
    image: ENEMY_SKINS[def.id]?.image ?? "",
    rarity,
    bgUrl: RARE_CARD_BG[rarity],
  };
});

export function rareCardById(id: string): RareCardDef | undefined {
  return RARE_CARDS.find((c) => c.id === id);
}
