import { getNativeSpeechRecognition } from "./WebSpeechRecognizer";

// 環境サポート状況の検出(PoC仕様 §10.1 / §27 から引き継ぎ)

export interface SpeechSupportReport {
  userAgent: string;
  hasStandard: boolean;
  hasWebkit: boolean;
  supported: boolean;
  /** ホーム画面追加(PWA)起動かどうか — WebKit バグ検証用 */
  isStandalone: boolean;
  isSecureContext: boolean;
  hasProcessLocally: boolean;
  hasAvailableFn: boolean;
  hasInstallFn: boolean;
}

export function detectSpeechSupport(): SpeechSupportReport {
  const w = window as unknown as Record<string, unknown>;
  const Ctor = getNativeSpeechRecognition();

  let hasProcessLocally = false;
  if (Ctor) {
    try {
      const probe = new (Ctor as new () => object)();
      hasProcessLocally = "processLocally" in probe;
    } catch {
      // 生成できない環境ではスキップ
    }
  }

  const ctorAsRecord = Ctor as unknown as Record<string, unknown> | null;

  return {
    userAgent: navigator.userAgent,
    hasStandard: "SpeechRecognition" in w,
    hasWebkit: "webkitSpeechRecognition" in w,
    supported: Ctor !== null,
    isStandalone:
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true,
    isSecureContext: window.isSecureContext,
    hasProcessLocally,
    hasAvailableFn: typeof ctorAsRecord?.available === "function",
    hasInstallFn: typeof ctorAsRecord?.install === "function",
  };
}
