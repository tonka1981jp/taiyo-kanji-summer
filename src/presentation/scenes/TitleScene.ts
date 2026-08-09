import { assetUrl } from "../../assetUrl";
import type { StageDefinition } from "../../domain/battle/StageDefinition";
import type { PlayerProgress } from "../../domain/progression/PlayerProgress";
import type { AudioManager } from "../../infrastructure/audio/AudioManager";
import type { SpeechSupportReport } from "../../infrastructure/speech/SpeechSupportDetector";
import { ENEMY_SKINS } from "../../data/enemies";
import { WORLD_NAMES, nextUnclearedStage } from "../../data/stages";

export interface TitleSceneProps {
  report: SpeechSupportReport;
  progress: PlayerProgress;
  stages: StageDefinition[];
  collectionCount: number;
  onSelectStage: (stage: StageDefinition) => void;
  onOpenCollection: () => void;
}

export class TitleScene {
  constructor(
    private root: HTMLElement,
    private audio: AudioManager,
  ) {}

  mount(props: TitleSceneProps): void {
    const { report, progress, stages } = props;
    const nextStage = nextUnclearedStage(progress.clearedStageIds);

    const stageRow = (s: StageDefinition): string => {
      const cleared = progress.clearedStageIds.includes(s.id);
      const isNext = s.id === nextStage.id && !cleared;
      // ステージの目玉 = 最後のエンカウント(ボス)をアイコンにする
      const bossId = s.encounters[s.encounters.length - 1]?.enemyId;
      const skin = bossId ? ENEMY_SKINS[bossId] : undefined;
      const icon = skin?.image
        ? `<img src="${skin.image}" alt="" draggable="false" />`
        : (skin?.emoji ?? "👾");
      return `
        <button class="stage-card${isNext ? " next" : ""}" data-stage="${s.id}">
          <span class="stage-card-icon">${icon}</span>
          <span class="stage-card-name">${s.name}</span>
          <span class="stage-card-mark">${cleared ? "⭐" : isNext ? "▶" : ""}</span>
        </button>`;
    };

    const worldIds = [...new Set(stages.map((s) => s.worldId))];
    const stageRows = worldIds
      .map(
        (wid) => `
          <p class="stage-list-title">🗺 ${WORLD_NAMES[wid] ?? wid}</p>
          ${stages.filter((s) => s.worldId === wid).map(stageRow).join("")}
        `,
      )
      .join("");

    this.root.innerHTML = `
      <div class="screen title-screen">
        <span class="twinkle t1">✨</span>
        <span class="twinkle t2">✨</span>
        <span class="twinkle t3">⭐</span>

        <div class="title-logo">
          <h1 class="logo-main">かんじ<span class="logo-rpg">RPG</span></h1>
          <p class="logo-sub">こえで よむ ぼうけん</p>
        </div>

        <div class="title-heroes">
          <img class="hero-sprite small bob1" src="${assetUrl("game/enemies/slime.png")}" alt="" draggable="false" />
          <img class="hero-sprite dragon bob2" src="${assetUrl("game/enemies/grass_dragon.png")}" alt="" draggable="false" />
          <img class="hero-sprite small bob3" src="${assetUrl("game/enemies/horn_rabbit.png")}" alt="" draggable="false" />
        </div>

        ${
          report.supported
            ? `<button id="start-btn" class="start-btn title-start">▶ ぼうけんに でる</button>`
            : `<p class="fatal">このブラウザは音声認識に対応していません</p>`
        }

        <button id="collection-btn" class="collection-btn">
          📖 コレクション <span class="collection-badge">${props.collectionCount} / 102</span>
        </button>

        <div class="stage-list">
          ${stageRows}
        </div>

        <details class="support-report title-support">
          <summary>環境チェック</summary>
          <table>
            <tr><td>SpeechRecognition</td><td>${report.hasStandard ? "あり" : "なし"}</td></tr>
            <tr><td>webkitSpeechRecognition</td><td>${report.hasWebkit ? "あり" : "なし"}</td></tr>
            <tr><td>secure context</td><td>${report.isSecureContext ? "OK" : "NG"}</td></tr>
            <tr><td>ホーム画面起動 (PWA)</td><td>${report.isStandalone ? "はい" : "いいえ"}</td></tr>
            <tr><td>processLocally</td><td>${report.hasProcessLocally ? "あり" : "なし"}</td></tr>
          </table>
          <p class="ua">${report.userAgent}</p>
        </details>
      </div>
    `;

    // タイトルBGM(初回はブラウザの自動再生制限で無音。ジェスチャー後の再訪では鳴る)
    this.audio.playBgm("title");

    const select = (stage: StageDefinition): void => {
      this.audio.unlock(); // ユーザージェスチャー内で iOS のオーディオを解錠
      this.audio.play("ui.tap");
      props.onSelectStage(stage);
    };

    this.root
      .querySelector("#start-btn")
      ?.addEventListener("click", () => select(nextStage));

    this.root.querySelector("#collection-btn")?.addEventListener("click", () => {
      this.audio.play("ui.tap");
      props.onOpenCollection();
    });

    this.root.querySelectorAll<HTMLButtonElement>(".stage-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const stage = stages.find((s) => s.id === btn.dataset.stage);
        if (stage) select(stage);
      });
    });
  }
}
