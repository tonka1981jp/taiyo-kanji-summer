import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// iPhone Safari のマイク利用には secure context が必須。
// LAN 経由の実機テスト用に自己署名 HTTPS で配信する。
export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true,
    port: 5173,
  },
});
