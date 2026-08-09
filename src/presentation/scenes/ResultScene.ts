import type { StageSummary } from "../../application/BattleRenderer";
import type { StageDefinition } from "../../domain/battle/StageDefinition";

export interface ResultSceneProps {
  summary: StageSummary;
  nextStage: StageDefinition | null;
  onNext: (stage: StageDefinition) => void;
  onTitle: () => void;
}

export class ResultScene {
  constructor(private root: HTMLElement) {}

  mount(props: ResultSceneProps): void {
    const { summary, nextStage } = props;
    const minutes = Math.floor(summary.elapsedMs / 60000);
    const seconds = Math.round((summary.elapsedMs % 60000) / 1000);

    this.root.innerHTML = `
      <div class="screen result-screen">
        <h1 class="title">STAGE CLEAR!</h1>
        <p class="result-stage-name">${summary.stageName}</p>
        <div class="treasure">🎁</div>
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
      if (nextStage) props.onNext(nextStage);
    });
    this.root
      .querySelector("#title-btn")
      ?.addEventListener("click", () => props.onTitle());
  }
}
