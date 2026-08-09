import { BattleController } from "../application/BattleController";
import type { StageSummary } from "../application/BattleRenderer";
import { BattleEngine } from "../domain/battle/BattleEngine";
import type { StageDefinition } from "../domain/battle/StageDefinition";
import { QuestionRepository } from "../domain/learning/QuestionRepository";
import {
  createInitialProgress,
  type PlayerProgress,
} from "../domain/progression/PlayerProgress";
import { ENEMY_MAP } from "../data/enemies";
import { QUESTION_POOLS } from "../data/questions";
import { STAGES, nextUnclearedStage } from "../data/stages";
import { rareCardById, type RareCardDef } from "../data/cards";
import { AudioManager } from "../infrastructure/audio/AudioManager";
import { detectSpeechSupport } from "../infrastructure/speech/SpeechSupportDetector";
import { WebSpeechRecognizer } from "../infrastructure/speech/WebSpeechRecognizer";
import { IndexedDbSaveRepository } from "../infrastructure/storage/SaveRepository";
import { CollectionStore } from "../infrastructure/storage/CollectionStore";
import { BattleScene } from "../presentation/scenes/BattleScene";
import { CollectionScene } from "../presentation/scenes/CollectionScene";
import { ResultScene } from "../presentation/scenes/ResultScene";
import { TitleScene } from "../presentation/scenes/TitleScene";

export class App {
  private repo = new QuestionRepository(QUESTION_POOLS);
  private save = new IndexedDbSaveRepository();
  private audio = new AudioManager();
  readonly collection = new CollectionStore();
  private progress: PlayerProgress = createInitialProgress();
  private controller: BattleController | null = null;

  constructor(
    private root: HTMLElement,
    private debugMode: boolean,
  ) {}

  async boot(): Promise<void> {
    const saved = await this.save.load();
    if (saved) this.progress = saved;
    this.showTitle();
  }

  private showTitle(): void {
    new TitleScene(this.root, this.audio).mount({
      report: detectSpeechSupport(),
      progress: this.progress,
      stages: STAGES,
      collectionCount: this.collection.kanjiCount,
      onSelectStage: (stage) => this.startStage(stage),
      onOpenCollection: () => this.showCollection(),
    });
  }

  private showCollection(): void {
    new CollectionScene(this.root, this.audio).mount({
      collection: this.collection,
      onBack: () => this.showTitle(),
    });
  }

  private startStage(stage: StageDefinition): void {
    void this.controller?.destroy();

    const scene = new BattleScene(this.root, this.debugMode, this.audio);
    scene.mount(stage);

    this.controller = new BattleController({
      stage,
      recognizer: new WebSpeechRecognizer(),
      session: this.repo.createSession(stage.questionPoolId),
      engine: new BattleEngine(stage, ENEMY_MAP),
      renderer: scene,
      progress: this.progress,
      onCorrect: (question) => {
        this.collection.markWordRead(question.text);
      },
      onStageCleared: (summary) => void this.onStageCleared(stage, summary),
    });
    void this.controller.start();
  }

  private async onStageCleared(
    stage: StageDefinition,
    summary: StageSummary,
  ): Promise<void> {
    this.controller = null;

    if (!this.progress.clearedStageIds.includes(stage.id)) {
      this.progress.clearedStageIds.push(stage.id);
    }
    this.progress.lastStageId = stage.id;
    this.progress.updatedAt = Date.now();
    await this.save.save(this.progress);

    // 宝箱: レアカードドロップ
    const drop = this.pickRareDrop(stage);
    const dropState = drop ? this.collection.grantRare(drop.id) : null;

    const next = nextUnclearedStage(this.progress.clearedStageIds);
    const allCleared = this.progress.clearedStageIds.includes(next.id);

    new ResultScene(this.root, this.audio).mount({
      summary,
      nextStage: allCleared ? null : next,
      droppedCard:
        drop && dropState
          ? { card: drop, isNew: dropState.isNew, count: dropState.count }
          : null,
      onNext: (s) => this.startStage(s),
      onTitle: () => this.showTitle(),
    });
  }

  /** そのステージに出た敵からドロップ。未所持を優先し、初回はボス(SR)を確定で渡す */
  private pickRareDrop(stage: StageDefinition): RareCardDef | null {
    const cards = [...new Set(stage.encounters.map((e) => e.enemyId))]
      .map((id) => rareCardById(id))
      .filter((c): c is RareCardDef => c !== undefined);
    if (cards.length === 0) return null;

    const unowned = cards.filter((c) => !this.collection.rareState(c.id));
    if (unowned.length > 0) {
      const sr = unowned.filter((c) => c.rarity === "SR");
      const pool = sr.length > 0 ? sr : unowned;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return cards[Math.floor(Math.random() * cards.length)];
  }
}
