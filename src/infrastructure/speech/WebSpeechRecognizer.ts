import type {
  SpeechRecognizer,
  SpeechResult,
  SpeechError,
} from "./SpeechRecognizer";

// Web Speech API は TypeScript の標準 lib に含まれないため最小限の型を宣言する
interface NativeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: NativeRecognitionEvent) => void) | null;
  onerror: ((event: { error: string; message?: string }) => void) | null;
}

interface NativeRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }
  >;
}

type NativeRecognitionCtor = new () => NativeRecognition;

export function getNativeSpeechRecognition(): NativeRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>;
  return (
    (w.SpeechRecognition as NativeRecognitionCtor | undefined) ??
    (w.webkitSpeechRecognition as NativeRecognitionCtor | undefined) ??
    null
  );
}

/** 復帰不可能とみなすエラー */
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

/**
 * Web Speech API 実装。
 * 「1ステージ中は基本ノータップ」(§2.2 原則B)を満たすため、start() 後は
 * stop() が呼ばれるまで、セッションが勝手に終了しても自動で再 start する。
 */
export class WebSpeechRecognizer implements SpeechRecognizer {
  private recognition: NativeRecognition | null = null;

  private shouldListen = false;
  private running = false;
  private restartTimer: number | undefined;

  private resultCb: ((r: SpeechResult) => void) | null = null;
  private errorCb: ((e: SpeechError) => void) | null = null;
  private speechStartCb: (() => void) | null = null;
  private stateCb: ((listening: boolean) => void) | null = null;

  async init(): Promise<void> {
    const Ctor = getNativeSpeechRecognition();
    if (!Ctor) {
      throw new Error("SpeechRecognition is not available in this browser");
    }
    const rec = new Ctor();
    rec.lang = "ja-JP";
    rec.continuous = false; // iOS Safari は結果確定でセッションが終わる前提で設計する
    rec.interimResults = true;
    rec.maxAlternatives = 5;

    rec.onstart = () => {
      this.running = true;
      this.stateCb?.(true);
    };

    rec.onend = () => {
      this.running = false;
      this.stateCb?.(false);
      if (this.shouldListen) {
        this.scheduleRestart();
      }
    };

    rec.onspeechstart = () => {
      this.speechStartCb?.();
    };

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives: string[] = [];
        for (let j = 0; j < result.length; j++) {
          alternatives.push(result[j].transcript);
        }
        this.resultCb?.({
          transcript: result[0]?.transcript ?? "",
          confidence: result[0]?.confidence,
          isFinal: result.isFinal,
          alternatives,
        });
      }
    };

    rec.onerror = (event) => {
      const fatal = FATAL_ERRORS.has(event.error);
      if (fatal) {
        this.shouldListen = false;
      }
      this.errorCb?.({
        code: event.error,
        message: event.message ?? event.error,
        fatal,
      });
    };

    this.recognition = rec;
  }

  async start(): Promise<void> {
    this.shouldListen = true;
    this.tryStart();
  }

  async stop(): Promise<void> {
    this.shouldListen = false;
    if (this.restartTimer !== undefined) {
      clearTimeout(this.restartTimer);
      this.restartTimer = undefined;
    }
    if (this.recognition && this.running) {
      try {
        this.recognition.abort();
      } catch {
        // already stopped
      }
    }
  }

  onResult(callback: (result: SpeechResult) => void): void {
    this.resultCb = callback;
  }

  onError(callback: (error: SpeechError) => void): void {
    this.errorCb = callback;
  }

  onSpeechStart(callback: () => void): void {
    this.speechStartCb = callback;
  }

  onStateChange(callback: (listening: boolean) => void): void {
    this.stateCb = callback;
  }

  private scheduleRestart(): void {
    if (this.restartTimer !== undefined) return;
    this.restartTimer = window.setTimeout(() => {
      this.restartTimer = undefined;
      this.tryStart();
    }, 180);
  }

  private tryStart(): void {
    if (!this.recognition || !this.shouldListen || this.running) return;
    try {
      this.recognition.start();
    } catch {
      // InvalidStateError: 既に開始済み。onend からの復帰に任せる
    }
  }
}
