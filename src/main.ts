import "./style.css";
import { App } from "./app/App";

// 仕様書 §36: ?debug=1 で開発デバッグHUDを表示(本番UIとは分離)
const debugMode = new URLSearchParams(window.location.search).has("debug");

const root = document.getElementById("app")!;
void new App(root, debugMode).boot();
