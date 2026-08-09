import { KANJI_SET } from "../../data/kanji";

// コレクション(漢字カード・レアカード)の永続化。
//
// 設計方針: 「アップデートで消えた」を構造的に起こさないこと。
// - localStorage のキーは固定(バージョンをキー名に入れない)
// - データ内に schemaVersion を持ち、旧形式は MIGRATIONS で順次変換して読む
// - 変換に失敗しても既存データを消さず、生データを *-backup キーへ退避してから初期化
// - 書き込みは常に「既存とマージ(取得日時は古い方、回数は大きい方)」の追加型。
//   減る方向の書き込みは reset() 以外に存在しない
// - システム側から初期付与する場合は SYSTEM_GRANTS に書く(冪等)

const STORAGE_KEY = "kanji-rpg-collection";
const SCHEMA_VERSION = 1;

export interface KanjiCardState {
  kanji: string;
  firstReadAt: number;
  readCount: number;
  source: "play" | "system";
}

export interface RareCardState {
  id: string;
  obtainedAt: number;
  count: number;
}

export interface CollectionData {
  schemaVersion: number;
  kanji: Record<string, KanjiCardState>;
  rare: Record<string, RareCardState>;
}

/**
 * 運用でカードを初期付与したいときにここへ書く(サポート対応・体験版など)。
 * 起動ごとに冪等に適用される。取り消しはできない(追加型)。
 */
export const SYSTEM_GRANTS: { kanji: string[]; rare: string[] } = {
  kanji: [],
  rare: [],
};

/** 旧スキーマ → 次バージョンへの変換関数。v1が最初なので現状は空 */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  // 例: 2: (raw) => ({ ...raw, schemaVersion: 2, newField: {} }),
};

function emptyData(): CollectionData {
  return { schemaVersion: SCHEMA_VERSION, kanji: {}, rare: {} };
}

export class CollectionStore {
  private data: CollectionData;

  constructor() {
    this.data = this.load();
    this.applySystemGrants();
  }

  // ---------- 参照 ----------

  kanjiState(kanji: string): KanjiCardState | undefined {
    return this.data.kanji[kanji];
  }

  rareState(id: string): RareCardState | undefined {
    return this.data.rare[id];
  }

  get kanjiCount(): number {
    return Object.keys(this.data.kanji).length;
  }

  get rareCount(): number {
    return Object.keys(this.data.rare).length;
  }

  // ---------- 更新(すべて追加型) ----------

  /** 正解した単語に含まれる対象漢字を解放する。戻り値は新規解放された字 */
  markWordRead(word: string): string[] {
    const unlocked: string[] = [];
    for (const ch of word) {
      if (!KANJI_SET.has(ch)) continue;
      const existing = this.data.kanji[ch];
      if (existing) {
        existing.readCount += 1;
      } else {
        this.data.kanji[ch] = {
          kanji: ch,
          firstReadAt: Date.now(),
          readCount: 1,
          source: "play",
        };
        unlocked.push(ch);
      }
    }
    this.persist(); // readCount の加算もあるため常に保存
    return unlocked;
  }

  grantKanji(kanji: string, source: "play" | "system" = "system"): boolean {
    if (!KANJI_SET.has(kanji) || this.data.kanji[kanji]) return false;
    this.data.kanji[kanji] = {
      kanji,
      firstReadAt: Date.now(),
      readCount: 0,
      source,
    };
    this.persist();
    return true;
  }

  /** レアカード付与。戻り値: 新規取得だったか・所持枚数 */
  grantRare(id: string): { isNew: boolean; count: number } {
    const existing = this.data.rare[id];
    if (existing) {
      existing.count += 1;
      this.persist();
      return { isNew: false, count: existing.count };
    }
    this.data.rare[id] = { id, obtainedAt: Date.now(), count: 1 };
    this.persist();
    return { isNew: true, count: 1 };
  }

  // ---------- 引き継ぎ・管理 ----------

  exportJson(): string {
    return JSON.stringify(this.data, null, 2);
  }

  /** 追加型インポート(既存より減ることはない) */
  importJson(json: string): void {
    const incoming = this.migrate(JSON.parse(json) as Record<string, unknown>);
    this.data = mergeData(this.data, incoming);
    this.persist();
  }

  /** 全消去。デバッグ・サポート用途のみ(UIからは呼ばない) */
  reset(): void {
    this.backupRaw();
    this.data = emptyData();
    this.persist();
  }

  // ---------- 内部 ----------

  private load(): CollectionData {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return emptyData();
    }
    if (!raw) return emptyData();
    try {
      return this.migrate(JSON.parse(raw) as Record<string, unknown>);
    } catch {
      // 壊れたデータでも消さない: 退避してから初期化
      this.backupRaw();
      return emptyData();
    }
  }

  private migrate(parsed: Record<string, unknown>): CollectionData {
    let cur = parsed;
    let v = typeof cur.schemaVersion === "number" ? cur.schemaVersion : 1;
    while (v < SCHEMA_VERSION) {
      const step = MIGRATIONS[v + 1];
      if (!step) break;
      cur = step(cur);
      v = (cur.schemaVersion as number) ?? v + 1;
    }
    const data = cur as unknown as CollectionData;
    return {
      schemaVersion: SCHEMA_VERSION,
      kanji: data.kanji ?? {},
      rare: data.rare ?? {},
    };
  }

  private applySystemGrants(): void {
    let changed = false;
    for (const k of SYSTEM_GRANTS.kanji) {
      if (KANJI_SET.has(k) && !this.data.kanji[k]) {
        this.data.kanji[k] = {
          kanji: k,
          firstReadAt: Date.now(),
          readCount: 0,
          source: "system",
        };
        changed = true;
      }
    }
    for (const id of SYSTEM_GRANTS.rare) {
      if (!this.data.rare[id]) {
        this.data.rare[id] = { id, obtainedAt: Date.now(), count: 1 };
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  private persist(): void {
    try {
      // 直前に別タブが書いた分を失わないよう、読み直してマージしてから書く
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          this.data = mergeData(
            this.migrate(JSON.parse(raw) as Record<string, unknown>),
            this.data,
          );
        } catch {
          // 壊れた既存分は無視して自分のデータで上書き
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ストレージ不可でもゲームは続行
    }
  }

  private backupRaw(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localStorage.setItem(`${STORAGE_KEY}-backup-${Date.now()}`, raw);
      }
    } catch {
      // ignore
    }
  }
}

/** 追加型マージ: 取得日時は古い方・回数は大きい方を採用 */
function mergeData(a: CollectionData, b: CollectionData): CollectionData {
  const out = emptyData();
  for (const src of [a, b]) {
    for (const [k, v] of Object.entries(src.kanji)) {
      const cur = out.kanji[k];
      out.kanji[k] = cur
        ? {
            kanji: k,
            firstReadAt: Math.min(cur.firstReadAt, v.firstReadAt),
            readCount: Math.max(cur.readCount, v.readCount),
            source: cur.source === "play" || v.source === "play" ? "play" : "system",
          }
        : { ...v };
    }
    for (const [id, v] of Object.entries(src.rare)) {
      const cur = out.rare[id];
      out.rare[id] = cur
        ? {
            id,
            obtainedAt: Math.min(cur.obtainedAt, v.obtainedAt),
            count: Math.max(cur.count, v.count),
          }
        : { ...v };
    }
  }
  return out;
}
