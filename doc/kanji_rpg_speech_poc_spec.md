# 漢字読みRPG 音声認識・実用性 検証仕様書

- 文書種別: PoC / 技術検証仕様
- 対象: 小学4年生向け「漢字の読み」RPG
- 優先端末: iPhone
- 代替端末: Mac + Google Chrome
- 検証対象ブラウザ: iPhone Safari / Mac Chrome
- ネイティブアプリ: 今回は対象外
- 作成日: 2026-08-09

---

## 1. この検証の目的

この検証の目的は、**iPhoneのブラウザだけで、子どもがほぼ手を使わずに「漢字を見る → 声で読む → 正誤判定 → 敵にダメージ → 次の問題」というゲームループを快適に繰り返せるか**を確認することである。

単に「音声認識APIが動いた」という技術確認では不十分。

最終的に知りたいことは次の1点。

> **iPhone Safariを本番プラットフォームとして採用してよいか。**

iPhone Safariが実用基準を満たさない場合、iPhoneネイティブアプリの開発には進まず、**Mac + Chromeを本番候補に切り替える**。

---

## 2. 今回の意思決定

検証後は必ず次のどちらかに決める。

### A. iPhone Safariを採用

以下が成立する場合。

- 日本語の短い読みを十分な精度で認識できる
- 子どもの声でも認識率が実用範囲にある
- 毎問題マイクボタンを押さなくても連続プレイできる
- 音声認識の開始・終了が安定している
- 認識待ちによるストレスが小さい
- 誤認識時にゲームとして自然にリカバリーできる

### B. Mac + Chromeへ切り替える

以下のどれかが重大な問題になる場合。

- iPhone Safariで音声認識セッションが頻繁に停止する
- 問題ごとにユーザー操作が必要になる
- 子どもの短い発話の認識率が低い
- 待ち時間が長い
- Safari固有の制約により安定したゲームループを作れない
- PWA / ホーム画面起動で必要機能が使えない
- ローカル処理またはプライバシー要件を満たす方法が現実的でない

**この場合、ネイティブiOSアプリ開発は行わない。**

---

# 3. 「ほったらかし」の定義

この企画でいう「ほったらかし」は、アプリをバックグラウンドで動かす意味ではない。

以下を意味する。

1. 子どもがゲームを開始する
2. 最初に必要ならマイク利用を許可する
3. 以降は画面を触らない
4. 漢字が表示される
5. 声で答える
6. 自動判定される
7. 戦闘演出が入る
8. 自動で次の問題へ進む

目標は、

> **1回の開始操作後、10問以上を画面タップなしで進行できること**

とする。

---

# 4. 今回は検証しないもの

PoCを小さく保つため、以下は実装しない。

- 書き取りゲーム
- 手書き認識
- キャラクター育成
- 装備
- アイテム
- 本格的なマップ
- ガチャ
- ログイン
- クラウドセーブ
- ランキング
- 課金
- 保護者画面
- 102漢字すべて
- ネイティブiOSアプリ

ゲーム性については、音声ゲームループを評価するために必要な最低限だけ作る。

---

# 5. PoCで実装するゲーム

## 5.1 画面

1画面のみ。

表示要素:

- 敵キャラクター
- 敵HP
- 現在の問題番号
- 漢字または熟語
- マイク状態
- 音声認識結果（検証モードのみ）
- 正解 / 再挑戦表示
- ダメージ表示
- コンボ数

例:

```text
STAGE 1-1

        [ スライム ]
        HP 72 / 100

          機械

       🎙 きいています

          ↓

        「きかい」

       せいかい！
       28 DAMAGE

        3 COMBO
```

---

# 6. 基本ゲームループ

```text
ゲーム開始
    ↓
マイク利用準備
    ↓
問題表示
    ↓
0.3〜0.8秒後に音声認識開始
    ↓
子どもが読む
    ↓
音声結果取得
    ↓
読みを正規化
    ↓
正誤判定
    ↓
 ┌──────────────┐
 │              │
正解            不一致
 │              │
攻撃            もう一度
 │              │
演出            再認識
 │              │
 └──────┬───────┘
        ↓
       次問
```

---

# 7. 検証用問題

最初は20語程度でよい。

目的は教材網羅ではなく、**音声認識の特性を見ること**。

以下のように音の特徴を分散させる。

```json
[
  { "text": "機械", "reading": "きかい" },
  { "text": "飛行", "reading": "ひこう" },
  { "text": "建物", "reading": "たてもの" },
  { "text": "必要", "reading": "ひつよう" },
  { "text": "健康", "reading": "けんこう" },
  { "text": "印刷", "reading": "いんさつ" },
  { "text": "静か", "reading": "しずか" },
  { "text": "季節", "reading": "きせつ" },
  { "text": "材料", "reading": "ざいりょう" },
  { "text": "伝える", "reading": "つたえる" },
  { "text": "選ぶ", "reading": "えらぶ" },
  { "text": "観察", "reading": "かんさつ" },
  { "text": "愛する", "reading": "あいする" },
  { "text": "約束", "reading": "やくそく" },
  { "text": "栄養", "reading": "えいよう" },
  { "text": "満足", "reading": "まんぞく" },
  { "text": "働く", "reading": "はたらく" },
  { "text": "競争", "reading": "きょうそう" },
  { "text": "関係", "reading": "かんけい" },
  { "text": "説明", "reading": "せつめい" }
]
```

本番教材の正確な1学期範囲への置き換えは、音声方式決定後に行う。

---

# 8. 正誤判定仕様

## 8.1 Speech-to-Textの文字列をそのまま比較しない

音声認識結果が、

```text
機械
```

になる場合も、

```text
きかい
```

になる場合も、

```text
機会
```

になる場合もあり得る。

そのため、

```javascript
transcript === "きかい"
```

だけでは判定しない。

---

## 8.2 判定層を分離する

```text
SpeechRecognizer
      ↓
raw transcript
      ↓
TranscriptNormalizer
      ↓
normalized reading
      ↓
AnswerEvaluator
      ↓
correct / retry
```

ゲームコードから音声認識APIを直接呼ばない。

---

## 8.3 PoCでの許容回答

各問題に許容文字列を持たせる。

例:

```json
{
  "text": "機械",
  "reading": "きかい",
  "accepted": [
    "きかい",
    "キカイ",
    "機械",
    "機会"
  ]
}
```

ただしこれはPoC方式。

最終版では、

- カタカナ → ひらがな
- 空白除去
- 句読点除去
- STTが返した漢字表記の読み変換

などを行う `TranscriptNormalizer` の導入を検討する。

---

# 9. 音声認識インターフェース

ゲーム本体とブラウザ音声APIを分離する。

```typescript
interface SpeechRecognizer {
  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;

  onResult(callback: (result: SpeechResult) => void): void;
  onError(callback: (error: SpeechError) => void): void;
}

interface SpeechResult {
  transcript: string;
  confidence?: number;
  isFinal: boolean;
}
```

将来、

```text
SpeechRecognizer
├── SafariSpeechRecognizer
├── ChromeSpeechRecognizer
├── ChromeLocalSpeechRecognizer
└── CloudSpeechRecognizer
```

へ差し替え可能にする。

---

# 10. iPhone Safari 検証

## 10.1 最優先確認

ページ読み込み時に以下を記録する。

```javascript
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;
```

確認項目:

- SpeechRecognitionが存在するか
- `lang = "ja-JP"` で開始できるか
- microphone permissionが取得できるか
- `start()` が成功するか
- `result` が返るか
- `end` 後に再度 `start()` できるか
- これを20問以上連続できるか

---

## 10.2 iPhoneで特に検証すること

### T-IOS-01 初回起動

1. SafariでURLを開く
2. STARTを押す
3. マイク許可
4. 問題開始

期待結果:

- 追加操作なしで1問目まで到達する

---

### T-IOS-02 単語認識

「機械」を表示。

被験者:

> きかい

期待結果:

- 認識結果が取得できる
- 正解判定になる
- ダメージ演出が出る

---

### T-IOS-03 連続10問

10問連続で回答。

期待結果:

- 問題ごとのマイクボタン操作が不要
- 途中でSpeechRecognitionが停止しても自動復帰できる
- 10問終了までゲームを操作しなくてよい

---

### T-IOS-04 連続30問

30問連続。

確認:

- start / end の失敗
- no-speech
- aborted
- network
- not-allowed
- audio-capture

などのエラー発生数。

---

### T-IOS-05 無言

問題表示後5秒間話さない。

期待:

```text
「よんでみよう！」
```

などの表示後、再度待ち受け。

ゲームオーバーにはしない。

---

### T-IOS-06 誤答

「機械」に対して、

> ひこう

期待:

```text
もういちど！
```

→ 自動再認識。

---

### T-IOS-07 音声認識ミス

正しく「きかい」と言ったのに誤認識されたケース。

確認:

- 子どもが失敗したように見えすぎないか
- すぐ再挑戦できるか
- タップ不要か

---

### T-IOS-08 Safari通常タブ

必須。

Safari通常タブで全項目をテストする。

---

### T-IOS-09 ホーム画面追加

補助検証。

PWA / ホーム画面追加状態でも同じテストを行う。

ただし**Safari通常タブで成功し、ホーム画面版だけ失敗する場合は、Safari通常タブでの運用も候補として残す。**

WebKitの公開バグ情報では、ホーム画面WebアプリでSpeechRecognitionが利用できないケースが報告されているため、通常SafariとPWAは別物として検証する。

---

# 11. Mac Chrome 検証

iPhone Safariが基準未達の場合はこちらを本命にする。

## 11.1 通常SpeechRecognition

確認:

- SpeechRecognition利用可否
- `ja-JP`
- 短語認識
- 連続30問
- 自動restart

---

## 11.2 オンデバイス認識

Chrome系で対応している場合、

```javascript
recognition.processLocally = true;
```

をテストする。

さらに対応環境では、

```javascript
SpeechRecognition.available(...)
SpeechRecognition.install(...)
```

も確認する。

目的:

> **クラウドへ音声を送らず、ローカルだけで漢字読み判定を成立させられるか**

---

## 11.3 ローカル認識は必須条件ではない

重要度は、

1. ゲームとして安定する
2. 認識精度が高い
3. レスポンスが速い
4. ローカル処理

とする。

ローカル認識だけに固執してゲーム品質を落とさない。

ただし児童の音声を扱うため、本番化時には音声処理経路とプライバシー方針を別途確定する。

---

# 12. 測定する数値

各発話についてログを保存する。

```typescript
interface RecognitionLog {
  platform: string;
  browser: string;

  question: string;
  expected: string;
  transcript: string;

  correct: boolean;

  recognitionStartedAt: number;
  speechDetectedAt?: number;
  resultAt?: number;

  error?: string;
  retryCount: number;
}
```

---

## 12.1 認識成功率

```text
正しく発音した問題のうち
正解と判定された割合
```

大人と子どもを分けて測る。

---

## 12.2 False Negative

正しく言ったのに不正解になる割合。

このゲームでは最重要。

理由:

> 音声認識の失敗を、子どもが「自分が漢字を間違えた」と受け取る可能性があるため。

---

## 12.3 False Positive

間違った読みを正解にしてしまう割合。

学習アプリなのでこちらも重要。

---

## 12.4 レスポンス時間

測定:

```text
発話終了
↓
正誤結果表示
```

目標:

- 快適: 1秒未満
- 許容: 1.5秒程度
- 要改善: 2秒超
- 厳しい: 3秒超

※ 実際にはブラウザが正確な「発話終了時刻」を提供しない場合があるため、PoCでは近似値でもよい。

---

## 12.5 Retry率

```text
1問を正しく処理するまでに
何回認識を行ったか
```

平均Retryが多いとゲームテンポが崩れる。

---

# 13. 合格基準

## iPhone Safari GO

最低ライン:

| 項目 | 基準 |
|---|---:|
| 子どもの正しい読みの認識成功率 | 90%以上 |
| False Positive | 3%以下 |
| 10問タップなし完走率 | 95%以上 |
| 30問中の致命的停止 | 0回 |
| 1問ごとの手動マイク操作 | 不要 |
| 通常レスポンス | おおむね1.5秒以内 |
| エラーからの自動復帰 | 可能 |

さらに主観評価:

- 子どもが音声認識を待っている感覚が強くない
- 「ちゃんと言ったのに！」が頻発しない
- 10分程度遊べる
- 親が横で操作し続ける必要がない

---

# 14. 切り替え基準

次の場合、iPhone Safariの深追いをしない。

### 即Mac Chromeへ切り替え

- 問題ごとにユーザー操作が必要
- 10問連続プレイが安定しない
- SpeechRecognitionが頻繁に復帰不能になる
- 正しい子どもの発話で認識成功率80%未満
- 1問処理に平均3秒以上
- OS / Safari依存の挙動が強く、回避策が複雑

### 条件付き検討

認識率:

```text
80〜89%
```

の場合。

以下を試す。

- accepted候補改善
- transcript正規化
- 問題ごとの認識候補最適化
- 発話開始タイミング改善
- 無音判定改善

これで90%以上にならなければMac Chromeへ移行。

---

# 15. 評価人数

技術PoCなので大規模テストは不要。

最低:

- 大人 1名
- 小学4年生 1名

推奨:

- 大人 2名
- 子ども 2〜3名

1人につき、

```text
20語 × 3周 = 60発話
```

程度。

最重要なのは大人の認識率ではなく、**実際の対象年齢の声で成立すること**。

---

# 16. テスト環境記録

結果には必ず以下を記録する。

```text
device:
iPhone 15

iOS:
xx.x

browser:
Safari xx.x

network:
Wi-Fi

microphone:
built-in

room:
quiet / TVあり / 生活音あり

distance:
約30cm
```

Macでも同様。

---

# 17. ノイズ条件

最低3種類。

### QUIET

静かな部屋。

### NORMAL

家庭の普通の生活音。

### NOISY

テレビや会話が少し聞こえる環境。

本番想定は `NORMAL`。

QUIETでしか成立しない場合は要注意。

---

# 18. ゲームとしての評価

技術的認識率だけでは採用しない。

観察項目:

- 漢字を見たら自然に声を出すか
- マイク状態が理解できるか
- 誤認識時に怒るか
- 再挑戦を嫌がらないか
- ダメージ演出に反応するか
- コンボを続けようとするか
- 10問後も続けたがるか
- 漢字より演出を待つ時間が長くなっていないか

---

# 19. 演出仕様

PoCでは短くする。

### 正解

```text
せいかい！
↓
斬撃
↓
XX DAMAGE
```

演出:

```text
300〜700ms
```

程度。

### 不正解 / 認識失敗

```text
もういちど！
```

のみ。

大きな×

```text
❌
```

は原則出さない。

理由:

音声認識側のミスなのか学習者側のミスなのか、システムには完全には区別できないため。

---

# 20. マイク状態表示

最低3状態。

```text
🎙 きいています
```

```text
⚙ はんてい中
```

```text
👂 もういちど
```

子どもが、

> 今しゃべっていいのか

を迷わないこと。

---

# 21. PoC技術構成

推奨:

```text
TypeScript
Vite
HTML / CSS
Web Speech API
```

Phaserは**PoCでは必須ではない**。

敵画像をCSS / Canvas / SVG等で最低限表示してもよい。

理由:

今回検証したいのはゲームエンジンではなく、

> Speech → 判定 → 戦闘 → 次のSpeech

という連続ループだから。

音声方式が決まった後にPhaserへ統合する。

---

# 22. 推奨ファイル構成

```text
src/
├── main.ts
├── game/
│   ├── BattleLoop.ts
│   └── BattleState.ts
│
├── learning/
│   ├── questions.ts
│   ├── AnswerEvaluator.ts
│   └── TranscriptNormalizer.ts
│
├── speech/
│   ├── SpeechRecognizer.ts
│   ├── WebSpeechRecognizer.ts
│   └── SpeechSupportDetector.ts
│
├── telemetry/
│   └── RecognitionLogger.ts
│
└── ui/
    └── BattleScreen.ts
```

---

# 23. 将来の「書き」への拡張

ゲームループは入力方法に依存させない。

```text
BattleEngine
     │
     ├── ReadingChallenge
     │       └── SpeechInput
     │
     └── WritingChallenge
             └── HandwritingInput
```

共通:

- 敵
- HP
- EXP
- コンボ
- ステージ
- セーブ
- 習熟度

差分:

```text
Reading
漢字 → 読みを声で回答

Writing
読み → 漢字を手書き
```

---

# 24. 検証の順序

## STEP 1

Macで開発環境作成。

---

## STEP 2

最小音声テスト。

```text
機械
↓
「きかい」
↓
transcript表示
```

ゲームはまだ不要。

---

## STEP 3

iPhone Safari実機確認。

ここでSpeechRecognition自体が不安定なら早期判断。

---

## STEP 4

10問連続ループ。

---

## STEP 5

ダメージ / コンボ追加。

---

## STEP 6

子ども実機テスト。

---

## STEP 7

iPhone Safari採用判定。

```text
PASS
↓
iPhone Safariで開発継続


FAIL
↓
Mac Chromeへ切り替え
```

---

# 25. 一番重要な検証仮説

このPoCで検証する仮説は3つ。

## 仮説1

> 小学4年生の短い日本語発話でも、ブラウザ音声認識でゲームに使える精度が出る。

## 仮説2

> マイクを毎回操作しなくても、SpeechRecognitionを再起動しながら連続問題を処理できる。

## 仮説3

> 音声認識の多少の失敗をゲーム側の「再挑戦」に吸収すれば、子どもにとって不快にならない。

仮説1だけ成立しても不十分。

**3つすべて成立して初めて、この方式を採用する。**

---

# 26. この検証で答えを出したい質問

最終レポートでは以下だけ答えればよい。

```text
Q1.
iPhone Safariで音声読みRPGは実用になるか？

YES / NO


Q2.
子どもの正しい発話を90%以上認識できたか？

YES / NO


Q3.
10問以上タップなしで遊べたか？

YES / NO


Q4.
音声認識待ちがゲームテンポを壊したか？

YES / NO


Q5.
PWA化は可能だったか？

YES / NO / 不要


Q6.
採用プラットフォームは？

iPhone Safari
or
Mac Chrome
```

---

# 27. 現時点の技術前提

2026年8月時点の公開情報では、SafariはWeb Speech APIによる音声認識を提供しており、WebKitはSafari 14.1でSiriと同系統の音声認識エンジンによるSpeechRecognition対応を発表している。

一方、WebKitの公開バグでは、ホーム画面に追加したWebアプリでSpeechRecognitionを使用できないケースが記録されている。そのため、本検証では**Safari通常タブとホーム画面版を分けてテストする**。

Web Speech APIには端末内処理を要求する `processLocally`、ローカル音声モデルの可否確認 `SpeechRecognition.available()`、インストール `SpeechRecognition.install()` が仕様化されている。ただし実験的機能を含み、ブラウザ差があるため、機能検出して使う。

Mac Chromeでは、このオンデバイス音声認識経路も追加検証対象とする。

---

# 28. 結論

今回のPoCは、

> **「音声認識ができるか」**

を確認するものではない。

確認するのは、

> **「小学4年生が、iPhoneを置いたまま、漢字を声で読み続けるだけでRPGを遊べるか」**

である。

ここが成立すればiPhone Safariを採用する。

成立しなければネイティブiOSアプリへは進まず、

> **Mac + Chrome**

へ切り替える。

この判断をできるだけ小さい実装で早く行うことを、本検証の成功条件とする。

---

# 参考資料

- WebKit: New WebKit Features in Safari 14.1  
  https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/

- WebKit Bugzilla: Speech recognition service is not available in Home Screen web apps  
  https://bugs.webkit.org/show_bug.cgi?id=225298

- MDN: SpeechRecognition  
  https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

- MDN: SpeechRecognition.processLocally  
  https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally

- MDN: SpeechRecognition.available()  
  https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static

- MDN: SpeechRecognition.install()  
  https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/install_static

- Chrome for Developers: Chrome 150 release notes  
  https://developer.chrome.com/release-notes/150

- Web Speech API specification  
  https://webaudio.github.io/web-speech-api/
