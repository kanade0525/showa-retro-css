#!/usr/bin/env node
/*
 * ドキュメントに書いてあるクラスが実在するかを見る。
 *
 * 「消したクラスが README に残る」「作っていないクラスを表に書く」を
 * 何度も繰り返しているので、機械に見張らせます。
 * 実際にこれで sw-amiten（撤去済み）と sw-ji-kikagaku（未実装）が見つかりました。
 *
 *   node tools/check-docs.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);

/* ---- CSS に定義されているクラスを集める -------------------------------- */

// コメントは落とす。コメントに書いたクラス名を「実在する」と誤認して、
// 存在しないクラスの掲載を見逃していた（.sw-amiten が幽霊として残った）
const css = readdirSync(p("src"))
  .filter((f) => /^\d\d-.+\.css$/.test(f))
  .map((f) => readFileSync(p("src", f), "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, " ");

const defined = new Set();
for (const m of css.matchAll(/\.(sw[\w-]*)/g)) defined.add(m[1]);

// カスタムプロパティも同じ理由で見る
const definedVars = new Set();
for (const m of css.matchAll(/(--sw-[\w-]+)\s*:/g)) definedVars.add(m[1]);

/* ---- ドキュメントから拾う ------------------------------------------------ */

// バッククォート内、code要素内、class属性内だけを見る。
// 地の文の「sw-」を拾うと誤検知が出るため。
const sources = [
  ["README.md", readFileSync(p("README.md"), "utf8")],
  ["README.en.md", safeRead("README.en.md")],
  ["index.html", readFileSync(p("index.html"), "utf8")],
];

function safeRead(f) {
  try {
    return readFileSync(p(f), "utf8");
  } catch {
    return null;
  }
}

const problems = [];

for (const [name, text] of sources) {
  if (text === null) continue;

  const mentions = new Map(); // クラス名 → 行番号
  const varMentions = new Map();
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    const spans = [
      ...line.matchAll(/`([^`]+)`/g),
      ...line.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/g),
      ...line.matchAll(/class="([^"]+)"/g),
      ...line.matchAll(/&lt;[^&]*class="([^"]+)"/g),
    ].map((m) => m[1]);

    for (const span of spans) {
      for (const m of span.matchAll(/(?<![\w-])(sw-[\w-]+)/g)) {
        if (!mentions.has(m[1])) mentions.set(m[1], i + 1);
      }
      for (const m of span.matchAll(/(--sw-[\w-]+)/g)) {
        if (!varMentions.has(m[1])) varMentions.set(m[1], i + 1);
      }
    }
  });

  // 末尾がハイフンのものは `--sw-o-*` `sw-ji-` のような接頭辞の書き方。
  // その接頭辞で始まる定義が一つでもあれば良しとする。
  const ok = (name, set) =>
    name.endsWith("-")
      ? [...set].some((d) => d.startsWith(name) && d.length > name.length)
      : set.has(name);

  for (const [cls, line] of mentions) {
    if (!ok(cls, defined)) problems.push(`${name}:${line} 存在しないクラス \`${cls}\``);
  }
  for (const [v, line] of varMentions) {
    if (!ok(v, definedVars)) problems.push(`${name}:${line} 存在しない変数 \`${v}\``);
  }
}

/* ---- 逆向き。実装したのに README に出ていない部品 ------------------------ */

const readme = readFileSync(p("README.md"), "utf8");
const componentish = [...defined].filter(
  (c) => /^sw-(ji-)?[a-z]+$/.test(c) && !["sw", "sw-code"].includes(c)
);
const undocumented = componentish.filter((c) => !readme.includes(c)).sort();

/* ---- 報告 ---------------------------------------------------------------- */

if (problems.length) {
  console.error("✗ ドキュメントと実装が食い違っています\n");
  for (const x of problems) console.error("  " + x);
  if (undocumented.length) {
    console.error("\n  （参考）README に出ていない部品: " + undocumented.join(", "));
  }
  process.exit(1);
}

console.log(`✓ ドキュメントのクラス名・変数名はすべて実在します（クラス ${defined.size}、変数 ${definedVars.size}）`);
if (undocumented.length) {
  console.log("  README に出ていない部品: " + undocumented.join(", "));
}
