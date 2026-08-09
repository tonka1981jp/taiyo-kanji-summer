import type {
  BattleRenderer,
  DebugInfo,
  EncounterInfo,
  MicState,
} from "../../application/BattleRenderer";
import type { RetryReason } from "../../domain/battle/BattleEvent";
import type { StageDefinition } from "../../domain/battle/StageDefinition";
import { ENEMY_SKINS } from "../../data/enemies";
import type { AudioManager } from "../../infrastructure/audio/AudioManager";

// アート仕様書 §14 レイアウト / BattleRenderer 実装。
// 学習内容は一切判断しない。イベントを受けて再生するだけ。
//
// マイク状態は「小4が迷わない」ことを最優先にした2値設計:
//   みどり = いま しゃべっていい / それ以外 = まってて
// さらに interim 受信で「きこえてる！」を即表示し、答えの連呼を防ぐ。

const RETRY_LABELS: Record<RetryReason, string> = {
  ambiguous: "👂 もういちど きかせて！",
  incorrect: "おしい！ もういちど",
  "no-speech": "🎙 よんでみよう！",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BattleScene implements BattleRenderer {
  private worldBgm: "world1" | "world2" = "world1";
  private stageEl!: HTMLElement;
  private encounterEl!: HTMLElement;
  private enemySpriteEl!: HTMLElement;
  private critFxEl!: HTMLElement;
  private burstEl!: HTMLElement;
  private particlesEl!: HTMLElement;
  private impactEl!: HTMLElement;
  private screenEl!: HTMLElement;
  private enemyNameEl!: HTMLElement;
  private hpFillEl!: HTMLElement;
  private hpTextEl!: HTMLElement;
  private damageEl!: HTMLElement;
  private slashEl!: HTMLElement;
  private cardEl!: HTMLElement;
  private kanjiEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private micEl!: HTMLElement;
  private micLabelEl!: HTMLElement;
  private flashEl!: HTMLElement;
  private comboEl!: HTMLElement;
  private debugEl: HTMLElement | null = null;

  constructor(
    private root: HTMLElement,
    private debugMode: boolean,
    private audio: AudioManager,
  ) {}

  mount(stage: StageDefinition): void {
    this.root.innerHTML = `
      <div class="screen battle-screen ${stage.worldId}">

        <header class="battle-header">
          <span id="stage" class="chip"></span>
          <span id="encounter" class="chip"></span>
        </header>

        <div class="enemy-area" id="enemy-area">
          <div id="enemy-sprite" class="enemy-sprite"></div>
          <img id="slash" class="slash-img" src="/game/fx/slash.png" alt="" />
          <img id="critfx" class="crit-img" src="/game/fx/critical.png" alt="" />
          <div id="burst" class="burst-ring"></div>
          <div id="particles" class="particles"></div>
          <div id="enemy-name" class="enemy-name"></div>
          <div class="hp-bar"><div id="hp-fill" class="hp-fill"></div></div>
          <div id="hp-text" class="hp-text"></div>
          <div id="damage" class="damage-popup"></div>
        </div>

        <div id="flash" class="flash"></div>

        <div class="kanji-card" id="kanji-card">
          <div id="kanji" class="kanji"></div>
          <div id="hint" class="hint"></div>
        </div>

        <div id="mic" class="mic-banner">
          <span class="mic-icon">🎙</span>
          <span id="mic-label"></span>
          <span class="hear-bars"><i></i><i></i><i></i></span>
        </div>

        <div class="hint-tip">こまったら 「ヒント！」って いってみて</div>

        <div id="combo" class="combo"></div>

        <div id="impact" class="impact-flash"></div>
        ${this.debugMode ? `<div id="debug-hud" class="debug-hud"></div>` : ""}
      </div>
    `;

    this.stageEl = this.q("#stage");
    this.encounterEl = this.q("#encounter");
    this.enemySpriteEl = this.q("#enemy-sprite");
    this.critFxEl = this.q("#critfx");
    this.burstEl = this.q("#burst");
    this.particlesEl = this.q("#particles");
    this.impactEl = this.q("#impact");
    this.screenEl = this.q(".battle-screen");
    this.enemyNameEl = this.q("#enemy-name");
    this.hpFillEl = this.q("#hp-fill");
    this.hpTextEl = this.q("#hp-text");
    this.damageEl = this.q("#damage");
    this.slashEl = this.q("#slash");
    this.cardEl = this.q("#kanji-card");
    this.kanjiEl = this.q("#kanji");
    this.hintEl = this.q("#hint");
    this.micEl = this.q("#mic");
    this.micLabelEl = this.q("#mic-label");
    this.flashEl = this.q("#flash");
    this.comboEl = this.q("#combo");
    this.debugEl = this.debugMode ? this.q("#debug-hud") : null;

    this.worldBgm = stage.worldId === "world2" ? "world2" : "world1";
    this.stageEl.textContent = stage.name;
    this.setMic("off");
  }

  private q(selector: string): HTMLElement {
    return this.root.querySelector(selector) as HTMLElement;
  }

  // ---------- BattleRenderer ----------

  async showEncounter(info: EncounterInfo): Promise<void> {
    this.audio.playBgm(info.isBoss ? "boss" : this.worldBgm);
    const skin = ENEMY_SKINS[info.enemyId];
    this.encounterEl.textContent = `${info.index + 1} / ${info.total}`;
    if (skin?.image) {
      this.enemySpriteEl.innerHTML = `<img src="${skin.image}" alt="${info.name}" draggable="false" />`;
    } else {
      this.enemySpriteEl.textContent = skin?.emoji ?? "👾";
    }
    this.enemySpriteEl.className = "enemy-sprite enter" + (info.isBoss ? " boss" : "");
    this.enemyNameEl.textContent = info.name;
    this.updateEnemyHp(info.hp, info.maxHp);
    this.flash(
      info.isBoss ? `ボスだ！ ${info.name}！` : `${info.name}が あらわれた！`,
      info.isBoss ? "boss-appear" : "appear",
    );
    await delay(info.isBoss ? 1100 : 800);
  }

  showQuestion(text: string): void {
    this.audio.play("quiz.show");
    this.kanjiEl.textContent = text;
    this.kanjiEl.classList.remove("pop");
    void this.kanjiEl.offsetWidth;
    this.kanjiEl.classList.add("pop");
    this.hintEl.textContent = "";
    this.flashEl.textContent = "";
    this.flashEl.className = "flash";
    this.clearDebugTranscript();
  }

  /**
   * マイク状態は2値で伝える:
   *   listening(みどり) = いま しゃべっていい
   *   それ以外(グレー/きいろ) = まってて
   */
  setMic(state: MicState): void {
    this.micEl.dataset.state = state;
    this.cardEl.classList.toggle("speak-now", state === "listening");
    switch (state) {
      case "listening":
        this.micLabelEl.textContent = "いま！ こえで こうげき！";
        this.audio.setDucked(true);
        this.audio.play("mic.on");
        break;
      case "evaluating":
        this.micLabelEl.textContent = "はんてい中…";
        this.audio.setDucked(false);
        break;
      case "off":
        this.micLabelEl.textContent = "ちょっと まってね";
        this.audio.setDucked(false);
        break;
    }
  }

  showHearing(): void {
    // listening 中のみ「きこえてる！」へ(まだしゃべって良い=みどりのまま)
    if (this.micEl.dataset.state !== "listening" && this.micEl.dataset.state !== "hearing") {
      return;
    }
    this.micEl.dataset.state = "hearing";
    this.micLabelEl.textContent = "きこえてるよ…！";
  }

  showCorrect(): void {
    this.audio.play("answer.correct");
    this.flash("せいかい！", "correct");
  }

  async showRetry(reason: RetryReason): Promise<void> {
    this.audio.play("answer.retry");
    this.flash(RETRY_LABELS[reason], reason === "incorrect" ? "retry" : "prompt");
    await delay(600);
  }

  async showHint(text: string, requested: boolean): Promise<void> {
    this.audio.play(requested ? "quiz.show" : "answer.retry");
    this.flash(requested ? "🧙 ヒント！" : "おしい！ ヒント！", requested ? "prompt" : "retry");
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

  async playAttack(damage: number, critical: boolean, reduced: boolean): Promise<void> {
    this.audio.play(critical ? "battle.critical" : "battle.slash");

    // 画面フラッシュ+画面シェイク(攻撃した感)。ヒント使用時は控えめにして差を見せる
    if (!reduced) {
      this.impact(critical ? "crit" : "hit");
    }
    this.spawnParticles(
      reduced ? 5 : critical ? 16 : 9,
      critical ? ["#ffd54d", "#ff7b54", "#ffffff"] : ["#ffffff", "#ffe9a0", "#8ecbff"],
    );

    this.slashEl.classList.remove("play");
    void this.slashEl.offsetWidth;
    this.slashEl.classList.add("play");

    this.enemySpriteEl.classList.remove("hit");
    void this.enemySpriteEl.offsetWidth;
    this.enemySpriteEl.classList.add("hit");

    if (reduced) {
      this.damageEl.innerHTML = `${damage}<small>ヒントで はんぶん ▼</small>`;
    } else {
      this.damageEl.textContent = critical ? `CRITICAL! ${damage}` : `${damage}`;
    }
    this.damageEl.classList.toggle("critical", critical);
    this.damageEl.classList.toggle("reduced", reduced);
    this.damageEl.classList.remove("show");
    void this.damageEl.offsetWidth;
    this.damageEl.classList.add("show");

    if (critical) {
      this.critFxEl.classList.remove("play");
      void this.critFxEl.offsetWidth;
      this.critFxEl.classList.add("play");
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
    this.comboEl.textContent = combo >= 2 ? `${combo} COMBO` : "";
    if (combo >= 2) {
      this.comboEl.classList.remove("pop");
      void this.comboEl.offsetWidth;
      this.comboEl.classList.add("pop");
    }
  }

  async playEnemyDefeat(name: string): Promise<void> {
    this.audio.play("enemy.defeat");
    this.impact("defeat");
    this.burstEl.classList.remove("play");
    void this.burstEl.offsetWidth;
    this.burstEl.classList.add("play");
    this.spawnParticles(22, ["#ffd54d", "#ffffff", "#ff9d3c", "#8ecbff"]);
    this.flash(`${name}を たおした！`, "defeated");
    this.enemySpriteEl.classList.add("defeated");
    await delay(950);
    this.enemySpriteEl.classList.remove("defeated");
  }

  // ---------- 演出ヘルパー ----------

  /** 画面全体フラッシュ+シェイク */
  private impact(kind: "hit" | "crit" | "defeat"): void {
    this.impactEl.className = "impact-flash";
    void this.impactEl.offsetWidth;
    this.impactEl.classList.add(kind);

    this.screenEl.classList.remove("shake-screen", "shake-screen-hard");
    void this.screenEl.offsetWidth;
    this.screenEl.classList.add(kind === "hit" ? "shake-screen" : "shake-screen-hard");
  }

  /** 敵位置から飛び散るパーティクル */
  private spawnParticles(count: number, colors: string[]): void {
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.className = "particle";
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 75;
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist - 25}px`);
      p.style.background = colors[i % colors.length];
      const size = 5 + Math.random() * 7;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      this.particlesEl.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
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
