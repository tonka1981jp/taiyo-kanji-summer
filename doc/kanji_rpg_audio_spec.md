# 漢字読みRPG サウンド設計仕様書（BGM / 効果音）

- 文書種別: オーディオ仕様 / 実装指針
- 対象: 小学4年生向けスマホRPG
- BGM制作: Suno想定
- 効果音制作: コード生成（Web Audio / ZzFX系）
- 作成日: 2026-08-09

---

# 1. 目的

この仕様書の目的は、本ゲームの音の役割を定義し、

- **BGMは世界観とワクワク感を作る**
- **効果音はゲームの気持ちよさと分かりやすさを作る**

という役割分担を明確にすること。

---

# 2. 基本方針

## 2.1 結論

- **BGM** は「冒険感・発見・少しの緊張」を作る
- **SE** は「正解の気持ちよさ・テンポ・状態の分かりやすさ」を作る
- 音声認識があるため、**SE/BGMはしゃべる瞬間を邪魔しない**ことが必須

---

# 3. サウンド全体コンセプト

## 3.1 キーワード

- わくわく
- 冒険
- 小さな達成
- 元気
- 親しみやすい
- 少しヒロイック
- 明るいファンタジー
- ゲームらしい

## 3.2 避けること

- 緊張感が強すぎる
- 暗すぎる
- 恐怖感
- EDMっぽすぎる強圧
- 声の認識を邪魔する高密度SE
- 教材っぽい音

---

# 4. 音の役割分担

## 4.1 BGMの役割

- ワールド感
- 進行感
- 感情の土台
- 遊び続ける気分の維持

## 4.2 効果音の役割

- 正誤の感覚
- 攻撃の爽快感
- 状態変化の通知
- ごほうび感

---

# 5. iPhone / スマホ前提の注意

- スピーカーが小さい
- ノイズ環境で遊ばれる
- 音量を上げにくい
- 音声認識中は音が邪魔になる場合がある

したがって、サウンドは

- 中域が分かりやすい
- 余韻が短い
- 低域頼みにならない
- 同時発音数を増やしすぎない

ことが重要。

---

# 6. BGM設計

## 6.1 BGMの方向性

完全チップチューンでもよいが、**子ども向けのワクワク感**を考えると

> **ピクセル風RPGに合う “現代的チップチューン / チップ要素入りファンタジーBGM”**

が適している。

つまり、

- 8bit感は少しある
- でも古すぎない
- 明るく耳に残る
- メロディがはっきりしている

---

# 7. BGMカテゴリ

最低限、以下を用意する。

## 7.1 タイトル

役割:
- はじまり感
- 期待感

雰囲気:
- 明るい
- 少し壮大
- テンポ中くらい

---

## 7.2 ワールド通常戦闘 / 通常探索兼用

役割:
- 長時間聴いて疲れない
- 進めたくなる

雰囲気:
- 軽快
- 冒険感
- チップ寄りでもよい

---

## 7.3 ボス戦

役割:
- 緊張
- 盛り上がり

雰囲気:
- テンポやや速め
- 強め
- でも怖すぎない

---

## 7.4 ステージクリア

役割:
- ごほうび
- 達成感

短いジングルでよい。

---

## 7.5 レベルアップ / 宝箱

役割:
- うれしさ
- キラキラ感

短いジングル。

---

# 8. Suno向けBGM発注方針

## 8.1 Sunoに求めるもの

- 完成曲
- ループしやすい
- メロディが分かりやすい
- 小4向けに明るい
- スマホゲームとして使いやすい

## 8.2 発注時に明確にする項目

- 用途
- 長さ
- 雰囲気
- テンポ感
- 楽器感
- チップ感の強さ
- 避けたい要素

---

# 9. Sunoプロンプトテンプレート

## 9.1 タイトルBGM

```text
A bright and adventurous fantasy game title theme for a mobile RPG for elementary school kids, slightly pixel-game inspired, catchy melody, uplifting, magical, friendly, light heroic mood, clean arrangement, not too intense, suitable for looping, instrumental.
```

## 9.2 通常ワールドBGM

```text
A cheerful and adventurous background music track for a mobile fantasy RPG, inspired by pixel-style games, catchy and light, playful but not childish, suitable for repeated listening, clear melody, light chiptune elements blended with warm fantasy instrumentation, instrumental, loop-friendly.
```

## 9.3 ボスBGM

```text
A fun and exciting boss battle theme for a mobile fantasy RPG for kids, energetic and heroic, stronger rhythm, light chiptune influence, adventurous and dramatic but not scary, memorable melody, instrumental, loop-friendly.
```

## 9.4 クリアジングル

```text
A short victory jingle for a mobile fantasy RPG, bright, satisfying, magical, rewarding, suitable for elementary school kids, instrumental.
```

## 9.5 宝箱 / レベルアップ

```text
A short reward jingle for a mobile game, sparkling, magical, exciting, happy, rewarding, instrumental.
```

---

# 10. BGMの楽曲仕様

## 10.1 長さ

- タイトル: 40〜90秒
- 通常BGM: 45〜90秒
- ボスBGM: 45〜90秒
- ジングル: 2〜8秒

## 10.2 ループ

Suno生成後に編集する前提で、

- 頭と終わりのつながり
- 余計な長いアウトロ
- 急停止

をチェックする。

## 10.3 注意

Sunoは意図どおりのループ構造にならないことがあるため、

- ループしやすい中間部を抽出する
- 必要ならDAW側で整える

前提で運用する。

---

# 11. 効果音設計

## 11.1 基本方針

効果音は外部素材依存ではなく、**コード生成**で行う。

利点:

- 容量が軽い
- 量産しやすい
- ゲームの反応速度が高い
- パラメータ調整で微修正できる
- ピクセルゲームとの相性がよい

---

# 12. 推奨方式

## 12.1 第一候補

- **ZzFX** などの超軽量コードSE
- または Web Audio API 直接生成

## 12.2 代替

- jsfxr / sfxr系
- Tone.jsによる短音SE
- 独自ラッパー

## 12.3 判断

本作では「毎フレーム豪華音響」より、**短い反応音の気持ちよさ**が重要。  
そのため、ZzFX系の小回りはかなり相性がよい。

---

# 13. 効果音カテゴリ

最低限必要なSE:

1. 問題表示
2. 正解
3. 再挑戦
4. 通常攻撃
5. クリティカル
6. 必殺技開始
7. 必殺技ヒット
8. 敵被弾
9. 敵撃破
10. 宝箱
11. レベルアップ
12. ボタン押下
13. ステージクリア
14. マイク待機補助（必要なら極小）

---

# 14. 音の性格

## 14.1 正解SE

- 明るい
- 1音〜2音
- すぐ理解できる
- 勉強アプリっぽくしない

イメージ:
- キラッ
- ピンッ
- シャキン

---

## 14.2 再挑戦SE

- 軽い
- 否定しすぎない
- 悲しくしない

イメージ:
- ポン
- トゥッ
- ピコ

NG:
- ブザー
- バツ感が強い音

---

## 14.3 攻撃SE

- 速い
- 斬撃感
- 軽い爽快感

---

## 14.4 クリティカルSE

- 明らかな強さ
- 少し大きい
- 明るい金属感 or 雷感

---

## 14.5 必殺技SE

- 期待感のある溜め
- 発動で派手
- ヒットで大きく

---

# 15. SEの長さ目安

- UI / 正解: 0.05〜0.25秒
- 攻撃: 0.08〜0.35秒
- クリティカル: 0.15〜0.45秒
- 必殺技: 0.2〜0.8秒
- ジングル: 0.5〜2秒

長すぎるSEはテンポを壊すので避ける。

---

# 16. 音量バランス方針

基準を `BGM = 1.0` とした相対値の例:

- UI SE: 0.8
- 正解 SE: 1.0
- 攻撃 SE: 1.1
- クリティカル: 1.2
- 必殺技: 1.3
- マイク待機補助音: 0.4

ただし実装ではユーザー音量やiPhone実機で再調整すること。

---

# 17. 音声認識との共存

## 17.1 最重要ルール

`LISTENING` 状態では、

- 大きいSEを鳴らさない
- BGMを少し下げる
- 余韻の長いSEを避ける

## 17.2 推奨制御

- `LISTENING`: BGM 70〜85%
- `EVALUATING`: 通常
- `ATTACK`: 通常
- `NO_SPEECH/RETRY`: 小さい補助音のみ

---

# 18. コード生成SEの設計方針

## 18.1 設計原則

SEをファイル名で管理するのでなく、**意味とパラメータで管理**する。

例:

```ts
type SoundId =
  | "ui.tap"
  | "quiz.show"
  | "answer.correct"
  | "answer.retry"
  | "battle.slash"
  | "battle.critical"
  | "battle.specialReady"
  | "battle.specialHit"
  | "enemy.hit"
  | "enemy.defeat"
  | "reward.levelup"
  | "reward.treasure"
  | "stage.clear";
```

---

# 19. 推奨SEライブラリ構造

```ts
interface ProceduralSfxDefinition {
  id: string;
  generator: "zzfx" | "webaudio";
  params: number[];
  volume: number;
}
```

または、

```ts
interface SfxFactory {
  play(id: SoundId): void;
}
```

---

# 20. 効果音のキャラ付け

## 20.1 正解

- 音程は上がる
- 明るい
- 小さな達成感

## 20.2 攻撃

- 短く切れる
- エッジあり
- 少し金属感

## 20.3 敵撃破

- はじける
- 落ちる
- 小さな勝利感

## 20.4 宝箱

- キラキラ
- 上昇音型

---

# 21. 実装例の考え方

ZzFX等での具体パラメータは開発中に調整する前提だが、方向は次の通り。

### answer.correct
- 短い上昇音
- 明るい矩形波 / 三角波

### answer.retry
- 小さな下降音
- でも暗すぎない

### battle.slash
- ノイズ成分を少し含む
- 短いアタック

### battle.critical
- 高音と低音の重ね
- 一瞬の広がり

---

# 22. やってはいけないこと

- 正解音が長すぎる
- 失敗音が怖い
- SEが大きすぎてマイク認識を妨げる
- 同時発音が多すぎる
- BGMが耳疲れする
- ボス戦が怖すぎる

---

# 23. 小4向けに刺さる音の特徴

- はっきりしている
- 分かりやすい
- ごほうび感がある
- ちょっとキラキラ
- ちょっとヒーロー感
- でもうるさすぎない

---

# 24. BGM / SE の責務分離

## 24.1 BGMが決めるもの

- ワールドの空気
- 冒険感
- そのステージの感情ベース

## 24.2 SEが決めるもの

- 手応え
- 正解の気持ちよさ
- テンポ
- 遊びの快感

---

# 25. 量産・運用方針

BGMは少数精鋭。

- タイトル
- 通常
- ボス
- クリア
- 宝箱

で十分始められる。

一方SEは多くてもよいが、**まずは10〜14種のコアSE**でよい。

必要なのは数ではなく、役割が明確であること。

---

# 26. 最終方針

本作のサウンド設計は、

> **BGMでワクワクを作り、SEで正解の快感を作る**

を基本とする。

さらに音声認識ゲームである以上、

> **しゃべる気持ちよさを邪魔しない音**

であることを最優先条件とする。
