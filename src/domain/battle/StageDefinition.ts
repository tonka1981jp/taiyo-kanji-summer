// 仕様書 §29〜30, §50: 敵データと学習データを分離する。
// 問題データは敵を知らず、ステージ側で enemyId と questionPoolId を結びつける。
// 見た目(EnemySkin)は presentation/data 側に持ち、ここには置かない。

export interface EnemyDefinition {
  id: string;
  name: string;
  attackStyle?: string;
}

export interface EncounterDefinition {
  enemyId: string;
  hp: number;
  isBoss?: boolean;
}

export interface StageDefinition {
  id: string;

  worldId: string;
  name: string;

  encounters: EncounterDefinition[];

  questionPoolId: string;

  recommendedLevel?: number;
}
