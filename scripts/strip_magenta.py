#!/usr/bin/env python3
"""マゼンタ単色背景のクロマキー抜き。

gpt-image-2 は透過出力に非対応のため、#FF00FF 単色背景で生成し、
このスクリプトで実アルファに変換する(generate-assets.mjs から自動で呼ばれる)。

  python3 scripts/strip_magenta.py <file.png> [out.png]

- 強マゼンタ画素のみをキーイング(紫・ピンクのキャラ色は保護)
- 境界1〜2pxをフェザリングし、エッジのマゼンタ被りを除去(デスピル)
"""

import sys

import numpy as np
from PIL import Image, ImageFilter


def strip(path: str, out: str) -> None:
    img = Image.open(path).convert("RGBA")
    a = np.asarray(img).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]

    # 強いマゼンタのみ背景と判定(キャラの紫/ピンクを巻き込まない閾値)
    magenta = np.minimum(r, b) - g
    bg = (r > 190) & (b > 190) & (g < 100) & (magenta > 120)

    # 背景マスクをぼかしてエッジを1〜2pxフェザリング
    mask_img = Image.fromarray((bg * 255).astype(np.uint8), mode="L")
    mask_blur = np.asarray(
        mask_img.filter(ImageFilter.GaussianBlur(radius=1.2))
    ).astype(np.float32) / 255.0

    alpha = a[..., 3].astype(np.float32) / 255.0
    alpha = alpha * (1.0 - mask_blur)

    # デスピル: エッジ帯(半透明)でマゼンタ被りを抑える
    edge = (mask_blur > 0.02) & (mask_blur < 0.98) & (magenta > 40)
    r2 = np.where(edge, np.minimum(r, g + 40), r)
    b2 = np.where(edge, np.minimum(b, g + 40), b)

    out_arr = np.stack(
        [
            r2.clip(0, 255).astype(np.uint8),
            g.clip(0, 255).astype(np.uint8),
            b2.clip(0, 255).astype(np.uint8),
            (alpha * 255).clip(0, 255).astype(np.uint8),
        ],
        axis=-1,
    )
    Image.fromarray(out_arr, mode="RGBA").save(out)

    ratio = float((alpha < 0.04).mean() * 100)
    print(f"  transparent: {ratio:.1f}%")


if __name__ == "__main__":
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else src
    strip(src, dst)
