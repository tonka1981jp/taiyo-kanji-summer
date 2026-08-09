import { KANJI_LIST } from "../../data/kanji";
import { ALL_QUESTIONS } from "../../data/questions";
import { RARE_CARDS, kanjiCardLook } from "../../data/cards";
import type { CollectionStore } from "../../infrastructure/storage/CollectionStore";
import type { AudioManager } from "../../infrastructure/audio/AudioManager";

// コレクション画面。
// 漢字カード: 背景10種(AI生成) × 枠色相・光沢角(ハッシュ)で1枚ずつ違って見せる。
// 漢字そのものはコードで重ねる(画像に文字を焼かない方針 §5)。

export interface CollectionSceneProps {
  collection: CollectionStore;
  onBack: () => void;
}

export class CollectionScene {
  constructor(
    private root: HTMLElement,
    private audio: AudioManager,
  ) {}

  mount(props: CollectionSceneProps): void {
    const { collection } = props;

    const kanjiCards = KANJI_LIST.map((k) => {
      const state = collection.kanjiState(k);
      if (!state) {
        return `<div class="kcard locked"><span class="kcard-q">?</span></div>`;
      }
      const look = kanjiCardLook(k);
      const words = ALL_QUESTIONS.filter((q) => q.text.includes(k))
        .map((q) => q.text)
        .slice(0, 2);
      return `
        <div class="kcard owned" style="--card-bg: url('${look.bgUrl}'); --card-hue: ${look.hue}deg; --shine-angle: ${look.shineAngle}deg;">
          <span class="kcard-kanji">${k}</span>
          <span class="kcard-words">${words.join("・")}</span>
          <i class="kcard-shine"></i>
        </div>`;
    }).join("");

    const rareCards = RARE_CARDS.map((c) => {
      const state = collection.rareState(c.id);
      if (!state) {
        return `
          <div class="rcard locked">
            <span class="kcard-q">?</span>
            <span class="rcard-name">？？？</span>
          </div>`;
      }
      return `
        <div class="rcard owned rarity-${c.rarity.toLowerCase()}" style="--card-bg: url('${c.bgUrl}')">
          <span class="rcard-rarity">${c.rarity}</span>
          <img class="rcard-img" src="${c.image}" alt="" draggable="false" />
          <span class="rcard-name">${c.name}</span>
          ${state.count > 1 ? `<span class="rcard-count">×${state.count}</span>` : ""}
          <i class="kcard-shine"></i>
        </div>`;
    }).join("");

    this.root.innerHTML = `
      <div class="screen collection-screen">
        <header class="collection-header">
          <button id="back-btn" class="back-btn">◀ もどる</button>
          <span class="collection-title">📖 コレクション</span>
          <span class="collection-progress">${collection.kanjiCount} / ${KANJI_LIST.length}</span>
        </header>

        <div class="collection-tabs">
          <button class="tab-btn active" data-tab="kanji">かんじ</button>
          <button class="tab-btn" data-tab="rare">レアカード</button>
        </div>

        <div class="collection-body">
          <div class="tab-panel active" data-panel="kanji">
            <div class="kanji-grid">${kanjiCards}</div>
          </div>
          <div class="tab-panel" data-panel="rare">
            <p class="rare-hint">ステージクリアの たからばこから 手に入るよ！</p>
            <div class="rare-grid">${rareCards}</div>
          </div>
        </div>

        <button id="export-btn" class="collection-export">コレクションを ほぞん(JSON)</button>
      </div>
    `;

    this.root.querySelector("#back-btn")?.addEventListener("click", () => {
      this.audio.play("ui.tap");
      props.onBack();
    });

    this.root.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.audio.play("ui.tap");
        this.root
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.toggle("active", b === btn));
        this.root.querySelectorAll<HTMLElement>(".tab-panel").forEach((p) => {
          p.classList.toggle("active", p.dataset.panel === btn.dataset.tab);
        });
      });
    });

    this.root.querySelector("#export-btn")?.addEventListener("click", () => {
      this.audio.play("ui.tap");
      const blob = new Blob([collection.exportJson()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kanji-collection-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
