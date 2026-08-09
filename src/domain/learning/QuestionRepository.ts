import type { ReadingQuestion } from "./Question";

// 仕様書 §55: 「次に出す問題」は学習側が決める。
// Phase 4 で MasteryEngine / ReviewScheduler による重み付け(§27)に置き換える前提で、
// 現段階はプールをシャッフルして直近の繰り返しを避けるだけの実装。

export class QuestionRepository {
  constructor(private pools: Record<string, ReadingQuestion[]>) {}

  createSession(poolId: string): QuestionSession {
    const pool = this.pools[poolId];
    if (!pool || pool.length === 0) {
      throw new Error(`question pool not found: ${poolId}`);
    }
    return new QuestionSession(pool);
  }
}

export class QuestionSession {
  private queue: ReadingQuestion[] = [];
  private lastId: string | null = null;

  constructor(private pool: ReadingQuestion[]) {}

  next(): ReadingQuestion {
    if (this.queue.length === 0) {
      this.queue = shuffle(this.pool);
      // 周回をまたいで同じ問題が連続しないようにする
      if (this.queue.length > 1 && this.queue[0].id === this.lastId) {
        this.queue.push(this.queue.shift()!);
      }
    }
    const q = this.queue.shift()!;
    this.lastId = q.id;
    return q;
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
