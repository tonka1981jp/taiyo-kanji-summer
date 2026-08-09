// ゲーム本体とブラウザ音声APIを分離するインターフェース(仕様書 §62 の一方向データフロー起点)。

export interface SpeechResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
  /** maxAlternatives で得られた候補(先頭が最有力) */
  alternatives?: string[];
}

export interface SpeechError {
  /** no-speech / aborted / network / not-allowed / audio-capture など */
  code: string;
  message: string;
  /** true なら自動復帰不可能(マイク拒否など) */
  fatal: boolean;
}

export interface SpeechRecognizer {
  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;

  onResult(callback: (result: SpeechResult) => void): void;
  onError(callback: (error: SpeechError) => void): void;
  /** 発話開始検知(レスポンス計測用) */
  onSpeechStart(callback: () => void): void;
  /** 認識セッションの開始/終了(マイク状態表示用) */
  onStateChange(callback: (listening: boolean) => void): void;
}
