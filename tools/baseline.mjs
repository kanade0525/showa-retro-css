#!/usr/bin/env node
/*
 * 描画の基準を取り、次からは「変わった所だけ」を見られるようにする。
 *
 * 意匠を一つ直すと、意図しない所まで動きます。実際、合成ボールドを止めたら
 * 見出しが全部細くなり、腕金を作り直したら看板の面に腕が乗りました。
 * 全部を毎回見直すのは現実的でないので、承認した描画を基準として持ち、
 * 次からは差分だけ見ます。
 *
 *   npm run shots -- --all      まず撮る
 *   node tools/baseline.mjs      いまの描画を基準として記録する
 *   node tools/baseline.mjs --check   基準と食い違う節を挙げる
 *
 * 画像そのものは置きません（72枚で20MB近くになる）。ハッシュだけを
 * docs/baseline.json に残します。Chrome の版が上がると全部差分として
 * 出るので、そのときは撮り直して基準を取り直してください。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);
const CHECK = process.argv.includes("--check");

const SHOTS = p("docs/review");
const FILE = p("docs/baseline.json");

if (!existsSync(SHOTS)) {
  console.error("✗ docs/review がありません。先に `npm run shots -- --all` を実行してください");
  process.exit(1);
}

const pngs = readdirSync(SHOTS).filter((f) => f.endsWith(".png")).sort();
if (!pngs.length) {
  console.error("✗ 撮影された画像がありません");
  process.exit(1);
}

const now = {};
for (const f of pngs) {
  now[f] = createHash("sha256").update(readFileSync(join(SHOTS, f))).digest("hex").slice(0, 16);
}

if (!CHECK) {
  writeFileSync(FILE, JSON.stringify({ chrome: process.env.CHROME_VERSION ?? "unknown", shots: now }, null, 2) + "\n");
  console.log(`✓ 基準を記録しました（${pngs.length}枚）→ docs/baseline.json`);
  process.exit(0);
}

if (!existsSync(FILE)) {
  console.error("✗ docs/baseline.json がありません。先に基準を取ってください");
  process.exit(1);
}

const base = JSON.parse(readFileSync(FILE, "utf8")).shots;
const changed = [], added = [], removed = [];
for (const f of pngs) {
  if (!(f in base)) added.push(f);
  else if (base[f] !== now[f]) changed.push(f);
}
for (const f of Object.keys(base)) if (!(f in now)) removed.push(f);

if (!changed.length && !added.length && !removed.length) {
  console.log(`✓ 描画は基準どおりです（${pngs.length}枚）`);
  process.exit(0);
}

console.log(`描画が基準と違います（変化 ${changed.length} / 新規 ${added.length} / 消失 ${removed.length}）`);
console.log("意図した変更なら `node tools/baseline.mjs` で基準を取り直してください。\n");
for (const f of changed) console.log("  変化 " + f);
for (const f of added) console.log("  新規 " + f);
for (const f of removed) console.log("  消失 " + f);
process.exit(1);
