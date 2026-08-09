import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// iPhone Safari のマイク利用には secure context が必須。
// LAN 経由の実機テスト用に自己署名 HTTPS で配信する。
export default defineConfig({
  // GitHub Pages のサブパス配信用(CIで DEPLOY_BASE=/taiyo-kanji-summer/ を渡す)
  base: process.env.DEPLOY_BASE ?? "/",
  plugins: [basicSsl()],
  server: {
    host: true,
    port: 5173,
  },
});
