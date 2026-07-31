#!/usr/bin/env node
/*
 * README の紹介画像が、CSS より古くないかを見る。
 *
 * dist・コントラスト表・ドキュメントには陳腐化の検査を付けたのに、
 * 画像には付けていませんでした。その結果 README の看板画像が v2.0.0 のまま
 * 10コミット分の意匠変更に取り残され、**もう存在しない製品を写していました。**
 * 指摘されるまで気づきませんでした。
 *
 *   node tools/check-images.mjs
 *
 * 撮り直しは次のとおり（Chrome が要るので CI では回しません）:
 *
 *   CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
 *   "$CH" --headless --disable-gpu --hide-scrollbars --window-size=1180,560 \
 *     --screenshot=docs/hero.png --virtual-time-budget=9000 \
 *     "file://$PWD/tools/hero.html"
 *
 * 夜は tools/hero.html の data-theme を dark にしたものを tools/ の中に置いて撮ります
 * （相対パスが ../ 基準なので、リポジトリ直下に置くと CSS が当たりません）。
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);

const IMAGES = ["docs/hero.png", "docs/hero-dark.png"];

// 見た目を決めるもの。これより画像が古ければ陳腐化
const SOURCES = [
  ...readdirSync(p("src")).filter((f) => f.endsWith(".css")).map((f) => join("src", f)),
  "tools/hero.html",
];

const mtime = (f) => (existsSync(p(f)) ? statSync(p(f)).mtimeMs : 0);

const newestSource = SOURCES.reduce(
  (a, f) => (mtime(f) > a.t ? { f, t: mtime(f) } : a),
  { f: null, t: 0 }
);

const stale = [];
for (const img of IMAGES) {
  if (!existsSync(p(img))) {
    stale.push(`${img} がありません`);
    continue;
  }
  if (mtime(img) < newestSource.t) {
    const days = Math.floor((newestSource.t - mtime(img)) / 86400000);
    stale.push(`${img} が ${newestSource.f} より古い（${days}日以上）`);
  }
}

if (stale.length) {
  console.error("✗ README の紹介画像が意匠より古いです");
  for (const s of stale) console.error("  " + s);
  console.error("  tools/check-images.mjs の先頭に撮り直しの手順があります。");
  process.exit(1);
}

console.log(`✓ 紹介画像は意匠より新しいです（${IMAGES.length}枚）`);
