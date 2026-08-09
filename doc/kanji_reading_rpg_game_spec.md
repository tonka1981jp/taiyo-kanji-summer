# 漢字読みRPG ゲーム仕様書

- 文書種別: 本番ゲーム仕様 / 実装仕様
- 対象: 小学4年生向け 漢字「読み」学習RPG
- 対象端末: iPhone Safariを優先
- 入力: 音声認識
- 将来拡張: 「書き」モードを同一ゲーム基盤へ追加可能にする
- 作成日: 2026-08-09

---

# 1. プロダクトの目的

本ゲームの目的は、漢字の読み練習を「問題集」としてではなく、**声で敵と戦うRPG**として成立させること。

子どもに見える体験は、

> 漢字を見る  
> → 声で読む  
> → 攻撃が出る  
> → 敵を倒す  
> → 次の敵へ進む

である。

内部では、

> 出題  
> → STT  
> → 正規化  
> → 正誤・STT混同判定  
> → 習熟度更新  
> → ゲームイベント発火

として処理する。

重要なのは、**学習ロジックとゲーム表現を完全に分離すること**。

ゲームの見た目を全面変更しても問題判定は変わらず、音声認識方式を変更しても戦闘画面は変わらない構造にする。

---

# 2. コアコンセプト

## 2.1 一言でいうと

> **声で攻撃する、漢字読みバトルRPG**

---

## 2.2 体験上の原則

### 原則A: 読むこと自体が攻撃操作

「問題に正解するとゲームが進む」ではない。

**声で読む = 攻撃コマンド**とする。

---

### 原則B: できるだけ触らない

開始後は、

```text
問題表示
↓
音声待機
↓
発話
↓
判定
↓
攻撃
↓
次問
```

を自動で回す。

目標:

> **1ステージ中は基本ノータップ**

---

### 原則C: STTミスで叱らない

音声認識には誤認識がある。

そのため、

```text
学習者の誤答
```

と、

```text
音声認識が怪しい
```

を同じ「不正解」にしない。

---

### 原則D: 演出は派手、待ち時間は短く

正解時は気持ちよくする。

ただし、

> 演出を見る時間 > 漢字を読む時間

にはしない。

通常攻撃演出は原則 **0.4〜0.9秒**。

ボス撃破やレベルアップのみ長めの演出を許可する。

---

# 3. ゲーム全体構造

```text
Game Shell
│
├── World / Stage
├── Battle
├── Progression
├── Reward
├── Save
│
├── Challenge Engine
│   ├── ReadingChallenge
│   └── WritingChallenge  ← 将来
│
├── Learning Core
│   ├── QuestionRepository
│   ├── AnswerEvaluator
│   ├── MasteryEngine
│   └── ReviewScheduler
│
└── Input Adapter
    ├── SpeechInput
    └── HandwritingInput ← 将来
```

---

# 4. 最重要な設計分離

## 4.1 Domain / Logic

画面を一切知らない。

担当:

- 問題選択
- 読み判定
- STT混同判定
- コンボ計算
- ダメージ計算
- 敵HP
- 習熟度
- 復習頻度
- ステージ進行
- 報酬
- セーブ

---

## 4.2 Presentation / View

学習内容を一切判断しない。

担当:

- 背景
- キャラクター
- 敵
- HPバー
- 漢字表示
- マイク表示
- 攻撃アニメーション
- エフェクト
- SE / BGM
- ダメージ数字
- コンボ表示
- リザルト

---

## 4.3 Infrastructure

外部環境との接続。

担当:

- Web Speech API
- iPhone Safari
- IndexedDB
- LocalStorage
- 音声権限
- Asset Loader

---

# 5. 推奨アーキテクチャ

```text
src/
├── app/
│   ├── App.ts
│   └── GameBootstrap.ts
│
├── domain/
│   ├── battle/
│   │   ├── BattleEngine.ts
│   │   ├── BattleState.ts
│   │   ├── DamageCalculator.ts
│   │   └── ComboSystem.ts
│   │
│   ├── learning/
│   │   ├── Question.ts
│   │   ├── QuestionRepository.ts
│   │   ├── AnswerEvaluator.ts
│   │   ├── TranscriptNormalizer.ts
│   │   ├── MasteryEngine.ts
│   │   └── ReviewScheduler.ts
│   │
│   └── progression/
│       ├── PlayerProgress.ts
│       ├── StageProgress.ts
│       └── RewardSystem.ts
│
├── application/
│   ├── BattleController.ts
│   ├── ReadingChallengeController.ts
│   └── StageController.ts
│
├── infrastructure/
│   ├── speech/
│   │   ├── SpeechRecognizer.ts
│   │   └── WebSpeechRecognizer.ts
│   ├── storage/
│   │   └── IndexedDbSaveRepository.ts
│   └── audio/
│       └── AudioManager.ts
│
├── presentation/
│   ├── scenes/
│   │   ├── TitleScene.ts
│   │   ├── WorldMapScene.ts
│   │   ├── BattleScene.ts
│   │   └── ResultScene.ts
│   ├── components/
│   │   ├── KanjiCard.ts
│   │   ├── EnemyHpBar.ts
│   │   ├── MicIndicator.ts
│   │   └── ComboCounter.ts
│   └── effects/
│       ├── SlashEffect.ts
│       ├── CriticalEffect.ts
│       └── DamagePopup.ts
│
└── data/
    ├── questions/
    ├── enemies/
    └── stages/
```

---

# 6. 問題データ仕様

## 6.1 基本形

```ts
export interface ReadingQuestion {
  id: string;

  text: string;
  reading: string;

  accepted: string[];
  sttConfusions: string[];

  grade: number;
  term: number;

  tags?: string[];
  difficulty?: 1 | 2 | 3 | 4 | 5;

  audioHint?: string;
}
```

例:

```ts
{
  id: "g4-t1-hikou",
  text: "飛行",
  reading: "ひこう",

  accepted: [
    "ひこう",
    "飛行",
    "非行"
  ],

  sttConfusions: [
    "きこう",
    "気候",
    "機構",
    "紀行",
    "寄港"
  ],

  grade: 4,
  term: 1,

  tags: ["二字熟語"],
  difficulty: 2
}
```

---

# 7. accepted と sttConfusions の意味

ここは仕様上、明確に分ける。

## 7.1 accepted

**正解として確定してよいSTT出力。**

例えば「ひこう」と発音した際に、

```text
ひこう
飛行
非行
```

のいずれかになるケース。

これらは、

```text
Correct
```

として即座に処理する。

---

## 7.2 sttConfusions

**STTが音響的に取り違えやすい候補。**

例:

```text
きこう
気候
機構
紀行
寄港
```

重要:

> `sttConfusions` を無条件で正解にはしない。

なぜなら、本当に子どもが「きこう」と誤読した可能性もあるから。

したがってデフォルト挙動は、

```text
STT_AMBIGUOUS
```

とする。

ゲーム上は、

```text
「もういちど きかせて！」
```

と再認識する。

### ペナルティ

なし。

- コンボを切らない
- 敵から攻撃されない
- 習熟度を下げない

つまり、

> **学習者のミスか機械のミスか分からない時は罰しない**

という方針。

---

# 8. AnswerEvaluator

返り値はbooleanにしない。

```ts
type EvaluationResult =
  | {
      type: "CORRECT";
      normalizedTranscript: string;
    }
  | {
      type: "STT_AMBIGUOUS";
      normalizedTranscript: string;
    }
  | {
      type: "INCORRECT";
      normalizedTranscript: string;
    }
  | {
      type: "NO_SPEECH";
    };
```

---

# 9. 判定順序

```text
raw transcript
      ↓
Normalize
      ↓
accepted に一致？
      │
 YES ─┴─→ CORRECT
      │
      NO
      ↓
sttConfusions に一致？
      │
 YES ─┴─→ STT_AMBIGUOUS
      │
      NO
      ↓
INCORRECT
```

---

# 10. TranscriptNormalizer

最低限、

- 前後空白削除
- 全角・半角正規化
- カタカナ → ひらがな
- 句読点削除
- 不要な空白削除

を行う。

例:

```text
" ヒコウ。 "
↓
"ひこう"
```

将来的に、

```text
漢字STT結果
↓
読み仮名化
```

を追加できる設計にする。

---

# 11. sttConfusions の追加方法

最初から全て人手で網羅しない。

運用ログから育てる。

```text
問題: 飛行
期待: ひこう

実際のSTT:
気候 12回
紀行 4回
機構 2回
```

一定数出たものを、

```ts
sttConfusions
```

へ追加する。

つまりこの配列は、

> **音声認識の実機ログから改善される辞書**

とする。

---

# 12. ゲーム画面の基本レイアウト

iPhone縦持ちを基本。

```text
┌──────────────────┐
│ STAGE 2-3    ⚡x4 │
│                  │
│       敵          │
│    [ モンスター ]  │
│ ███████░░  72 HP │
│                  │
│   ┌──────────┐   │
│   │          │   │
│   │   飛行    │   │
│   │          │   │
│   └──────────┘   │
│                  │
│  🎙 きいています  │
│                  │
│      4 COMBO     │
└──────────────────┘
```

---

# 13. ビジュアル方向性

## 13.1 テーマ

**「漢字 × 冒険ファンタジー」**

ただし、幼児向けには寄せすぎない。

小学4年生が、

> 「勉強アプリっぽくてダサい」

と感じない方向を狙う。

---

## 13.2 トーン

推奨:

- 少しカッコいい
- 少しコミカル
- 明るい
- 敵に怖さはない
- UIはゲーム寄り
- 学校教材感をできるだけ消す

---

## 13.3 画面の主役

常に、

> **出題漢字**

が最も読みやすいこと。

敵やエフェクトより視認性を優先する。

漢字カードは、

- 高コントラスト
- 大きな文字
- 余白を広く
- 1〜4文字程度を想定

---

# 14. ワールド設計

例:

```text
WORLD 1  はじまりの草原
WORLD 2  ささやきの森
WORLD 3  水晶洞窟
WORLD 4  風の高原
WORLD 5  灼熱火山
WORLD 6  天空遺跡
WORLD 7  魔王城
```

学習内容を露骨に、

```text
第1単元
第2単元
```

とは見せない。

ゲーム上は冒険として進める。

---

# 15. ステージ

1ステージ:

```text
通常敵
↓
通常敵
↓
エリート敵
↓
通常敵
↓
ボス
```

目安:

```text
8〜15問
3〜5分
```

長すぎない。

---

# 16. 敵と問題数

敵はHPを持つ。

例:

```text
スライム
HP 60

通常正解
20 damage
```

3問程度で撃破。

---

## ボス

```text
ドラゴン
HP 240
```

約8〜12問。

ただしコンボ・クリティカルにより短縮する。

---

# 17. ダメージシステム

基本:

```ts
damage =
  baseDamage
  * comboMultiplier
  * masteryBonus
  * criticalMultiplier;
```

ただし子どもには計算式を見せない。

---

## 17.1 基本攻撃

```text
20〜30 DAMAGE
```

---

## 17.2 コンボ

連続 `CORRECT` で増える。

```text
2 COMBO
3 COMBO
4 COMBO
...
```

### コンボ倍率

例:

```text
1〜2: x1.0
3〜4: x1.15
5〜7: x1.3
8〜:  x1.5
```

---

# 18. STT_AMBIGUOUS とコンボ

`STT_AMBIGUOUS` は、

```text
コンボ維持
ダメージなし
再挑戦
```

とする。

表示:

```text
👂 もういちど！
```

敵も攻撃しない。

---

# 19. 本当の誤答

`INCORRECT` の場合。

1回目:

```text
「おしい！ もういちど」
```

コンボは、

- 低学年モード: 維持
- 標準モード: 0へ
- 今回推奨: **維持するがコンボボーナスだけ一段下げる**

など調整可能。

初期版では、

> **コンボは切らない**

を推奨。

理由:

誤答への罰が強すぎると「声を出さない」方向へ学習する可能性があるため。

---

# 20. 誤答の段階的ヒント

同一問題で連続失敗した場合。

## 1回目

```text
もういちど！
```

---

## 2回目

```text
ひ○う
```

---

## 3回目

```text
ひこう
```

＋ 読み上げ音声。

その後、

```text
いっしょに言ってみよう
```

として再発話。

正しく復唱できれば攻撃。

---

# 21. 「失敗して止まる」を禁止

どんなケースでも、

```text
ゲームが進行不能
```

にしない。

以下すべて自動復帰する。

- no-speech
- STT error
- ambiguity
- 誤答
- タイムアウト

必要なら最終的に、

```text
答えを表示
↓
復唱
↓
次へ
```

まで進める。

---

# 22. 必殺技

学習行動そのものを必殺技ゲージにする。

例:

```text
正解 1回
↓
POWER +1
```

5個貯まると、

```text
必殺技 READY
```

次の正解で発動。

---

## 22.1 必殺演出

例:

```text
🔥 漢字ブレイカー
⚡ サンダースラッシュ
🌪 ことばの竜巻
```

0.8〜1.5秒程度。

毎回は長くしない。

---

# 23. クリティカル

条件例:

- 初見問題を即答
- 苦手漢字を正解
- 5コンボ
- 10コンボ

表示:

```text
CRITICAL!
```

重要:

ランダムだけにはしない。

> **学習上うれしい行動を派手に報酬化する**

---

# 24. 苦手漢字撃破ボーナス

Masteryが低い問題を正解すると、

```text
WEAK POINT!
```

のような特別表示。

内部では、

> 苦手克服

をゲーム上の「弱点攻撃」に変換する。

---

# 25. 習熟度

問題ごとに持つ。

```ts
interface QuestionProgress {
  questionId: string;

  correctCount: number;
  incorrectCount: number;
  ambiguousCount: number;

  streak: number;

  mastery: number; // 0..100

  lastAnsweredAt?: number;
  nextReviewAt?: number;
}
```

---

# 26. Mastery更新

単純な正解数だけにしない。

考慮:

- 初回正解
- 連続正解
- ヒントあり
- 誤答後正解
- 時間経過後の再正解

例:

```text
初回ノーヒント正解    +8
通常正解             +5
ヒント後正解         +2
誤答                 -3
STT_AMBIGUOUS          0
```

数値は調整可能。

---

# 27. 復習ロジック

出題を完全ランダムにしない。

候補重み:

```text
苦手             高
直近で誤答        高
少し前に覚えた    中
得意             低
```

ただし苦手ばかり出すと疲れる。

推奨比率:

```text
50% そのステージの通常問題
30% 苦手復習
20% 得意問題
```

得意問題は、

> 気持ちよく連勝するため

にも必要。

---

# 28. ボスの役割

ボスは単にHPが高い敵ではない。

そのワールドで学習した漢字の、

> **総復習イベント**

とする。

ボス戦出題:

```text
60% ワールド内の問題
25% 苦手
15% 過去ワールド
```

---

# 29. 敵データと学習データを分離

問題データに、

```ts
enemy: "slime"
```

を書かない。

ステージ側で、

```ts
{
  enemyId: "forest_wolf",
  questionPoolId: "g4-term1-stage2"
}
```

とする。

これにより同じ問題セットでも、

- 春イベント
- ハロウィン
- 宇宙ワールド
- ボスラッシュ

など見た目を変えられる。

---

# 30. Stage定義

```ts
interface StageDefinition {
  id: string;

  worldId: string;
  name: string;

  encounters: EncounterDefinition[];

  questionPoolId: string;

  recommendedLevel?: number;
}
```

例:

```ts
{
  id: "world1-stage3",
  worldId: "world1",
  name: "草原のぬし",

  questionPoolId: "g4-term1-001",

  encounters: [
    { enemyId: "slime", hp: 60 },
    { enemyId: "horn_rabbit", hp: 80 },
    { enemyId: "grass_golem", hp: 220 }
  ]
}
```

---

# 31. BattleEngine

BattleEngineは画面を知らない。

入力:

```ts
submitEvaluation(result)
```

出力:

```ts
BattleEvent[]
```

例:

```ts
[
  { type: "ANSWER_CORRECT" },
  { type: "COMBO_CHANGED", combo: 4 },
  { type: "DAMAGE", amount: 32 },
  { type: "ENEMY_HP_CHANGED", hp: 48 }
]
```

PresentationはこのEventを見てアニメーションする。

---

# 32. Event駆動

例:

```text
Domain
ANSWER_CORRECT
      ↓
BattleEventBus
      ↓
Presentation
      ├─ slash animation
      ├─ damage popup
      ├─ screen shake
      └─ SE
```

ロジック側に、

```ts
playSlashAnimation()
```

を書かない。

---

# 33. Battle State Machine

```text
ENTER
  ↓
QUESTION_PREPARE
  ↓
QUESTION_SHOW
  ↓
LISTENING
  ↓
EVALUATING
  ├── CORRECT
  │      ↓
  │   ATTACK
  │      ↓
  │   RESULT
  │
  ├── AMBIGUOUS
  │      ↓
  │   RETRY
  │
  └── INCORRECT
         ↓
      HINT / RETRY

RESULT
  ↓
ENEMY_DEFEATED?
  ├── NO → NEXT_QUESTION
  └── YES → NEXT_ENCOUNTER

最後
  ↓
STAGE_CLEAR
```

---

# 34. マイクUX

常に現在状態を視覚化。

## Listening

```text
🎙 きいています
```

軽く脈動。

---

## Evaluating

```text
✨ はんてい中
```

0.2〜1秒程度。

---

## Ambiguous

```text
👂 もういちど！
```

---

## No Speech

```text
🎙 よんでみよう！
```

---

# 35. STTテキストの表示

本番では原則、

```text
STTが何と認識したか
```

を大きく表示しない。

理由:

```text
飛行
```

を「ひこう」と答えたのに、

```text
非行
```

と画面に出ると混乱する。

開発モードのみ表示。

---

# 36. 開発デバッグHUD

URL:

```text
?debug=1
```

などで表示。

```text
Expected: ひこう
Raw STT: 気候
Normalized: 気候
Evaluation: STT_AMBIGUOUS
Confidence: 0.74
Retries: 1
Latency: 642ms
```

本番UIとは分離。

---

# 37. 音

ゲームへの没入感に重要。

最低限:

- 問題表示SE
- マイク開始SEは原則なし
- 正解SE
- 斬撃SE
- クリティカルSE
- 敵撃破SE
- ステージクリアSE
- ボスBGM

音声認識中にBGM / SEがSTTへ干渉しないよう注意。

---

# 38. BGM制御

`LISTENING` 中:

```text
BGM volume down
```

または端末・実機で問題なければ通常。

`ATTACK` 中:

```text
SE
```

`QUESTION_SHOW` 前にSEを収束させる。

---

# 39. 子どもが熱中するための報酬ループ

短期:

```text
正解
↓
攻撃
↓
数字
↓
コンボ
```

中期:

```text
敵撃破
↓
宝箱
↓
EXP
↓
レベルアップ
```

長期:

```text
ステージクリア
↓
次エリア解放
↓
新しい敵
↓
ボス
```

---

# 40. レベル

レベルアップで、

- 攻撃力上昇
- HP上昇
- 必殺技解放
- 見た目解放

など。

ただし、

> レベル不足で学習ステージを進めない

設計にはしない。

学習の邪魔になるため。

---

# 41. コレクション要素

敵を倒すと、

```text
モンスター図鑑
```

へ登録。

ボス撃破で、

```text
称号
```

を獲得。

例:

```text
草原マスター
10コンボの達人
読み名人
```

課金・ガチャは不要。

---

# 42. 宝箱

ステージ終了時、

```text
CLEAR
↓
宝箱
```

報酬:

- コイン
- キャラ衣装
- 武器見た目
- 必殺技エフェクト
- 図鑑

戦闘能力への影響は小さくする。

---

# 43. セッション時間

推奨:

```text
1ステージ 3〜5分
```

「あと1ステージ」が成立する長さ。

---

# 44. 連続プレイ

ステージクリア後:

```text
つぎへ
```

のボタンを出す。

完全放置を優先する場合、

```text
5秒後に次ステージ
```

も設定可能。

ただし保護者設定で、

```text
1日○分
```

など将来制御できる構造が望ましい。

---

# 45. 初回チュートリアル

説明文を読ませない。

画面:

```text
飛行
```

ナレーション:

```text
「声に出して読んでみよう！」
```

↓

認識成功

↓

攻撃。

これだけでルールを理解させる。

---

# 46. セーブ

ローカルファースト。

保存:

```text
player
stageProgress
questionProgress
settings
sttStats
```

IndexedDB推奨。

---

# 47. STT統計

本番でも個人特定不要なローカル統計を保持可能。

```ts
interface SttQuestionStats {
  questionId: string;

  acceptedHits: Record<string, number>;
  confusionHits: Record<string, number>;
  unknownHits: Record<string, number>;
}
```

目的:

- `accepted`
- `sttConfusions`

の改善。

---

# 48. プライバシー方針

原則:

> 音声そのものは保存しない。

保存するなら、

```text
STTが返したテキスト
判定結果
処理時間
```

程度。

クラウドAPIを使う場合は別途設計。

---

# 49. パフォーマンス

iPhone Safari優先。

目標:

- 初回表示 3秒以内を目指す
- 問題切替 即時
- 60fpsを目標
- 大容量動画は避ける
- エフェクトはSprite / Canvas中心
- 音声ファイルを大量に先読みしない

---

# 50. アート制作方式

本番の見た目変更を容易にするため、

```text
EnemyDefinition
```

と、

```text
EnemyVisual
```

を分ける。

例:

```ts
interface EnemyDefinition {
  id: string;
  maxHp: number;
  attackStyle: string;
}
```

```ts
interface EnemySkin {
  enemyId: string;
  spriteKey: string;
  hitEffectKey: string;
  deathEffectKey: string;
}
```

---

# 51. 初期MVPのコンテンツ量

最初の「遊べる版」は、

```text
3 WORLD
15 STAGE
敵 12種類
ボス 3種類
問題 60〜100
必殺技 3種類
```

程度でよい。

先に、

> 何度も遊びたくなる戦闘テンポ

を完成させる。

---

# 52. ゲームの品質指標

学習正答率だけで判断しない。

見るもの:

```text
1セッションの問題数
連続プレイ時間
翌日再プレイ
途中離脱位置
平均コンボ
誤答後離脱率
STT_AMBIGUOUS後離脱率
```

---

# 53. STT品質指標

```text
accepted率
sttConfusions率
unknown誤認識率
no-speech率
平均retry
平均判定時間
```

特に、

> 同一問題でsttConfusionsが多い

場合、その問題の語を改善対象とする。

---

# 54. 学習品質指標

```text
初回正答率
復習時正答率
ヒント使用率
7日後正答率
苦手→習得までの回答回数
```

---

# 55. ゲーム側と学習側の責務

## ゲーム側が決めないこと

- 正しい読み
- accepted
- sttConfusions
- 習熟度
- 次に出す問題

---

## 学習側が決めないこと

- 敵画像
- ダメージ演出
- BGM
- 画面揺れ
- 宝箱
- 背景

---

# 56. ReadingChallenge API

将来WritingChallengeと交換可能にする。

```ts
interface Challenge {
  prepare(): ChallengePrompt;
  submit(input: ChallengeInput): EvaluationResult;
}
```

Reading:

```text
ChallengePrompt
{
  display: "飛行"
}
```

Writing将来:

```text
ChallengePrompt
{
  display: "ひこう"
}
```

この構造により、

> RPG部分は共通のまま「読み」と「書き」を差し替えられる。

---

# 57. Presentation API例

PresentationはDomain Eventを受ける。

```ts
interface BattleRenderer {
  showQuestion(text: string): Promise<void>;

  showListening(): void;
  showRetry(reason: "ambiguous" | "incorrect" | "no-speech"): void;

  playAttack(event: AttackEvent): Promise<void>;
  playCritical(event: AttackEvent): Promise<void>;

  updateEnemyHp(hp: number): void;
  updateCombo(combo: number): void;

  playEnemyDefeat(): Promise<void>;
}
```

---

# 58. ゲームテンポ目標

理想:

```text
問題表示
0.4s
↓
発話
1.0s
↓
判定
0.5s
↓
攻撃
0.6s
↓
次問題
```

発話時間を除けば、

> **1〜1.5秒程度で次の問題**

へ進む感覚を目指す。

---

# 59. やってはいけないこと

## NG 1

毎問、

```text
🎤 ボタンを押してください
```

---

## NG 2

誤認識で、

```text
不正解！
❌
```

---

## NG 3

5秒の攻撃ムービーを毎問見る。

---

## NG 4

苦手漢字だけ延々出す。

---

## NG 5

ゲームUIの中で学習ロジックを直接実装する。

---

## NG 6

`sttConfusions` を全部正解扱いする。

---

# 60. 完成時の理想体験

子ども:

```text
「次ドラゴンじゃん」
```

↓

画面:

```text
飛行
```

↓

子ども:

```text
「ひこう！」
```

↓

```text
5 COMBO
CRITICAL!
58 DAMAGE
```

↓

次:

```text
必要
```

↓

```text
「ひつよう！」
```

↓

必殺技ゲージMAX。

子ども側の意識は、

> **漢字テストを20問やった**

ではなく、

> **ドラゴンを倒した**

である。

一方で内部では、

```text
20問の読み
苦手問題の再出題
習熟度更新
STT誤認識収集
```

が完了している。

これを本ゲームの完成形とする。

---

# 61. 実装優先順位

## Phase 1: Core

- Question
- accepted
- sttConfusions
- TranscriptNormalizer
- AnswerEvaluator
- SpeechRecognizer
- BattleEngine
- State Machine

---

## Phase 2: Playable

- 敵HP
- 攻撃
- コンボ
- 3種類の敵
- 1ボス
- ステージ
- セーブ

---

## Phase 3: Fun

- 必殺技
- クリティカル
- SE
- BGM
- 宝箱
- レベル
- マップ
- モンスター図鑑

---

## Phase 4: Learning

- Mastery
- ReviewScheduler
- 苦手優先
- ボス総復習
- STTログからconfusions改善

---

## Phase 5: Expansion

- 1学期全範囲
- 2学期
- 学年追加
- WritingChallenge
- 手書き認識

---

# 62. 最終設計原則

このゲームでは常に、

```text
Speech Recognition
≠
Learning Judgment
≠
Game Presentation
```

とする。

具体的には、

```text
SpeechRecognizer
      ↓
TranscriptNormalizer
      ↓
AnswerEvaluator
      ↓
Learning / Battle Domain
      ↓
BattleEvent
      ↓
Presentation
```

の一方向。

この分離を崩さない。

これにより、

- iPhone STTの改善
- Chromeへの移行
- 問題データ追加
- ゲームの全面リデザイン
- 「書き」モード追加

を互いに独立して行える。

---

# 63. この仕様で最も重要な判断

`accepted` と `sttConfusions` は同じ「正解候補」ではない。

```text
accepted
↓
正解確定
↓
攻撃

sttConfusions
↓
機械の聞き間違いかもしれない
↓
ノーペナルティ再認識
```

とする。

この差を持つことで、

> **音声認識に多少誤認識があっても、学習判定を壊さず、ゲームの気持ちよさも壊さない**

設計になる。

本ゲームではこの方針を標準とする。
