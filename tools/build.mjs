#!/usr/bin/env node
/*
 * showa-retro.css のビルド。
 *
 *   src/_banner.css + src/NN-*.css  →  showa-retro.css
 *                                   →  dist/showa-retro.min.css
 *
 * バージョンの出典は package.json だけです。ここから banner に流し込み、
 * index.html の表記が食い違っていればビルドを落とします。
 * 手書きのバージョン文字列が四箇所に散って dist が古びる事故を、
 * 二度起こしたことへの対策です。
 *
 *   node tools/build.mjs          生成物を書き出す
 *   node tools/build.mjs --check  書き出さず、現物と一致するかだけ見る（CI用）
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);
const CHECK = process.argv.includes("--check");

const pkg = JSON.parse(readFileSync(p("package.json"), "utf8"));
const VERSION = pkg.version;

/* ---- バージョンの整合を先に見る ---------------------------------------- */

const problems = [];
const indexHtml = readFileSync(p("index.html"), "utf8");
if (!indexHtml.includes(`昭和レトロ.css v${VERSION}`)) {
  const found = indexHtml.match(/昭和レトロ\.css v[\d.]+/)?.[0] ?? "（見当たらない）";
  problems.push(
    `index.html のバージョン表記が package.json と違います。\n` +
    `  package.json: v${VERSION}\n  index.html:   ${found}`
  );
}
if (problems.length) {
  console.error("✗ " + problems.join("\n✗ "));
  process.exit(1);
}

/* ---- 結合 ---------------------------------------------------------------- */

const parts = readdirSync(p("src"))
  .filter((f) => /^\d\d-.+\.css$/.test(f))
  .sort();

if (parts.length === 0) {
  console.error("✗ src/ に NN-*.css が一つもありません");
  process.exit(1);
}

const banner = readFileSync(p("src", "_banner.css"), "utf8").replaceAll("__VERSION__", VERSION);
const bundle =
  '@charset "UTF-8";\n' +
  banner +
  parts.map((f) => readFileSync(p("src", f), "utf8")).join("");

/* ---- 最小化 -------------------------------------------------------------- */

// esbuild は banner を @charset より前に置いてしまう（@charset は
// スタイルシートの先頭でなければ無効）。なので自分で差し込む。
const shortBanner =
  `/*! 昭和レトロ.css v${VERSION} | MIT License | ${pkg.homepage ?? ""}\n` +
  `    付属の fonts/ は MIT ではありません。各フォントのライセンスに従ってください。 */\n`;

const res = await build({
  stdin: { contents: bundle, loader: "css", resolveDir: root, sourcefile: "showa-retro.css" },
  minify: true,
  charset: "utf8",
  write: false,
});

let min = res.outputFiles[0].text;
const head = '@charset "UTF-8";';
if (!min.startsWith(head)) {
  console.error("✗ 最小化結果が @charset で始まっていません。差し込み位置を見直してください");
  process.exit(1);
}
min = head + "\n" + shortBanner + min.slice(head.length);

/* ---- 書き出し、または照合 ------------------------------------------------ */

const outputs = [
  ["showa-retro.css", bundle],
  ["dist/showa-retro.min.css", min],
];

const read = (f) => {
  try {
    return readFileSync(p(f), "utf8");
  } catch {
    return null;
  }
};

if (CHECK) {
  const stale = outputs.filter(([f, want]) => read(f) !== want).map(([f]) => f);
  if (stale.length) {
    console.error(
      "✗ 生成物が src/ と食い違っています: " + stale.join(", ") + "\n" +
      "  `npm run build` を実行して結果をコミットしてください。"
    );
    process.exit(1);
  }
  console.log(`✓ 生成物は最新です（v${VERSION}、src/ ${parts.length}ファイル）`);
} else {
  mkdirSync(p("dist"), { recursive: true });
  for (const [f, contents] of outputs) writeFileSync(p(f), contents);
  const kb = (s) => (Buffer.byteLength(s, "utf8") / 1024).toFixed(1);
  console.log(
    `✓ v${VERSION} をビルドしました\n` +
    `  showa-retro.css           ${kb(bundle)}KB（src/ ${parts.length}ファイルを結合）\n` +
    `  dist/showa-retro.min.css  ${kb(min)}KB`
  );
}
