#!/usr/bin/env node
/*
 * 色のコントラスト比を実測して README の表を書き換える。
 *
 * 色が主役のフレームワークなのに、8色×明暗の組み合わせを一度も測って
 * いませんでした。目で見て「読める」と思っていただけです。
 *
 *   node tools/contrast.mjs          README.md の表を書き換える
 *   node tools/contrast.mjs --check  書き換えず、最新かだけ見る（CI用）
 *
 * 測るのは二種類です。
 *   ① 刷り色 × 紙   … 明暗それぞれ。--sw-paper の上に刷った文字
 *   ② 物体色の地×字 … CSS の中で実際に対で指定されている組み合わせを拾う
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);
const CHECK = process.argv.includes("--check");

/* ---- 色の計算 ------------------------------------------------------------ */

const hex = (s) => {
  const m = /^#([0-9a-f]{6})$/i.exec(s.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// WCAG 2.x の相対輝度
const luminance = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/* ---- CSS から変数を読む -------------------------------------------------- */

const base = readFileSync(p("src", "01-base.css"), "utf8");

// marker から始まるブロックを全部拾って束ねる。
// 書体と色で :root { } が分かれているので、一つ目だけ見ると足りない。
const blocksFrom = (src, marker) => {
  const out = [];
  let from = 0;
  for (;;) {
    const i = src.indexOf(marker, from);
    if (i < 0) return out;
    const s = src.indexOf("{", i);
    let depth = 0;
    for (let j = s; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}" && --depth === 0) {
        out.push(src.slice(s + 1, j));
        from = j;
        break;
      }
    }
    if (from <= i) throw new Error(`${marker} の閉じ括弧が見つかりません`);
  }
};

const vars = (blocks) => {
  const out = {};
  for (const block of blocks) {
    for (const m of block.matchAll(/(--sw-[\w-]+)\s*:\s*([^;]+);/g)) {
      const c = hex(m[2]);
      if (c) out[m[1]] = c;
    }
  }
  return out;
};

const light = vars(blocksFrom(base, "\n:root {"));
const dark = { ...light, ...vars(blocksFrom(base, ':root[data-theme="dark"]')) };

for (const need of ["--sw-paper", "--sw-sumi", "--sw-enji"]) {
  if (!light[need] || !dark[need]) {
    console.error(`✗ ${need} を読み取れませんでした。01-base.css の :root の書き方を確認してください`);
    process.exit(1);
  }
}

/* ---- ① 刷り色 × 紙 ------------------------------------------------------- */

const SURI = [
  ["--sw-sumi", "墨"],
  ["--sw-enji", "臙脂"],
  ["--sw-karashi", "芥子"],
  ["--sw-tokiwa", "常磐"],
  ["--sw-kon", "紺"],
  ["--sw-asagi", "浅葱"],
  ["--sw-momo", "退紅"],
  ["--sw-daidai", "橙"],
  ["--sw-mizu", "水"],
];

const grade = (r) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA大のみ" : "不足");
const fmt = (r) => r.toFixed(2);

let t1 = "| 刷り色 | 変数 | 昼（紙の上） | 夜（宵闇の上） |\n| --- | --- | --- | --- |\n";
const warn = [];
for (const [v, name] of SURI) {
  const l = ratio(light[v], light["--sw-paper"]);
  const d = ratio(dark[v], dark["--sw-paper"]);
  t1 += `| ${name} | \`${v}\` | ${fmt(l)}　${grade(l)} | ${fmt(d)}　${grade(d)} |\n`;
  if (l < 4.5) warn.push(`${name}（昼 ${fmt(l)}）`);
  if (d < 4.5) warn.push(`${name}（夜 ${fmt(d)}）`);
}

/* ---- ② 物体色の地×字 ---------------------------------------------------- */

// CSS の中で background と color が対で指定されている箇所を拾う。
// 物体色は昼夜で変わらないので一度測れば足ります。
// 色の修飾子（.sw-kanban.is-kon など）は background だけ書き替えて、
// 文字色は基底（.sw-kanban）の指定をそのまま使うことが多い。
// 同じブロックに両方揃っている場合だけ見ていると、そういう組み合わせを
// 取りこぼして「測ってある」つもりで穴が空く。基底の色を覚えて補う。
const baseColor = new Map(); // セレクタ → 文字色の変数名
const pairs = new Map();

for (const f of readdirSync(p("src")).filter((x) => /^\d\d-.+\.css$/.test(x))) {
  const css = readFileSync(p("src", f), "utf8");
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().split("\n").pop().trim();
    const bg = /background(?:-color)?:\s*var\((--sw-o-[\w-]+)\)/.exec(m[2]);
    const fg = /(?:^|[;\s])color:\s*var\((--sw-o-[\w-]+)\)/.exec(m[2]);

    if (fg && light[fg[1]]) baseColor.set(sel, fg[1]);
    if (!bg || !light[bg[1]]) continue;

    // 同じブロックの色、無ければ順に基底へ遡る。
    //   .a.is-b:hover → .a.is-b → .a
    // :hover だけ background を書き替えて文字色は据え置く書き方が多いので、
    // 擬似クラスを落として辿れないと、状態付きの配色を丸ごと見落とします。
    let fgName = fg && light[fg[1]] ? fg[1] : null;
    if (!fgName) {
      const bare = sel.replace(/:{1,2}[\w-]+(\([^)]*\))?/g, "").trim();
      for (const cand of [bare, bare.replace(/(\.[\w-]+)(\.[\w-]+)+$/, "$1")]) {
        if (cand && cand !== sel && baseColor.has(cand)) {
          fgName = baseColor.get(cand);
          break;
        }
      }
    }
    if (!fgName) continue;

    const key = `${bg[1]}|${fgName}`;
    if (!pairs.has(key)) pairs.set(key, { bg: bg[1], fg: fgName, sel });
  }
}

const rows = [...pairs.values()]
  .map((x) => ({ ...x, r: ratio(light[x.bg], light[x.fg]) }))
  .sort((a, b) => a.r - b.r);

let t2 = "| 地 | 字 | 比 | 判定 | 使っている所 |\n| --- | --- | --- | --- | --- |\n";
for (const x of rows) {
  t2 += `| \`${x.bg}\` | \`${x.fg}\` | ${fmt(x.r)} | ${grade(x.r)} | \`${x.sel}\` |\n`;
}

/* ---- README を書き換える -------------------------------------------------- */

const section =
  "<!-- contrast:start 自動生成。npm run contrast で更新します -->\n" +
  "**刷り色を紙に載せたとき**\n\n" + t1 +
  "\n**物体色の地と字**（昼夜で変わらないので一度きり）\n\n" + t2 +
  "<!-- contrast:end -->";

const readme = readFileSync(p("README.md"), "utf8");
const re = /<!-- contrast:start[\s\S]*?<!-- contrast:end -->/;
if (!re.test(readme)) {
  console.error("✗ README.md に <!-- contrast:start --> … <!-- contrast:end --> がありません");
  process.exit(1);
}
const next = readme.replace(re, section);

if (CHECK) {
  if (next !== readme) {
    console.error("✗ README のコントラスト表が古いです。`npm run contrast` を実行してください。");
    process.exit(1);
  }
  console.log("✓ コントラスト表は最新です");
} else {
  writeFileSync(p("README.md"), next);
  console.log(`✓ README を更新しました（刷り色 ${SURI.length}件、物体色の対 ${rows.length}件）`);
  if (warn.length) console.log("  本文に使うには不足: " + warn.join("、"));
  const bad = rows.filter((x) => x.r < 4.5);
  if (bad.length) console.log("  物体色で4.5未満: " + bad.map((x) => `${x.sel}(${fmt(x.r)})`).join("、"));
}
