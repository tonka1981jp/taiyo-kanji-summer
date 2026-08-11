# アセット制作マニュアル(画像 / SE / BGM)

- 文書種別: 制作手順書 / 横展開用
- 出典: 漢字読みRPG(taiyo-kanji-summer)で運用実績のある仕組み
- 対象: 新規ゲームプロジェクトでのアセット制作(AI画像・コード生成SE・Suno発注BGM)
- 姉妹文書: `kids_game_playbook.md`(設計思想) / 本書は具体的な作業手順
- 作成日: 2026-08-11

---

# 1. AI画像生成パイプライン

## 1.1 新プロジェクトへコピーするファイル

```text
scripts/generate-assets.mjs   … 生成スクリプト本体(カテゴリ・プロンプト定義込み)
scripts/strip_magenta.py      … 透過用クロマキー後処理(要 python3 + Pillow + numpy)
.env.example                  … キー設定の雛形
```

`.gitignore` に必ず追加:

```text
.env
assets/concepts/
assets/rejected/
```

## 1.2 APIキーの置き方

**リポジトリ直下の `.env`** に書く(gitignore済みなのでコミットされない):

```text
OPENAI_API_KEY=sk-xxxx
# 任意: モデル上書き(既定 gpt-image-2)
# IMAGE_MODEL=gpt-image-2
```

- `.env.example` をコピーして作る。スクリプトが起動時に自動で読む(dotenv不要の自前パーサ)
- 環境変数 `export OPENAI_API_KEY=...` でも可(.envより優先)
- **公開前チェック**: `git log --all --oneline -- .env` が空であることを確認する。
  一度でも履歴に入れたらキーを失効させて作り直す(履歴の削除で誤魔化さない)

## 1.3 基本コマンド

```bash
node scripts/generate-assets.mjs enemies                 # カテゴリ一括
node scripts/generate-assets.mjs backgrounds --theme title   # テーマ絞り込み
node scripts/generate-assets.mjs enemies --item slime --count 3  # 個別・候補3枚
node scripts/generate-assets.mjs ui --model gpt-image-1  # モデル指定
```

出力: `assets/concepts/<prefix>__<theme>__<name>__vNN.png`(連番自動)

## 1.4 スタイル固定(ルック崩れ防止)

スクリプト冒頭の `STYLE_LOCK` が全プロンプトに自動で入る。プロジェクト開始時にここだけ書き換える:

```text
Smartphone fantasy RPG game asset for elementary school children.
Modern pixel-fantasy style: pixel-art flavor with smooth detailed shading,
NOT extremely low-resolution 8-bit retro. Bright colors, readable silhouette,
not scary, cute but slightly cool, consistent game-asset look, polished quality.
```

ポイント:

- 「NOT extremely low-resolution 8-bit retro」を入れないと極端なドット絵に振れる
- 対象年齢・not scary・readable silhouette は毎回必須
- カテゴリ(敵/背景/UI/エフェクト)を**1回の実行で混ぜない**(評価軸が混ざりルックが崩れる)

## 1.5 透過アセットの作り方(重要な落とし穴)

**gpt-image-2 は `background: "transparent"` 非対応。**
プロンプトで透過を頼むと市松模様を「絵として」描き込んでくる。

運用実績のある解:

1. プロンプトで「completely flat, uniform, solid bright magenta background (#FF00FF), no checkerboard, no shadow」を指定(スクリプトの `CHROMA_BG` 定数)
2. 保存直後に `strip_magenta.py` が自動実行され、実アルファ付きPNGに変換される

クロマキーの仕様(調整済みなので基本触らない):

- 強マゼンタ(r>190 & b>190 & g<100 & min(r,b)-g>120)のみ背景判定
  → キャラの紫・ピンク(ほっぺ・虹色の翼)は巻き込まない
- 境界1〜2pxフェザリング+エッジのマゼンタ被り除去(デスピル)
- 出力ログの `transparent: NN%` が 40〜70% なら正常。10%未満はキー失敗を疑い目視確認

背景画(不透過)はこの処理不要。カテゴリ定義の `background: "opaque"` で自動的にスキップされる。

## 1.6 選定と昇格

```text
生成 → assets/concepts/ に候補が溜まる
  ↓ 目視選定(チェック: シルエット明快か / 怖くないか / 主役(問題表示)を邪魔しないか / 並べて浮かないか)
採用 → assets/final/<カテゴリ>/ へコピー(以後の「基準画像」。ルックはこれに寄せる)
不採用 → assets/rejected/ へ移動(削除しない。プロンプト改善の材料)
```

## 1.7 Web用の縮小・配置

原寸(1024〜1536px, 1.5MB前後)をそのまま使わない。Pillowで縮小して `public/game/` へ:

| 用途 | サイズ | 形式 | 目安容量 |
|---|---|---|---|
| 敵・キャラ(透過) | 512px | PNG | 200〜300KB |
| ボス・SSR級(透過) | 640px | PNG | 400〜600KB |
| 戦闘・タイトル背景 | 768×1152 | **JPEG** q82-85 | 150KB |
| カード背景 | 384×576 | JPEG q82 | 30KB |
| UIパーツ(透過) | 768px | PNG | 500KB前後 |

コード側は必ず `assetUrl("game/...")` ヘルパー経由で参照(GitHub Pagesのサブパス対応)。

## 1.8 費用を抑える設計(先に決めておく)

- **文字・数字は絶対に画像に焼かない**(全部コード描画)。焼くと差し替え地獄+費用爆発
- 「N種の背景 × プログラム装飾(ハッシュで色相・光沢を決定論的に変化)」で
  少数の生成画像を大量のバリエーションに見せる(実績: カード背景10枚 → 102枚の漢字カード)
- キャラ絵は使い回す(バトル敵の絵をそのままレアカードに。追加費用ゼロ)
- 生成順序: 方向性確認の少数バッチ(背景2・敵5・ボス2・UI2・FX3程度)→ 当たり決定 → 量産
- 個別の再生成は `--item X --count 3` で候補を出して選ぶ(一括再生成しない)

---

# 2. 効果音(SE)= コード生成

## 2.1 方針

外部素材・音声ファイルを使わない。**Web Audio APIで波形をその場で合成**する。

- 容量ゼロ・ロードなし・反応即時
- パラメータ調整だけで微修正できる(ファイル差し替え不要)
- コピーするファイルは `src/infrastructure/audio/Sfx.ts` 1つ

## 2.2 音のレシピ(実績値。新しいSEはこの型から作る)

| 意図 | レシピ | 実例パラメータ |
|---|---|---|
| 正解・肯定 | **上昇する2音**(矩形波) | 784Hz 0.09s → 1175Hz 0.14s |
| 再挑戦・軽い否定 | 小さな下降1音(三角波・音量小) | 494→440Hz 0.1s vol0.35 ※ブザー絶対禁止 |
| 出題・通知 | 短い上昇1音(三角波) | 523→784Hz 0.09s |
| 斬撃・打撃 | **ノイズ+低い下降音** | noise 0.09s + 320→90Hz 矩形波 |
| クリティカル | 高音上昇+低音下降+ノイズの重ね | 1047→1568 saw + 262→131 sq + noise |
| 撃破 | 長めの下降+跳ねる高音2連 | 880→220Hz 0.3s + 1319/1760Hz |
| ごほうび・キラキラ | **上昇アルペジオ** | [523,659,784,1047,1319] step0.09 三角波 |
| UIタップ | 極短の上昇音 | 660→880Hz 0.06s |
| 状態補助(マイク開始等) | サイン波・極小音量 | 988Hz 0.05s vol0.15 |

長さの上限: UI/正解 0.25s / 攻撃 0.35s / クリティカル 0.45s / ジングル 2s。
**長いSEはテンポを壊す。迷ったら短く。**

## 2.3 実装の約束事

- `SoundId` は意味で命名(`answer.correct`, `battle.slash`)。ファイル名管理をしない
- エンベロープは「立ち上がり8ms → 指数減衰」(ブツ音防止)
- マスター音量は設定画面から変更可能にする(§4参照)
- **iOS解錠**: 最初のユーザータップ内で `AudioContext` を resume する(`unlock()`)

---

# 3. BGM = Suno で人間に作らせる

## 3.1 発注の全体像

```text
①このマニュアルの曲リスト+プロンプトを渡す
②Sunoで生成(人間が試行・選曲)
③ループ加工(必要なら)
④指定ファイル名で public/audio/bgm/ に置く
⑤git push → 自動デプロイで本番に乗る(コード変更不要)
```

ゲーム側は「決まったファイル名があれば鳴らす / 無ければ無音+SE代用」で動くため、
**曲の納品とゲーム開発を完全に並行できる。**

## 3.2 曲リストの標準構成(まずこの6曲)

| ファイル名 | 用途 | 長さ | ループ |
|---|---|---|---|
| `title.mp3` | タイトル | 40〜90秒 | する(コード側でloop) |
| `world1.mp3` | 通常プレイ(ワールド1) | 45〜90秒 | する |
| `world2.mp3` | 通常プレイ(ワールド2) | 45〜90秒 | する |
| `boss.mp3` | ボス戦(共通) | 45〜90秒 | する |
| `clear.mp3` | クリアジングル | 2〜8秒 | しない |
| `treasure.mp3` | ごほうびジングル | 2〜8秒 | しない |

ワールド追加時は `world3.mp3` を足すだけ(コード側の `BgmName` に1語追加)。
ボス曲は全ワールド共通で十分始められる。少数精鋭。

## 3.3 発注プロンプトの型

**全曲共通の必須条件(これを外すと事故る):**

- **instrumental / no vocals(歌・歌詞・ハミング禁止)**
  → 音声認識ゲームではSTTが歌詞を拾って誤認識する。認識がなくても子どもの発話と混ざる
- スマホスピーカー前提: 中域がはっきり・低域頼み禁止・余韻短め
- loop-friendly を明記
- 60 seconds 程度を指定(長すぎる生成を防ぐ)

**ニュアンス指定の書き方**(日本語で意図 → 英語で発注):

```text
例: ボス曲
意図: RPGの戦闘曲。8bitのチップチューン。緊張感とポップさの両立。
     テンポ速め、ヒロイック、でも怖すぎない。

発注: Exciting RPG boss battle theme, 8-bit chiptune, a perfect balance of
tension and pop catchiness, fast tempo, heroic and dramatic but kid-friendly
and not scary, driving rhythm, memorable melody, instrumental, no vocals,
loop-friendly, 60 seconds.
```

雰囲気の語彙(子ども向けで使い回せる):

- 明るい系: bright, cheerful, playful, bouncy, uplifting, catchy
- 冒険系: adventurous, heroic, epic(弱めに), magical
- 神秘系: mysterious, gentle bells, soft arps, curious
- 禁止系(必ず添える): not scary, not intense, kid-friendly

## 3.4 選曲チェックリスト(人間の耳で確認)

- [ ] 歌声・コーラス・ハミングが一切入っていない
- [ ] 30秒聴き続けて疲れない(通常曲は何十回も聴かれる)
- [ ] スマホのモノラルスピーカーで鳴らしてメロディが聞こえる
- [ ] 怖くない・暗くない(子どもに聴かせて表情を見るのが確実)
- [ ] 曲頭がスッと始まる(長いイントロはゲームでは待ち時間)

## 3.5 ループ加工

Sunoは意図どおりのループ構造にならない前提で運用する:

- 頭と終わりが自然につながる**中間部を切り出す**(イントロ・長いアウトロは捨てる)
- 波形編集は Audacity 等で: ゼロクロス点でカット、つなぎ目に10〜20msのクロスフェード
- 完璧を目指さない。ゲーム中はSEと発話が上に乗るので、多少のつなぎ目は気にならない

## 3.6 ゲーム側の統合仕様(実装済みの契約)

- 配置: `public/audio/bgm/<指定名>.mp3`。**置くだけで鳴る。無ければ無音で動く**(ジングルはSE代用)
- 入力受付中は自動で音量45%へ220msフェード(ダッキング=「きみの番」の合図)
- 音量はアプリ内設定画面(localStorage)で調整。**iOSはマイク使用中に本体音量ボタンが効かない**ため必須
- 再生開始は必ずユーザージェスチャー起点。解錠プライミングは同期 `play(); pause();`
  (非同期でやるとレースで多重再生・無音が起きる。踏んだ)

---

# 4. 新プロジェクト立ち上げチェックリスト

```text
[ ] scripts/generate-assets.mjs / strip_magenta.py / .env.example をコピー
[ ] .gitignore に .env / assets/concepts / assets/rejected / logs を追加
[ ] .env にAPIキー(git履歴混入ゼロを確認)
[ ] STYLE_LOCK を新ゲームの世界観に書き換え
[ ] Sfx.ts / AudioManager.ts / SettingsStore.ts(音量設定)をコピー
[ ] BGM曲リスト(§3.2の表)を作曲担当に渡す
[ ] public/audio/bgm/README.md(曲リスト+プロンプト+配置手順)を置く
[ ] assetUrl ヘルパー+Vite base 対応(GitHub Pages前提なら最初から)
[ ] 方向性確認バッチ生成 → final昇格 → 量産、の順を守る
```
