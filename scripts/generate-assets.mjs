#!/usr/bin/env node
// 画像パイプライン仕様書に基づくアセット量産スクリプト。
//
// 使い方:
//   OPENAI_API_KEY を .env(リポジトリ直下)か環境変数で渡した上で、
//
//   node scripts/generate-assets.mjs enemies            # 敵バッチ(§22.1)
//   node scripts/generate-assets.mjs backgrounds        # 背景バッチ(§22.2)
//   node scripts/generate-assets.mjs bosses
//   node scripts/generate-assets.mjs ui                 # UIバッチ(§22.3)
//   node scripts/generate-assets.mjs effects
//   node scripts/generate-assets.mjs player
//   node scripts/generate-assets.mjs enemies --item slime --count 3   # 個別・複数候補
//
// 出力: assets/concepts/<category>__<theme>__<name>__vNN.png(命名規則 §8)
// 採用したものを手動で assets/final/ へ移し、基準画像として扱う(§18)。

import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT_DIR = path.join(ROOT, "assets", "concepts");

// §13.1: 毎回入れるルック固定文
// 「ピクセル風味はあるが古すぎない」= Modern Pixel Fantasy(アート仕様 §7)
const STYLE_LOCK =
  "Smartphone fantasy RPG game asset for elementary school children. " +
  "Modern pixel-fantasy style: pixel-art flavor with smooth detailed shading, " +
  "NOT extremely low-resolution 8-bit retro. Bright colors, readable silhouette, " +
  "not scary, cute but slightly cool, consistent game-asset look, polished quality.";

// gpt-image-2 は透過出力非対応のため、マゼンタ単色で生成して
// scripts/strip_magenta.py でクロマキー抜きする(background: "transparent" のカテゴリ)
const CHROMA_BG =
  "The subject is isolated on a completely flat, uniform, solid bright magenta background (#FF00FF). " +
  "No checkerboard pattern, no gradient, no background scenery, no shadow cast on the background.";

// §21.1: アセット種別ごとにテンプレートを分ける(§11)
const CATEGORIES = {
  enemies: {
    size: "1024x1024",
    background: "transparent",
    template: (item) =>
      `${STYLE_LOCK} Draw a single enemy character: ${item.desc}. ` +
      "Full body, centered composition, clean outline, " + CHROMA_BG + " " +
      "front-facing or slightly angled, feet visible with a little margin below.",
    items: [
      { theme: "grassland", name: "slime", desc: "a cheerful round grassland slime, green, bouncy, friendly" },
      { theme: "grassland", name: "horn_rabbit", desc: "an energetic small rabbit with one tiny horn, mischievous" },
      { theme: "grassland", name: "mushroom_soldier", desc: "a small mushroom soldier with a leaf shield, comical" },
      { theme: "grassland", name: "wind_bird", desc: "a swift small wind bird with light blue feathers" },
      { theme: "grassland", name: "grass_golem", desc: "a mossy rock golem covered in grass, sturdy but friendly-faced" },
    ],
  },
  bosses: {
    size: "1024x1024",
    background: "transparent",
    template: (item) =>
      `${STYLE_LOCK} Draw a boss enemy: ${item.desc}. ` +
      "Exciting and memorable, a little intimidating but not scary, strong silhouette, " +
      "larger and more detailed than a normal enemy. Full body, centered. " + CHROMA_BG,
    items: [
      { theme: "grassland", name: "grass_dragon", desc: "a young green dragon, guardian of the meadow, proud but kid-friendly" },
      { theme: "forest", name: "elder_treant", desc: "a big walking tree guardian with glowing leaves, majestic but gentle" },
    ],
  },
  backgrounds: {
    size: "1024x1536",
    background: "opaque",
    template: (item) =>
      `${STYLE_LOCK} Create a vertical battle background: ${item.desc}. ` +
      "Designed so an enemy character and a large kanji card can appear clearly in front: " +
      "keep the center and lower-middle area calm and uncluttered, clean midground and background separation, " +
      "medium detail density, portrait orientation for a phone screen.",
    items: [
      { theme: "grassland", name: "battle", desc: "a bright grassland with rolling hills, blue sky, a few clouds" },
      { theme: "forest", name: "battle", desc: "a whispering forest with soft light beams between trees" },
      { theme: "cave", name: "battle", desc: "a crystal cave with glowing blue crystals, magical but not dark" },
      { theme: "volcano", name: "battle", desc: "a warm volcano area with orange glow, adventurous not menacing" },
      { theme: "ruins", name: "battle", desc: "floating sky ruins with starry twilight, wondrous" },
      {
        theme: "title",
        name: "vista",
        desc:
          "an epic bright adventure vista seen from a grassy hilltop: rolling green fields, " +
          "a winding path, distant floating islands and a small castle, big blue sky with " +
          "clouds and warm sun rays, the feeling that a grand journey is about to begin. " +
          "Keep the middle of the image relatively calm so a game logo can be placed over it",
      },
    ],
  },
  ui: {
    size: "1024x1024",
    background: "transparent",
    template: (item) =>
      `${STYLE_LOCK} Create a decorative UI asset: ${item.desc}. ` +
      "Clean and readable, slightly magical, bright but not noisy, easy to place text on top, " +
      "no letters or numbers baked into the image. " + CHROMA_BG,
    items: [
      { theme: "panel", name: "kanji_card", desc: "a parchment-style question card frame with a subtle fantasy border" },
      { theme: "panel", name: "hp_frame", desc: "a sturdy horizontal HP bar frame" },
      { theme: "panel", name: "button", desc: "a friendly rounded rectangular button base" },
      { theme: "panel", name: "treasure_chest", desc: "a closed wooden treasure chest with gold trim" },
      { theme: "badge", name: "combo", desc: "a small star-shaped combo badge" },
    ],
  },
  effects: {
    size: "1024x1024",
    background: "transparent",
    template: (item) =>
      `${STYLE_LOCK} Create a single isolated visual effect asset: ${item.desc}. ` +
      "Energetic, bright, readable on a mobile screen, one effect only, " +
      "clean isolated shape. " + CHROMA_BG,
    items: [
      { theme: "slash", name: "light", desc: "a diagonal white-gold sword slash arc" },
      { theme: "critical", name: "burst", desc: "an orange-gold critical hit starburst" },
      { theme: "sparkle", name: "reward", desc: "a cluster of celebratory golden sparkles" },
    ],
  },
  creatures: {
    // レアカード用クリーチャー(バトル敵としても将来使える)
    size: "1024x1024",
    background: "transparent",
    template: (item) =>
      `${STYLE_LOCK} Draw a single fantasy creature: ${item.desc}. ` +
      "Full body, centered composition, clean outline, " + CHROMA_BG + " " +
      "front-facing or slightly angled, a collectible-card hero pose.",
    items: [
      { theme: "crystal", name: "crystal_fox", desc: "a graceful fox made of glowing blue crystal" },
      { theme: "crystal", name: "cave_bat", desc: "a chubby friendly cave bat with big round eyes" },
      { theme: "mountain", name: "rock_turtle", desc: "a sturdy turtle with a mossy rock shell" },
      { theme: "volcano", name: "lava_lizard", desc: "a playful little lizard with glowing lava patterns" },
      { theme: "sky", name: "cloud_sheep", desc: "a fluffy sheep made of white clouds" },
      { theme: "sky", name: "thunder_chick", desc: "a tiny yellow chick crackling with cute lightning sparks" },
      { theme: "sky", name: "sky_whale", desc: "a majestic gentle whale swimming through the sky with small floating islands on its back" },
      { theme: "star", name: "star_jelly", desc: "a translucent jellyfish glowing with tiny stars" },
      { theme: "snow", name: "ice_yeti", desc: "a big fluffy friendly yeti with icy blue fur" },
      { theme: "ghost", name: "ghost_lantern", desc: "a cute round ghost holding a warm glowing lantern, friendly not spooky" },
      { theme: "gold", name: "golden_slime", desc: "a shiny golden slime with a tiny crown, sparkling" },
      { theme: "legend", name: "word_phoenix", desc: "a legendary phoenix with feathers like glowing brush strokes of ink and fire" },
      { theme: "legend", name: "rainbow_dragon", desc: "a legendary majestic dragon with iridescent rainbow scales, proud and dazzling" },
    ],
  },
  cardbg: {
    size: "1024x1536",
    background: "opaque",
    template: (item) =>
      `${STYLE_LOCK} Create a decorative trading-card background: ${item.desc}. ` +
      "Portrait card composition, soft rich colors, ornamental but calm. " +
      "The CENTER must stay simple, slightly darker and uncluttered so a large white kanji " +
      "character can be overlaid and read clearly. Subtle vignette toward the edges. " +
      "No letters, no characters, no border frame (the frame is drawn in code).",
    items: [
      { theme: "deco", name: "meadow", desc: "gentle green meadow with soft light and tiny flowers" },
      { theme: "deco", name: "forest", desc: "deep forest with soft light beams and fireflies" },
      { theme: "deco", name: "sky", desc: "bright blue sky with clouds and distant floating islands" },
      { theme: "deco", name: "crystal", desc: "glowing blue-purple crystal cavern" },
      { theme: "deco", name: "flame", desc: "warm orange ember glow with rising sparks" },
      { theme: "deco", name: "ocean", desc: "calm underwater scene with light rays and bubbles" },
      { theme: "deco", name: "starlight", desc: "starry night sky with a soft nebula" },
      { theme: "deco", name: "sunset", desc: "golden sunset over rolling hills" },
      { theme: "deco", name: "snow", desc: "quiet snowy field with gentle falling snowflakes" },
      { theme: "deco", name: "gold", desc: "royal gold ornamental pattern with soft shine" },
    ],
  },
  player: {
    size: "1024x1024",
    background: "transparent",
    template: (item) =>
      `${STYLE_LOCK} Draw the player hero: ${item.desc}. ` +
      "Gender-neutral young adventurer design, blue-green color scheme, " +
      "a small magical weapon that suggests 'the power of words', full body, " +
      "centered. " + CHROMA_BG,
    items: [
      { theme: "hero", name: "word_knight", desc: "a young hero holding a small glowing sword shaped like a brush stroke" },
    ],
  },
};

async function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function nextVersion(prefix) {
  const files = existsSync(OUT_DIR) ? await readdir(OUT_DIR) : [];
  let max = 0;
  for (const f of files) {
    const m = f.match(new RegExp(`^${prefix}__v(\\d+)\\.png$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

async function requestImage(body, apiKey) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function generate(category, item, model, apiKey) {
  const prompt = category.template(item);
  const body = {
    model,
    prompt,
    size: category.size,
    n: 1,
  };
  // 透過は background パラメータではなくマゼンタ背景+クロマキー後処理で実現する
  // (gpt-image-2 は background: "transparent" 非対応)

  const res = await requestImage(body, apiKey);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    // URL返却モードの場合
    const url = json.data?.[0]?.url;
    if (!url) throw new Error("no image in response");
    const img = await fetch(url);
    return Buffer.from(await img.arrayBuffer());
  }
  return Buffer.from(b64, "base64");
}

async function main() {
  await loadEnv();

  const args = process.argv.slice(2);
  const categoryName = args[0];
  const itemFilter = args.includes("--item")
    ? args[args.indexOf("--item") + 1]
    : null;
  const themeFilter = args.includes("--theme")
    ? args[args.indexOf("--theme") + 1]
    : null;
  const count = args.includes("--count")
    ? Number(args[args.indexOf("--count") + 1])
    : 1;
  // 全カテゴリ gpt-image-2 統一(透過はマゼンタ+クロマキーで実現)
  const model =
    process.env.IMAGE_MODEL ??
    (args.includes("--model") ? args[args.indexOf("--model") + 1] : "gpt-image-2");

  const category = CATEGORIES[categoryName];
  if (!category) {
    console.log("使い方: node scripts/generate-assets.mjs <category> [--item name] [--count N] [--model id]");
    console.log(`カテゴリ: ${Object.keys(CATEGORIES).join(" / ")}`);
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY がありません。リポジトリ直下の .env か環境変数で渡してください。");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const items = category.items.filter(
    (i) =>
      (!itemFilter || i.name === itemFilter) &&
      (!themeFilter || i.theme === themeFilter),
  );
  if (items.length === 0) {
    console.error(`該当するアイテムがありません (item=${itemFilter}, theme=${themeFilter})`);
    process.exit(1);
  }

  // 命名規則(§8)の接頭辞
  const PREFIXES = {
    enemies: "enemy",
    bosses: "boss",
    backgrounds: "bg",
    cardbg: "card",
    creatures: "creature",
    ui: "ui",
    effects: "fx",
    player: "player",
  };

  // §21.2: 1回の実行で1カテゴリのみ。アイテムは直列で生成(レート・ルック管理優先)
  for (const item of items) {
    const prefix = `${PREFIXES[categoryName]}__${item.theme}__${item.name}`;
    for (let i = 0; i < count; i++) {
      const v = await nextVersion(prefix);
      const name = `${prefix}__v${String(v).padStart(2, "0")}.png`;
      process.stdout.write(`生成中: ${name} ... `);
      try {
        const buf = await generate(category, item, model, apiKey);
        const outPath = path.join(OUT_DIR, name);
        await writeFile(outPath, buf);
        if (category.background === "transparent") {
          // マゼンタ背景をクロマキー抜きして実アルファ化
          const strip = spawnSync(
            "python3",
            [path.join(ROOT, "scripts", "strip_magenta.py"), outPath],
            { stdio: "inherit" },
          );
          if (strip.status !== 0) {
            console.log("  (クロマキー抜き失敗: 元画像のまま保存)");
          }
        }
        console.log("OK");
      } catch (err) {
        console.log(`失敗: ${err.message}`);
      }
    }
  }
  console.log(`\n出力先: ${OUT_DIR}`);
  console.log("採用画像は assets/final/ の各カテゴリへ移し、以後の基準画像にする(§18)。");
}

main();
