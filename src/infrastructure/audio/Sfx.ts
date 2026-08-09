// サウンド仕様書 §11〜21: 効果音は外部素材でなくコード生成(Web Audio)。
// 短い・明るい・余韻少なめ・中域はっきり(スマホスピーカー前提 §5)。

export type SoundId =
  | "ui.tap"
  | "quiz.show"
  | "answer.correct"
  | "answer.retry"
  | "battle.slash"
  | "battle.critical"
  | "enemy.defeat"
  | "reward.treasure"
  | "stage.clear"
  | "mic.on";

interface Tone {
  freq: number;
  endFreq?: number;
  dur: number;
  delay?: number;
  type?: OscillatorType;
  vol?: number;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  /** 全体音量(§16 の相対値はSEごとの vol で表現) */
  masterVolume = 0.5;

  /** ユーザージェスチャー内で呼ぶこと(iOS の AudioContext 解錠) */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  play(id: SoundId): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    switch (id) {
      case "ui.tap":
        this.tone({ freq: 660, endFreq: 880, dur: 0.06, type: "square", vol: 0.5 });
        break;

      case "quiz.show":
        // 問題表示: 軽い「出たよ」感
        this.tone({ freq: 523, endFreq: 784, dur: 0.09, type: "triangle", vol: 0.55 });
        break;

      case "answer.correct":
        // §14.1 / §20.1: 上昇2音・キラッ・勉強アプリっぽくしない
        this.tone({ freq: 784, dur: 0.09, type: "square", vol: 0.5 });
        this.tone({ freq: 1175, dur: 0.14, delay: 0.07, type: "square", vol: 0.55 });
        break;

      case "answer.retry":
        // §14.2: 軽い・否定しすぎない。ブザーNG
        this.tone({ freq: 494, endFreq: 440, dur: 0.1, type: "triangle", vol: 0.35 });
        break;

      case "battle.slash":
        // §14.3 / §21: ノイズ成分+短いアタック
        this.noise(0.09, 0.5, 2200);
        this.tone({ freq: 320, endFreq: 90, dur: 0.12, type: "square", vol: 0.4 });
        break;

      case "battle.critical":
        // §14.4: 高音と低音の重ね・明るい金属/雷感
        this.noise(0.14, 0.55, 3200);
        this.tone({ freq: 1047, endFreq: 1568, dur: 0.16, type: "sawtooth", vol: 0.5 });
        this.tone({ freq: 262, endFreq: 131, dur: 0.22, type: "square", vol: 0.45 });
        break;

      case "enemy.defeat":
        // §20.3: はじける・落ちる・小さな勝利感
        this.noise(0.12, 0.4, 1600);
        this.tone({ freq: 880, endFreq: 220, dur: 0.3, type: "square", vol: 0.45 });
        this.tone({ freq: 1319, dur: 0.08, delay: 0.28, type: "square", vol: 0.4 });
        this.tone({ freq: 1760, dur: 0.14, delay: 0.36, type: "square", vol: 0.45 });
        break;

      case "reward.treasure":
        // §20.4: キラキラ上昇アルペジオ
        this.arpeggio([523, 659, 784, 1047, 1319], 0.09, "triangle", 0.5);
        break;

      case "stage.clear":
        // クリアジングル(BGMファイルが無い場合のフォールバックにも使う)
        this.arpeggio([523, 659, 784], 0.12, "square", 0.5);
        this.tone({ freq: 1047, dur: 0.4, delay: 0.36, type: "square", vol: 0.55 });
        break;

      case "mic.on":
        // §13-14: マイク待機補助は極小(音声認識を邪魔しない §17)
        this.tone({ freq: 988, dur: 0.05, type: "sine", vol: 0.15 });
        break;
    }
  }

  private tone(t: Tone): void {
    const ctx = this.ctx!;
    const at = ctx.currentTime + (t.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type ?? "square";
    osc.frequency.setValueAtTime(t.freq, at);
    if (t.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, t.endFreq), at + t.dur);
    }
    const vol = (t.vol ?? 0.5) * this.masterVolume;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(vol, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + t.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + t.dur + 0.02);
  }

  private noise(dur: number, vol: number, cutoff: number): void {
    const ctx = this.ctx!;
    const at = ctx.currentTime;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    const v = vol * this.masterVolume;
    gain.gain.setValueAtTime(v, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(at);
  }

  private arpeggio(
    freqs: number[],
    step: number,
    type: OscillatorType,
    vol: number,
  ): void {
    freqs.forEach((freq, i) => {
      this.tone({ freq, dur: step * 1.6, delay: i * step, type, vol });
    });
  }
}
