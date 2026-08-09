// 仕様書 §17.2: コンボ倍率テーブル

export class ComboSystem {
  private combo = 0;

  get current(): number {
    return this.combo;
  }

  /** 連続 CORRECT で増える */
  increment(): number {
    this.combo += 1;
    return this.combo;
  }

  reset(): void {
    this.combo = 0;
  }

  get multiplier(): number {
    if (this.combo >= 8) return 1.5;
    if (this.combo >= 5) return 1.3;
    if (this.combo >= 3) return 1.15;
    return 1.0;
  }
}
