import type { StageDefinition } from "../../domain/battle/StageDefinition";
import type { PlayerProgress } from "../../domain/progression/PlayerProgress";
import type { SpeechSupportReport } from "../../infrastructure/speech/SpeechSupportDetector";
import { nextUnclearedStage } from "../../data/stages";

export interface TitleSceneProps {
  report: SpeechSupportReport;
  progress: PlayerProgress;
  stages: StageDefinition[];
  onSelectStage: (stage: StageDefinition) => void;
}

export class TitleScene {
  constructor(private root: HTMLElement) {}

  mount(props: TitleSceneProps): void {
    const { report, progress, stages } = props;
    const nextStage = nextUnclearedStage(progress.clearedStageIds);

    const stageRows = stages
      .map((s) => {
        const cleared = progress.clearedStageIds.includes(s.id);
        return `
          <button class="stage-row" data-stage="${s.id}">
            <span>${s.name}</span>
            <span class="stage-mark">${cleared ? "⭐" : ""}</span>
          </button>`;
      })
      .join("");

    this.root.innerHTML = `
      <div class="screen start-screen">
        <h1 class="title">かんじRPG<br /><span class="subtitle">こえで よむ ぼうけん</span></h1>
        ${
          report.supported
            ? `<button id="start-btn" class="start-btn">ぼうけんに でる</button>`
            : `<p class="fatal">このブラウザは音声認識に対応していません</p>`
        }
        <div class="stage-list">
          <p class="stage-list-title">WORLD 1 はじまりの草原</p>
          ${stageRows}
        </div>
        <details class="support-report">
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

    this.root
      .querySelector("#start-btn")
      ?.addEventListener("click", () => props.onSelectStage(nextStage));

    this.root.querySelectorAll<HTMLButtonElement>(".stage-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        const stage = stages.find((s) => s.id === btn.dataset.stage);
        if (stage) props.onSelectStage(stage);
      });
    });
  }
}
