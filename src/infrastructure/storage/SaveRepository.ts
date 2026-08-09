import type { PlayerProgress } from "../../domain/progression/PlayerProgress";

export interface SaveRepository {
  load(): Promise<PlayerProgress | null>;
  save(progress: PlayerProgress): Promise<void>;
}

const DB_NAME = "kanji-rpg";
const DB_VERSION = 1;
const STORE = "save";
const KEY = "player";
const LS_KEY = "kanji-rpg-save-v1";

/**
 * IndexedDB ベースのセーブ(§46)。
 * IndexedDB が使えない環境では localStorage へフォールバックする。
 */
export class IndexedDbSaveRepository implements SaveRepository {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  async load(): Promise<PlayerProgress | null> {
    const db = await this.openDb();
    if (!db) return this.loadFromLocalStorage();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as PlayerProgress) ?? null);
      req.onerror = () => resolve(this.loadFromLocalStorage());
    });
  }

  async save(progress: PlayerProgress): Promise<void> {
    const db = await this.openDb();
    if (!db) {
      this.saveToLocalStorage(progress);
      return;
    }
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(progress, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        this.saveToLocalStorage(progress);
        resolve();
      };
    });
  }

  private openDb(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve) => {
      if (!("indexedDB" in window)) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    return this.dbPromise;
  }

  private loadFromLocalStorage(): PlayerProgress | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as PlayerProgress) : null;
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(progress: PlayerProgress): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(progress));
    } catch {
      // 保存できなくてもゲームは続行(§21 進行不能禁止の精神)
    }
  }
}
