#!/usr/bin/env node
/*
 * 晩秋レトロミンの収録字を OTF の cmap から読み、
 * 見本帳の文章に収録外の字がどれだけ残っているかを数える。
 *
 * レトロミンは1732字しか持たないので、地の文に使うと収録外の字が
 * 次の書体に落ちて混植になります。フレームワークの用語（墨・枠・袖看板・
 * 傍点 など）は言い換えると読みにくくなるので残し、
 * 一般語彙だけ収録内の言葉で書くという方針です。その見張り。
 *
 *   node tools/check-glyphs.mjs         残っている収録外の字を出す
 *   node tools/check-glyphs.mjs --text "調べたい文字列"
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);

/* ---- OTF の cmap を読む -------------------------------------------------- */

const font = readFileSync(p("fonts/bansyu-retoromin/Bansyu-retoromin-R_ver.3.2.otf"));
const numTables = font.readUInt16BE(4);
let cmapOff = 0;
for (let i = 0; i < numTables; i++) {
  const o = 12 + i * 16;
  if (font.toString("latin1", o, o + 4) === "cmap") cmapOff = font.readUInt32BE(o + 8);
}
if (!cmapOff) {
  console.error("✗ cmap が見つかりません");
  process.exit(1);
}

let sub = 0;
const nSub = font.readUInt16BE(cmapOff + 2);
for (let i = 0; i < nSub; i++) {
  const o = cmapOff + 4 + i * 8;
  const pid = font.readUInt16BE(o);
  const eid = font.readUInt16BE(o + 2);
  if ((pid === 3 && eid === 10) || (pid === 3 && eid === 1)) sub = cmapOff + font.readUInt32BE(o + 4);
}

const covered = new Set();
const segX2 = font.readUInt16BE(sub + 6);
const seg = segX2 / 2;
const endO = sub + 14;
const startO = endO + segX2 + 2;
const deltaO = startO + segX2;
const rangeO = deltaO + segX2;
for (let i = 0; i < seg; i++) {
  const end = font.readUInt16BE(endO + i * 2);
  const start = font.readUInt16BE(startO + i * 2);
  const delta = font.readInt16BE(deltaO + i * 2);
  const ro = font.readUInt16BE(rangeO + i * 2);
  for (let c = start; c <= end && c !== 0xffff; c++) {
    let g;
    if (ro === 0) g = (c + delta) & 0xffff;
    else {
      const gp = rangeO + i * 2 + ro + (c - start) * 2;
      if (gp + 2 > font.length) continue;
      g = font.readUInt16BE(gp);
      if (g) g = (g + delta) & 0xffff;
    }
    if (g) covered.add(c);
  }
}

/* ---- 単発の文字列を調べる ------------------------------------------------ */

const ti = process.argv.indexOf("--text");
if (ti >= 0) {
  const text = process.argv[ti + 1] ?? "";
  const miss = [...new Set([...text])].filter((c) => c.trim() && !covered.has(c.codePointAt(0)));
  console.log(miss.length ? "収録外: " + miss.join(" ") : "✓ すべて収録内");
  process.exit(0);
}

/* ---- 見本帳の地の文を調べる ---------------------------------------------- */

// レトロミンで描かれない所は除く。
//   <pre> / <code> …… 等幅（Monaco / M PLUS 1 Code）
//   sw-btn / sw-label / sw-badge / sw-eyebrow / sw-fusen …… 角ゴ
//   sw-f-* の見本行 …… その書体そのもの
let html = readFileSync(p("index.html"), "utf8");
html = html
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<style[\s\S]*?<\/style>/g, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<pre[\s\S]*?<\/pre>/g, "")
  .replace(/<code[\s\S]*?<\/code>/g, "")
  .replace(/<[^>]*class="[^"]*(sw-btn|sw-label|sw-badge|sw-eyebrow|sw-fusen|sw-f-)[^"]*"[^>]*>[\s\S]*?<\/[a-z]+>/g, "");

// 属性のうち画面に出るものだけ拾う
const attrs = [...html.matchAll(/(?:placeholder|value)="([^"]*)"/g)].map((m) => m[1]).join("");
const text = html.replace(/<[^>]+>/g, " ") + attrs;

// フレームワークの用語として意図的に残している字。
// 色名（墨・橙・朱）とクラス名（枠・袖看板・傍点・地紋・原稿用紙・升目・
// 縁取り・袋文字・電光掲示板・記入欄）だけ。
// 「駄菓子」「既定」は用語ではなく単なる文言なので、ここには入れない。
const KEEP = new Set([..."墨橙朱枠袖傍蛍紋稿欄升縁袋掲"]);

// CSS の content: に入れた文字も画面に出る。HTML だけ見ていたので
// 飾り区切りの ❖ が収録外のまま素通りしていた
let cssText = "";
for (const f of readdirSync(p("src")).filter((x) => /^\d\d-.+\.css$/.test(x))) {
  for (const m of readFileSync(p("src", f), "utf8").matchAll(/content:\s*"([^"]*)"/g)) {
    cssText += m[1];
  }
}

const counts = new Map();
for (const ch of text + cssText) {
  if (!ch.trim() || covered.has(ch.codePointAt(0))) continue;
  if (KEEP.has(ch)) continue;
  counts.set(ch, (counts.get(ch) ?? 0) + 1);
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
if (total === 0) {
  console.log(`✓ 見本帳の地の文に、用語以外の収録外の字はありません（用語 ${KEEP.size}字は意図的に残しています）`);
  process.exit(0);
}

console.error(`✗ 収録外の字が ${counts.size}種 / ${total}回 残っています`);
for (const [ch, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.error(`  ${ch}  ${n}回`);
}
process.exit(1);
