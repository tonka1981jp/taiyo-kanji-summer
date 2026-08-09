# 漢字読みRPG アート量産仕様書（ChatGPT image 2.0 API 想定）

- 文書種別: アセット量産仕様 / パイプライン仕様
- 対象: スマホ向け漢字読みRPG
- 画像生成: ChatGPT image 2.0 API 想定
- APIキー: 別途用意
- 作成日: 2026-08-09

---

# 1. 目的

この仕様書の目的は、ChatGPT image 2.0 API を用いて、**ゲームアートを大量生成してもルックが崩れない運用ルール**を定義すること。

狙いは次の3つ。

1. アセット量産速度を上げる
2. 見た目の統一感を保つ
3. 実装側で使いやすい単位に分ける

---

# 2. 基本方針

## 2.1 画像生成を「お絵描き」ではなく「製造工程」にする

1枚ずつその場で考えて作ると、必ずブレる。

そのため、次を固定する。

- スタイル
- 解像度方針
- アセット分類
- 命名規則
- プロンプトテンプレート
- バリエーション方針
- 採用基準

---

# 3. 量産対象アセット

最低限、以下を生成する。

## 3.1 キャラクター

- 主人公
- 主人公差分
- NPC（必要なら）

## 3.2 敵

- 通常敵
- エリート敵
- ボス

## 3.3 背景

- ワールド背景
- バトル背景
- タイトル背景
- ワールド選択背景

## 3.4 UI補助素材

- フレーム
- パネル
- バナー
- ボタン素材
- アイコン

## 3.5 エフェクト素材

- 斬撃
- クリティカル
- 爆発
- キラキラ
- 属性エフェクト

---

# 4. 生成しないもの / 生成を慎重にするもの

- 漢字そのものの画像
- 細かい可読テキスト
- 重要UI文字
- 最終的なゲーム画面完成図の量産
- 9-slice前提のUI枠を雑に1枚画像化したもの

これらは実装側で組む方が安全。

---

# 5. なぜ文字画像を避けるか

画像生成は、文字や完全一致UIには不向きな場合がある。  
特に本作は「漢字の読み」が主題なので、**最重要文字を画像に焼き込むと後で困る**。

したがって、

- 漢字問題表示
- HP数値
- ダメージ数値
- ボタンテキスト

は原則コード描画とする。

---

# 6. スタイルガイド

## 6.1 本作の統一スタイル

> **Modern Pixel Fantasy for Kids**

具体的には、

- ピクセル風の冒険RPG
- 明るいファンタジー
- 小4向けに親しみやすい
- 少しかっこいい
- 怖すぎない
- 彩度は中〜やや高
- 子ども向けだが幼すぎない

## 6.2 ビジュアルルール

- 正面〜やや斜め向き
- 輪郭は分かりやすく
- シルエット重視
- 背景は整理されている
- モブ感ではなくゲーム用記号性を持つ

---

# 7. 画像仕様（原則）

## 7.1 背景

- 横長 or 縦長の使用箇所に応じて生成
- 情報密度は中程度
- キャラや漢字が載る前提で中央を空け気味に

## 7.2 敵

- 単体
- 透明背景推奨
- 全身
- 余白あり
- 向き統一

## 7.3 UI素材

- 透明背景推奨
- 角や枠の構造が分かるように
- 量産向けに装飾を盛りすぎない

## 7.4 エフェクト

- 透明背景推奨
- 1効果1素材
- 色違い量産しやすい構造

---

# 8. 命名規則

```text
asset_category__theme__name__variant
```

例:

```text
enemy__grassland__slime__v01
enemy__forest__horn_rabbit__v02
boss__volcano__magma_dragon__v01
bg__forest__battle__v01
ui__panel__kanji_card__v01
fx__slash__light__v01
```

---

# 9. ディレクトリ構成例

```text
assets/
├── concepts/
├── final/
│   ├── backgrounds/
│   ├── enemies/
│   ├── bosses/
│   ├── player/
│   ├── ui/
│   └── effects/
└── rejected/
```

---

# 10. プロンプト設計方針

## 10.1 必ず固定する要素

- ジャンル
- 対象年齢
- 色調
- ピクセル感
- 怖さの弱さ
- 使用用途
- 背景有無
- 構図
- 透明背景の要否

## 10.2 変える要素

- 敵種別
- ワールド
- 属性
- 表情
- 役割
- レア度
- ボス感

---

# 11. ベースプロンプトテンプレート

## 11.1 敵（透明背景）

```text
Create a game asset for a smartphone fantasy RPG for elementary school children. 
Draw a single enemy character in a modern pixel-fantasy style, cute but slightly cool, readable silhouette, bright colors, not scary, suitable for battle on a mobile screen. 
Full body, centered composition, transparent background, clean outline, consistent game-asset look.
```

## 11.2 ボス（透明背景）

```text
Create a boss enemy game asset for a smartphone fantasy RPG for elementary school children. 
Modern pixel-fantasy style, exciting and memorable, a little intimidating but not scary, strong silhouette, colorful, suitable for a kid-friendly adventure game. 
Full body, centered, transparent background, polished game asset.
```

## 11.3 背景

```text
Create a battle background for a smartphone fantasy RPG for elementary school children. 
Modern pixel-fantasy style, bright and adventurous, visually appealing but not too busy, designed so a character and a large kanji card can appear clearly in front. 
Landscape/game-background composition, clean midground and background separation.
```

## 11.4 UIパネル

```text
Create a decorative UI panel asset for a smartphone fantasy RPG for children. 
Modern pixel-inspired fantasy style, clean and readable, slightly magical, bright but not noisy, suitable for a kanji question card or info panel. 
Transparent background, polished game UI asset.
```

## 11.5 エフェクト

```text
Create a visual effect asset for a smartphone fantasy RPG. 
Modern pixel-inspired style, energetic, bright, readable on a mobile screen, suitable for attack impact / slash / critical hit. 
Transparent background, clean isolated effect.
```

---

# 12. 量産時の追加指示テンプレート

## 12.1 敵の差分例

- grassland slime
- horn rabbit
- mushroom soldier
- wind bird
- crystal golem
- magma dragon

## 12.2 雰囲気差分例

- cheerful
- mischievous
- energetic
- noble
- magical
- rocky
- fiery

---

# 13. ルック崩れを防ぐルール

## 13.1 毎回書く共通文

全ての生成依頼に、最低限次を入れる。

- smartphone fantasy RPG
- for elementary school children
- modern pixel-fantasy style
- bright
- readable silhouette
- not scary
- suitable for game asset
- consistent look

## 13.2 固定しないとブレやすいもの

- カメラ角度
- デフォルメ度
- 彩度
- 線の太さ
- ピクセル感の強さ
- 影の描き方

---

# 14. アセットごとの採用基準

## 14.1 敵

採用条件:

- 一目で何の敵か分かる
- 小さく表示しても識別できる
- かわいさ or かっこよさがある
- 怖すぎない
- 漢字カードを邪魔しない

## 14.2 背景

採用条件:

- 主役を邪魔しない
- 情報密度が適切
- ワールド差が出ている
- 色がきれい
- 前景・中景・背景が分かる

## 14.3 UI

採用条件:

- 文字を載せやすい
- 装飾が強すぎない
- 量産しやすい
- 他の画面にも使い回せる

## 14.4 エフェクト

採用条件:

- 小さくしても見える
- 何の効果か分かる
- 明るい
- 派手だが短時間で理解できる

---

# 15. 透明背景アセット方針

以下は原則 **transparent background** で生成する。

- 敵
- ボス
- プレイヤー
- UIフレーム
- UIバッジ
- 宝箱
- エフェクト
- アイコン

背景ありにするのは、

- タイトル背景
- ワールド背景
- バトル背景

のみを基本とする。

---

# 16. 敵のカテゴリ設計

## 16.1 通常敵

- 単純
- 1モチーフ1特徴
- シルエットが分かりやすい

## 16.2 エリート

- 1〜2要素追加
- 色や装備で強さを表現

## 16.3 ボス

- 大きい
- 顔 / ツノ / 翼 / 武器など記号性
- 物語の節目感

---

# 17. 量産順序

## Phase 1: 方向性確認

- 背景 2種
- 通常敵 5種
- ボス 2種
- UIカード 2種
- エフェクト 3種

この段階でルック決定。

## Phase 2: MVPアセット

- 主人公 1種
- 通常敵 10〜12種
- ボス 3種
- 背景 5〜7種
- UI 主要パーツ
- エフェクト一式

## Phase 3: 拡張

- イベント背景
- スキン差分
- 宝箱差分
- 図鑑アイコン
- 季節イベント

---

# 18. 参照画像の扱い

もし初回に当たりアセットが出たら、それを**今後の基準画像**として扱う。

ルール:

1. 主人公の当たりを1枚決める
2. 通常敵の当たりを2〜3枚決める
3. 背景の当たりを2枚決める
4. UIパネルの当たりを1枚決める

以後の生成では、

- このアセット群に寄せる
- 彩度とデフォルメ度を合わせる
- 構図を合わせる

---

# 19. 画像生成でやりがちな失敗

- 背景が描き込みすぎ
- かわいさが足りず怖い
- ピクセル感が強すぎて古臭い
- 子ども向けすぎて幼い
- UIがごちゃごちゃ
- 透明背景が不完全
- アセット同士の頭身差が激しい

---

# 20. 実装都合での注意

- 影付き1枚画像だけで済ませない
- UI枠は使い回せることを優先
- キャラの足元余白を少し持たせる
- スプライト化しやすいサイズ感にする
- バリエーションが欲しいからといってルックを崩さない

---

# 21. API利用時の運用ルール

## 21.1 リクエスト単位

1リクエストでやるべきこと:

- アセット種別を1つに絞る
- 使用用途を明示
- 背景有無を明示
- 対象年齢を明示
- スタイルを固定
- 余計なテキストを含めない

## 21.2 1回でやりすぎない

同時に

- 背景
- 敵
- UI
- エフェクト

を混ぜて生成しない。

理由:
- 評価軸が混ざる
- スタイルが崩れやすい
- 再現性が落ちる

---

# 22. おすすめ生成バッチ

## 22.1 敵バッチ

- スライム
- ツノうさぎ
- きのこ兵
- 風の鳥
- 草ゴーレム

## 22.2 背景バッチ

- 草原
- 森
- 洞窟
- 火山
- 遺跡

## 22.3 UIバッチ

- 漢字カード
- HPフレーム
- ボタン
- 宝箱パネル
- コンボバッジ

---

# 23. 品質チェックシート

各画像を次で確認する。

- 使い道が明確か
- スマホで見やすいか
- 小4に刺さりそうか
- 怖くないか
- 漢字表示を邪魔しないか
- 他アセットと並べて浮かないか
- 量産ルールに合うか

---

# 24. バージョン管理

採用画像はバージョンを持つ。

例:

```text
enemy__grassland__slime__v01
enemy__grassland__slime__v02
enemy__grassland__slime__final
```

最終採用前に `final` を付ける。

---

# 25. 生成→選定→実装の流れ

```text
プロンプト作成
↓
生成
↓
候補比較
↓
採用
↓
命名
↓
保存
↓
実装仮置き
↓
実機確認
↓
必要なら再生成
```

---

# 26. 今回の最終方針

本ゲームの画像生成は、

> **「ピクセルっぽい子ども向け冒険RPG」の一貫性を保ちながら、敵・背景・UI・エフェクトを役割ごとに量産する**

ことを目的とする。

特に重要なのは、

- 漢字を画像にしない
- アセット種別ごとに分けて生成する
- ルック固定文を毎回入れる
- 当たり画像を基準にして量産する

の4点である。
