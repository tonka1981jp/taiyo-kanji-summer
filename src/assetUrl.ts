/**
 * public/ 配下アセットのURLを組み立てる。
 * GitHub Pages のサブパス配信(base=/taiyo-kanji-summer/)でも動くよう、
 * コード内では必ずこれを通す(先頭スラッシュなしで渡す)。
 */
export const assetUrl = (path: string): string =>
  import.meta.env.BASE_URL + path;
