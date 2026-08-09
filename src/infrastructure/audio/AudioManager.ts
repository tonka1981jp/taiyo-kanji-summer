import { Sfx, type SoundId } from "./Sfx";

// サウンド仕様書 §7, §25: BGMは少数精鋭(タイトル/通常/ボス/クリア/宝箱)。
// Suno で制作した音源を public/audio/bgm/ に置けば自動で鳴る。
// ファイルが無い間は無音のまま動く(SEのみ)。

export type BgmName = "title" | "world" | "boss";
export type JingleName = "clear" | "treasure";

const BGM_BASE_VOLUME = 0.55;
/** §17.2: LISTENING 中は BGM 70〜85% に下げて音声認識を邪魔しない */
const DUCK_RATIO = 0.75;

export class AudioManager {
  readonly sfx = new Sfx();

  private els = new Map<string, HTMLAudioElement>();
  private missing = new Set<string>();
  private current: string | null = null;
  private ducked = false;
  private unlocked = false;

  /** ユーザージェスチャー内で必ず一度呼ぶ(iOS 解錠 + BGM要素のプライミング) */
  unlock(): void {
    this.sfx.unlock();
    if (this.unlocked) return;
    this.unlocked = true;
    for (const name of ["title", "world", "boss", "clear", "treasure"]) {
      const el = this.el(name);
      el.muted = true;
      el.play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.muted = false;
        })
        .catch(() => {
          el.muted = false;
        });
    }
  }

  play(id: SoundId): void {
    this.sfx.play(id);
  }

  playBgm(name: BgmName): void {
    if (this.current === name) return;
    this.stopBgm();
    if (this.missing.has(name)) return;
    const el = this.el(name);
    el.loop = true;
    el.currentTime = 0;
    el.volume = this.bgmVolume();
    el.play().catch(() => {
      // 未配置 or 未解錠: 無音のまま続行
    });
    this.current = name;
  }

  stopBgm(): void {
    if (!this.current) return;
    const el = this.els.get(this.current);
    el?.pause();
    this.current = null;
  }

  /** ジングル: BGMを止めて1回だけ再生。ファイルが無ければSEフォールバック */
  playJingle(name: JingleName, fallback?: SoundId): void {
    this.stopBgm();
    if (this.missing.has(name)) {
      if (fallback) this.sfx.play(fallback);
      return;
    }
    const el = this.el(name);
    el.loop = false;
    el.currentTime = 0;
    el.volume = BGM_BASE_VOLUME;
    el.play().catch(() => {
      if (fallback) this.sfx.play(fallback);
    });
  }

  /** LISTENING 中の BGM ダッキング(§17) */
  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    if (this.current) {
      const el = this.els.get(this.current);
      if (el) el.volume = this.bgmVolume();
    }
  }

  private bgmVolume(): number {
    return BGM_BASE_VOLUME * (this.ducked ? DUCK_RATIO : 1);
  }

  private el(name: string): HTMLAudioElement {
    let el = this.els.get(name);
    if (!el) {
      el = new Audio(`/audio/bgm/${name}.mp3`);
      el.preload = "auto";
      el.addEventListener("error", () => {
        this.missing.add(name);
      });
      this.els.set(name, el);
    }
    return el;
  }
}
