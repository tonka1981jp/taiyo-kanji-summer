import "@fontsource/dotgothic16";
import "@fontsource/press-start-2p";
import "./style.css";
import { App } from "./app/App";
import { KANJI_LIST } from "./data/kanji";

// 仕様書 §36: ?debug=1 で開発デバッグHUDを表示(本番UIとは分離)
const debugMode = new URLSearchParams(window.location.search).has("debug");

const root = document.getElementById("app")!;
const app = new App(root, debugMode);
void app.boot();

// ?debug=1 のときだけコレクションの管理APIをコンソールへ公開する。
// 例: __collection.grantAll() / grantKanji("飛") / exportJson() / reset()
if (debugMode) {
  (window as unknown as Record<string, unknown>).__collection = {
    grantKanji: (k: string) => app.collection.grantKanji(k),
    grantAll: () => {
      let n = 0;
      for (const k of KANJI_LIST) if (app.collection.grantKanji(k)) n++;
      return `${n} 字を付与`;
    },
    grantRare: (id: string) => app.collection.grantRare(id),
    exportJson: () => app.collection.exportJson(),
    importJson: (json: string) => app.collection.importJson(json),
    reset: () => app.collection.reset(),
  };
}
