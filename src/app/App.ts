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
import { detectSpeechSupport } from "../infrastructure/speech/SpeechSupportDetector";
import { WebSpeechRecognizer } from "../infrastructure/speech/WebSpeechRecognizer";
import { IndexedDbSaveRepository } from "../infrastructure/storage/SaveRepository";
import { BattleScene } from "../presentation/scenes/BattleScene";
import { ResultScene } from "../presentation/scenes/ResultScene";
import { TitleScene } from "../presentation/scenes/TitleScene";

export class App {
  private repo = new QuestionRepository(QUESTION_POOLS);
  private save = new IndexedDbSaveRepository();
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
    new TitleScene(this.root).mount({
      report: detectSpeechSupport(),
      progress: this.progress,
      stages: STAGES,
      onSelectStage: (stage) => this.startStage(stage),
    });
  }

  private startStage(stage: StageDefinition): void {
    void this.controller?.destroy();

    const scene = new BattleScene(this.root, this.debugMode);
    scene.mount(stage);

    this.controller = new BattleController({
      stage,
      recognizer: new WebSpeechRecognizer(),
      session: this.repo.createSession(stage.questionPoolId),
      engine: new BattleEngine(stage, ENEMY_MAP),
      renderer: scene,
      progress: this.progress,
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

    const next = nextUnclearedStage(this.progress.clearedStageIds);
    const allCleared = this.progress.clearedStageIds.includes(next.id);

    new ResultScene(this.root).mount({
      summary,
      nextStage: allCleared ? null : next,
      onNext: (s) => this.startStage(s),
      onTitle: () => this.showTitle(),
    });
  }
}
