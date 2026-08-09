// 端末設定(音量など)の永続化。localStorage・スキーマ版数つき。
// iOSはマイク使用中のWeb Audio音量がハード音量ボタンで調整できないため、
// アプリ内の音量設定が唯一の調整手段になる。

const STORAGE_KEY = "kanji-rpg-settings";
const SCHEMA_VERSION = 1;

export interface SettingsData {
  schemaVersion: number;
  /** 効果音音量 0..1 */
  seVolume: number;
  /** BGM音量 0..1 */
  bgmVolume: number;
}

const DEFAULTS: SettingsData = {
  schemaVersion: SCHEMA_VERSION,
  seVolume: 0.4,
  bgmVolume: 0.5,
};

export class SettingsStore {
  private data: SettingsData;

  constructor() {
    this.data = this.load();
  }

  get seVolume(): number {
    return this.data.seVolume;
  }

  get bgmVolume(): number {
    return this.data.bgmVolume;
  }

  update(partial: Partial<Pick<SettingsData, "seVolume" | "bgmVolume">>): void {
    this.data = { ...this.data, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // 保存できなくても続行
    }
  }

  private load(): SettingsData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw) as Partial<SettingsData>;
      return {
        schemaVersion: SCHEMA_VERSION,
        seVolume: clamp01(parsed.seVolume, DEFAULTS.seVolume),
        bgmVolume: clamp01(parsed.bgmVolume, DEFAULTS.bgmVolume),
      };
    } catch {
      return { ...DEFAULTS };
    }
  }
}

function clamp01(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.max(0, Math.min(1, v))
    : fallback;
}
