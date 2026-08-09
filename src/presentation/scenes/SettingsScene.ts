import type { AudioManager } from "../../infrastructure/audio/AudioManager";
import type { SettingsStore } from "../../infrastructure/storage/SettingsStore";

// 設定画面。iOSはマイク使用中、Web Audioの音量がハード音量ボタンで
// 変えられないことがあるため、ここが実質唯一の音量調整手段。

export interface SettingsSceneProps {
  settings: SettingsStore;
  onBack: () => void;
}

export class SettingsScene {
  private sampleTimer: number | undefined;

  constructor(
    private root: HTMLElement,
    private audio: AudioManager,
  ) {}

  mount(props: SettingsSceneProps): void {
    const { settings } = props;

    this.root.innerHTML = `
      <div class="screen settings-screen">
        <header class="collection-header">
          <button id="back-btn" class="back-btn">◀ もどる</button>
          <span class="collection-title">⚙ せってい</span>
          <span></span>
        </header>

        <div class="settings-body">
          <div class="setting-row">
            <label for="se-vol">🔔 こうかおん</label>
            <input id="se-vol" type="range" min="0" max="10" step="1"
              value="${Math.round(settings.seVolume * 10)}" />
            <span id="se-val" class="setting-val">${Math.round(settings.seVolume * 10)}</span>
          </div>

          <div class="setting-row">
            <label for="bgm-vol">🎵 BGM</label>
            <input id="bgm-vol" type="range" min="0" max="10" step="1"
              value="${Math.round(settings.bgmVolume * 10)}" />
            <span id="bgm-val" class="setting-val">${Math.round(settings.bgmVolume * 10)}</span>
          </div>

          <p class="settings-note">
            iPhoneの音量ボタンで音が変わらないときは、ここで調整してね。<br />
            (マイクを使うゲームのため、本体の音量が効かないことがあります)
          </p>
        </div>
      </div>
    `;

    const seSlider = this.root.querySelector<HTMLInputElement>("#se-vol")!;
    const bgmSlider = this.root.querySelector<HTMLInputElement>("#bgm-vol")!;
    const seVal = this.root.querySelector("#se-val")!;
    const bgmVal = this.root.querySelector("#bgm-val")!;

    const apply = (): void => {
      const seVolume = Number(seSlider.value) / 10;
      const bgmVolume = Number(bgmSlider.value) / 10;
      settings.update({ seVolume, bgmVolume });
      this.audio.applySettings({ seVolume, bgmVolume });
      seVal.textContent = seSlider.value;
      bgmVal.textContent = bgmSlider.value;
    };

    seSlider.addEventListener("input", () => {
      apply();
      // 大きさを耳で確かめられるよう、動かすたびにサンプルSE(連打は間引く)
      if (this.sampleTimer === undefined) {
        this.audio.play("answer.correct");
        this.sampleTimer = window.setTimeout(() => {
          this.sampleTimer = undefined;
        }, 250);
      }
    });
    bgmSlider.addEventListener("input", apply);

    // BGM音量はタイトル曲を鳴らしながら調整できるようにする
    this.audio.playBgm("title");

    this.root.querySelector("#back-btn")?.addEventListener("click", () => {
      this.audio.play("ui.tap");
      props.onBack();
    });
  }
}
