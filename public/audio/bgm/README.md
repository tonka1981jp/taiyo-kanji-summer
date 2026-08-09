# BGM 配置場所

Suno で制作した音源をこのフォルダに**下記のファイル名そのまま**で置くと、ゲームが自動で再生します。
ファイルが無い間は無音(効果音のみ)で動作します。

## 用意する6曲

| ファイル名 | 用途 | 長さの目安 | ループ |
|---|---|---|---|
| `title.mp3` | タイトル画面 | 40〜90秒 | する(自動) |
| `world1.mp3` | 通常戦闘(WORLD1 草原) | 45〜90秒 | する(自動) |
| `world2.mp3` | 通常戦闘(WORLD2 森) | 45〜90秒 | する(自動) |
| `boss.mp3` | ボス戦(共通) | 45〜90秒 | する(自動) |
| `clear.mp3` | ステージクリアジングル | 2〜8秒 | しない |
| `treasure.mp3` | 宝箱/ごほうびジングル | 2〜8秒 | しない |

## Suno用プロンプト

全曲共通の必須条件: **インスト(歌なし・歌詞なし)**。歌声が入るとSTTが歌詞を拾って誤認識の原因になる。
スマホスピーカー前提で中域がはっきり・余韻短め。

### title.mp3
> RPGのタイトル曲。モダンチップチューン+温かいファンタジー楽器。冒険が始まるワクワク感、少し壮大、明るくキャッチーなメロディ。ループ前提。
>
> Bright adventurous RPG title theme for a kids' mobile game, modern chiptune blended with warm fantasy instruments, uplifting and slightly epic, catchy memorable melody, instrumental, no vocals, loop-friendly, 60 seconds.

### world1.mp3
> RPGの通常戦闘曲(草原)。8bitチップチューン寄り、軽快でポップ、明るい冒険感。何度聴いても疲れない。ループ前提。
>
> Cheerful RPG battle theme for a grassland world, light 8-bit chiptune style, playful and adventurous, bouncy rhythm, bright catchy melody, not intense, suitable for repeated listening, instrumental, no vocals, loop-friendly, 60 seconds.

### world2.mp3
> RPGの通常戦闘曲(森)。チップチューン+少し神秘的な雰囲気。テンポは中くらい、不思議だけど楽しい。怖くしない。ループ前提。
>
> RPG battle theme for a mysterious forest world, chiptune with a slightly magical mysterious mood, medium tempo, curious and playful, gentle bells or arps, not scary, instrumental, no vocals, loop-friendly, 60 seconds.

### boss.mp3
> RPGの戦闘曲(ボス戦)。8bitのチップチューン。緊張感とポップさの両立。テンポ速め、ヒロイックで盛り上がるが怖すぎない。ループ前提。
>
> Exciting RPG boss battle theme, 8-bit chiptune, a perfect balance of tension and pop catchiness, fast tempo, heroic and dramatic but kid-friendly and not scary, driving rhythm, memorable melody, instrumental, no vocals, loop-friendly, 60 seconds.

### clear.mp3
> ステージクリアのジングル。明るく達成感、キラキラ、短く終わる。
>
> Short victory jingle for a kids' RPG, bright and satisfying, sparkling, rewarding fanfare feel, chiptune flavor, instrumental, no vocals, 5 seconds.

### treasure.mp3
> 宝箱・ごほうびのジングル。上昇音型でキラキラ、うれしい。短い。
>
> Short reward jingle for opening a treasure chest, sparkling ascending notes, magical and happy, chiptune flavor, instrumental, no vocals, 4 seconds.

## 実装済みの挙動

- こどもが話す番(🎙 きいています)になると **BGMが約45%まで200msでスッと下がる**。
  この音の引きが「いま しゃべっていい」の合図を兼ねる。判定・攻撃演出で元に戻る
- ループはコード側で `loop=true`。**曲の頭と終わりが自然につながる**中間部を切り出しておくときれい(仕様 §10.3)
- クリア/宝箱はジングル1回再生。ファイルが無い間はコード生成SEで代用される
