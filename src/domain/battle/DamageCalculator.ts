// 仕様書 §17: damage = baseDamage * comboMultiplier * masteryBonus * criticalMultiplier
// masteryBonus は Phase 4(MasteryEngine 導入)で有効化する。

export interface DamageRoll {
  amount: number;
  critical: boolean;
}

const CRITICAL_MULTIPLIER = 1.5;

export class DamageCalculator {
  /**
   * クリティカルはランダムだけにしない(§23)。
   * 現段階では「5の倍数コンボ達成」= 連続正解という学習上うれしい行動を報酬化する。
   */
  roll(combo: number, comboMultiplier: number): DamageRoll {
    const base = 20 + Math.floor(Math.random() * 11); // 20〜30(§17.1)
    const critical = combo > 0 && combo % 5 === 0;
    const amount = Math.round(
      base * comboMultiplier * (critical ? CRITICAL_MULTIPLIER : 1),
    );
    return { amount, critical };
  }

  /** 答えを見た後の復唱正解: 控えめな固定ダメージ(コンボ・クリティカルなし) */
  rollAfterReveal(): DamageRoll {
    return { amount: 15 + Math.floor(Math.random() * 6), critical: false };
  }
}
