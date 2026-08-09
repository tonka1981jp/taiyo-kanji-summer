import type { StageSummary } from "../../application/BattleRenderer";
import type { StageDefinition } from "../../domain/battle/StageDefinition";
import type { AudioManager } from "../../infrastructure/audio/AudioManager";
import type { RareCardDef } from "../../data/cards";

export interface ResultSceneProps {
  summary: StageSummary;
  nextStage: StageDefinition | null;
  droppedCard: { card: RareCardDef; isNew: boolean; count: number } | null;
  onNext: (stage: StageDefinition) => void;
  onTitle: () => void;
}

export class ResultScene {
  constructor(
    private root: HTMLElement,
    private audio: AudioManager,
  ) {}

  mount(props: ResultSceneProps): void {
    const { summary, nextStage, droppedCard } = props;

    // クリアジングル(Suno音源が無ければコード生成SEで代用)
    this.audio.playJingle("clear", "stage.clear");
    window.setTimeout(() => this.audio.play("reward.treasure"), 900);
    const minutes = Math.floor(summary.elapsedMs / 60000);
    const seconds = Math.round((summary.elapsedMs % 60000) / 1000);

    this.root.innerHTML = `
      <div class="screen result-screen">
        <h1 class="title">STAGE CLEAR!</h1>
        <p class="result-stage-name">${summary.stageName}</p>
        <div class="treasure">🎁</div>
        ${
          droppedCard
            ? `<div class="drop-card rcard owned rarity-${droppedCard.card.rarity.toLowerCase()}" style="--card-bg: url('${droppedCard.card.bgUrl}')">
                 <span class="rcard-rarity">${droppedCard.card.rarity}</span>
                 <img class="rcard-img" src="${droppedCard.card.image}" alt="" draggable="false" />
                 <span class="rcard-name">${droppedCard.card.name}</span>
                 <i class="kcard-shine"></i>
               </div>
               <p class="drop-label">${
                 droppedCard.isNew
                   ? "✨ あたらしいカードを ゲット！"
                   : `カードを ゲット！(×${droppedCard.count})`
               }</p>`
            : ""
        }
        <table class="stats">
          <tr><td>よんだ かいすう</td><td>${summary.utterances}</td></tr>
          <tr><td>せいかい</td><td>${summary.correct}</td></tr>
          <tr><td>さいだいコンボ</td><td>${summary.maxCombo}</td></tr>
          <tr><td>かかった じかん</td><td>${minutes}ふん${seconds}びょう</td></tr>
        </table>
        ${
          nextStage
            ? `<button id="next-btn" class="start-btn">つぎへ ▶ ${nextStage.name}</button>`
            : `<p class="all-clear">WORLD 1 ぜんぶクリア！ すごい！</p>`
        }
        <button id="title-btn" class="start-btn secondary">タイトルへ</button>
      </div>
    `;

    this.root.querySelector("#next-btn")?.addEventListener("click", () => {
      this.audio.play("ui.tap");
      if (nextStage) props.onNext(nextStage);
    });
    this.root.querySelector("#title-btn")?.addEventListener("click", () => {
      this.audio.play("ui.tap");
      props.onTitle();
    });
  }
}
