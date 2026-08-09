import type {
  BattleRenderer,
  DebugInfo,
  EncounterInfo,
  MicState,
} from "../../application/BattleRenderer";
import type { RetryReason } from "../../domain/battle/BattleEvent";
import type { StageDefinition } from "../../domain/battle/StageDefinition";
import { ENEMY_SKINS } from "../../data/enemies";

// 仕様書 §12 レイアウト / §57 BattleRenderer 実装。
// 学習内容は一切判断しない(§4.2)。イベントを受けて再生するだけ。

const MIC_LABELS: Record<MicState, string> = {
  listening: "🎙 きいています",
  evaluating: "✨ はんてい中",
  off: "…",
};

const RETRY_LABELS: Record<RetryReason, string> = {
  ambiguous: "👂 もういちど きかせて！",
  incorrect: "おしい！ もういちど",
  "no-speech": "🎙 よんでみよう！",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BattleScene implements BattleRenderer {
  private stageEl!: HTMLElement;
  private encounterEl!: HTMLElement;
  private enemyAreaEl!: HTMLElement;
  private enemyEmojiEl!: HTMLElement;
  private enemyNameEl!: HTMLElement;
  private hpFillEl!: HTMLElement;
  private hpTextEl!: HTMLElement;
  private damageEl!: HTMLElement;
  private slashEl!: HTMLElement;
  private kanjiEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private micEl!: HTMLElement;
  private flashEl!: HTMLElement;
  private comboEl!: HTMLElement;
  private debugEl: HTMLElement | null = null;

  constructor(
    private root: HTMLElement,
    private debugMode: boolean,
  ) {}

  mount(stage: StageDefinition): void {
    this.root.innerHTML = `
      <div class="screen battle-screen">
        <header class="battle-header">
          <span id="stage"></span>
          <span id="encounter"></span>
        </header>

        <div class="enemy-area" id="enemy-area">
          <div id="enemy-emoji" class="enemy-emoji"></div>
          <div id="slash" class="slash"></div>
          <div id="enemy-name" class="enemy-name"></div>
          <div class="hp-bar"><div id="hp-fill" class="hp-fill"></div></div>
          <div id="hp-text" class="hp-text"></div>
          <div id="damage" class="damage-popup"></div>
        </div>

        <div class="kanji-card">
          <div id="kanji" class="kanji"></div>
          <div id="hint" class="hint"></div>
        </div>

        <div id="mic" class="mic-state"></div>
        <div id="flash" class="flash"></div>
        <div id="combo" class="combo"></div>

        ${this.debugMode ? `<div id="debug-hud" class="debug-hud"></div>` : ""}
      </div>
    `;

    this.stageEl = this.q("#stage");
    this.encounterEl = this.q("#encounter");
    this.enemyAreaEl = this.q("#enemy-area");
    this.enemyEmojiEl = this.q("#enemy-emoji");
    this.enemyNameEl = this.q("#enemy-name");
    this.hpFillEl = this.q("#hp-fill");
    this.hpTextEl = this.q("#hp-text");
    this.damageEl = this.q("#damage");
    this.slashEl = this.q("#slash");
    this.kanjiEl = this.q("#kanji");
    this.hintEl = this.q("#hint");
    this.micEl = this.q("#mic");
    this.flashEl = this.q("#flash");
    this.comboEl = this.q("#combo");
    this.debugEl = this.debugMode ? this.q("#debug-hud") : null;

    this.stageEl.textContent = stage.name;
    this.setMic("off");
  }

  private q(selector: string): HTMLElement {
    return this.root.querySelector(selector) as HTMLElement;
  }

  // ---------- BattleRenderer ----------

  async showEncounter(info: EncounterInfo): Promise<void> {
    const skin = ENEMY_SKINS[info.enemyId];
    this.encounterEl.textContent = `${info.index + 1} / ${info.total}`;
    this.enemyEmojiEl.textContent = skin?.emoji ?? "👾";
    this.enemyEmojiEl.className = "enemy-emoji enter" + (info.isBoss ? " boss" : "");
    this.enemyNameEl.textContent = info.name;
    this.updateEnemyHp(info.hp, info.maxHp);
    this.flash(
      info.isBoss ? `ボスだ！ ${info.name}！` : `${info.name}が あらわれた！`,
      info.isBoss ? "boss-appear" : "appear",
    );
    await delay(info.isBoss ? 1100 : 800);
  }

  showQuestion(text: string): void {
    this.kanjiEl.textContent = text;
    this.kanjiEl.classList.remove("pop");
    void this.kanjiEl.offsetWidth;
    this.kanjiEl.classList.add("pop");
    this.hintEl.textContent = "";
    this.flashEl.textContent = "";
    this.flashEl.className = "flash";
    this.clearDebugTranscript();
  }

  setMic(state: MicState): void {
    this.micEl.textContent = MIC_LABELS[state];
    this.micEl.dataset.state = state;
  }

  showCorrect(): void {
    this.flash("せいかい！", "correct");
  }

  async showRetry(reason: RetryReason): Promise<void> {
    // §35: STTが何と認識したかは本番UIには出さない(❌も出さない §59 NG2)
    this.flash(RETRY_LABELS[reason], reason === "incorrect" ? "retry" : "prompt");
    this.micEl.dataset.state = "retry";
    await delay(600);
  }

  async showHint(text: string): Promise<void> {
    this.flash("おしい！ ヒント！", "retry");
    this.hintEl.textContent = text;
    await delay(700);
  }

  async showRevealAnswer(reading: string): Promise<void> {
    this.hintEl.textContent = reading;
    this.flash("いっしょに いってみよう！", "reveal");
    await delay(900);
  }

  async showSkip(reading: string): Promise<void> {
    this.hintEl.textContent = reading;
    this.flash("つぎに いこう！", "prompt");
    await delay(1000);
  }

  showSilencePrompt(): void {
    this.flash("よんでみよう！", "prompt");
  }

  async playAttack(damage: number, critical: boolean): Promise<void> {
    // 斬撃(§19: 通常0.4〜0.9秒)
    this.slashEl.classList.remove("play");
    void this.slashEl.offsetWidth;
    this.slashEl.classList.add("play");

    this.enemyEmojiEl.classList.remove("hit");
    void this.enemyEmojiEl.offsetWidth;
    this.enemyEmojiEl.classList.add("hit");

    this.damageEl.textContent = critical ? `CRITICAL! ${damage}` : `${damage} DAMAGE`;
    this.damageEl.classList.toggle("critical", critical);
    this.damageEl.classList.remove("show");
    void this.damageEl.offsetWidth;
    this.damageEl.classList.add("show");

    if (critical) {
      this.enemyAreaEl.classList.remove("shake-hard");
      void this.enemyAreaEl.offsetWidth;
      this.enemyAreaEl.classList.add("shake-hard");
    }

    await delay(critical ? 800 : 550);
  }

  updateEnemyHp(hp: number, maxHp: number): void {
    const ratio = Math.max(0, (hp / maxHp) * 100);
    this.hpFillEl.style.width = `${ratio}%`;
    this.hpFillEl.classList.toggle("low", ratio < 30);
    this.hpTextEl.textContent = `HP ${Math.max(0, hp)} / ${maxHp}`;
  }

  updateCombo(combo: number): void {
    this.comboEl.textContent = combo >= 2 ? `${combo} COMBO!` : "";
    if (combo >= 2) {
      this.comboEl.classList.remove("pop");
      void this.comboEl.offsetWidth;
      this.comboEl.classList.add("pop");
    }
  }

  async playEnemyDefeat(name: string): Promise<void> {
    this.flash(`${name}を たおした！`, "defeated");
    this.enemyEmojiEl.classList.add("defeated");
    await delay(900);
    this.enemyEmojiEl.classList.remove("defeated");
  }

  showFatalError(message: string): void {
    const el = document.createElement("div");
    el.className = "fatal-banner";
    el.textContent = message;
    this.root.appendChild(el);
  }

  updateDebug(info: DebugInfo): void {
    if (!this.debugEl) return;
    this.debugEl.innerHTML = `
      <div>Expected: ${info.expected}</div>
      <div>Raw STT: ${info.raw}</div>
      <div>Normalized: ${info.normalized}</div>
      <div>Evaluation: ${info.evaluation}</div>
      <div>Confidence: ${info.confidence?.toFixed(2) ?? "-"}</div>
      <div>Retries: ${info.retries}</div>
      <div>Latency: ${info.latencyMs !== undefined ? `${info.latencyMs}ms` : "-"}</div>
    `;
  }

  private clearDebugTranscript(): void {
    if (this.debugEl) this.debugEl.innerHTML = "";
  }

  private flash(text: string, kind: string): void {
    this.flashEl.textContent = text;
    this.flashEl.className = `flash ${kind}`;
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add("show");
  }
}
