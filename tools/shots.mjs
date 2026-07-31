#!/usr/bin/env node
/*
 * 見本帳の全節を撮って、一枚の一覧ページにまとめる。
 *
 * これが無かったせいで、意匠の不具合を見つける仕事がぜんぶ人の目に
 * 乗っていました。一節ずつ指摘 → 直す → 公開 → 次の指摘、を繰り返すと
 * 一日かかります。まとめて撮って、まとめて見て、まとめて直すための道具です。
 *
 *   npm run shots              昼夜ぶん撮って docs/review/index.html を作る
 *   npm run shots -- --light   昼だけ（速い）
 *   npm run shots -- --narrow  狭い画面も撮る
 *
 * Chrome の場所は CHROME 環境変数で変えられます。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);

const CHROME =
  process.env.CHROME ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
  console.error(`✗ Chrome が見つかりません: ${CHROME}\n  CHROME=... で場所を指定してください`);
  process.exit(1);
}

const LIGHT_ONLY = process.argv.includes("--light");
const NARROW = process.argv.includes("--narrow");

const OUT = p("docs/review");
const TMP = p(".shots-tmp");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

/* ---- 見本帳を節ごとに切り出す -------------------------------------------- */

const html = readFileSync(p("index.html"), "utf8");
const head = html.slice(0, html.indexOf("</head>") + 7);

const targets = [];

// 冒頭の店先
const hs = html.indexOf("<header");
const he = html.indexOf("</header>") + 9;
targets.push({ id: "header", title: "冒頭（店先）", body: html.slice(hs, he) });

// 各節
for (const m of html.matchAll(/<section[^>]*id="([\w-]+)"[^>]*>[\s\S]*?<\/section>/g)) {
  const id = m[1];
  const h2 = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(m[0]);
  const title = h2 ? h2[1].replace(/<[^>]+>/g, "").trim() : id;
  targets.push({ id, title, body: m[0] });
}

console.log(`${targets.length} 節を撮ります`);

/* ---- 撮る ---------------------------------------------------------------- */

const themes = LIGHT_ONLY ? ["light"] : ["light", "dark"];
const widths = NARROW ? [1280, 560] : [1280];
const shots = [];

for (const t of targets) {
  for (const theme of themes) {
    for (const w of widths) {
      const file = `${t.id}-${theme}-${w}.png`;
      const page = join(TMP, `${t.id}-${theme}.html`);
      // 一時ページは .shots-tmp/ に置くので、CSS の相対パスが解けなくなる。
      // <base> で見本帳と同じ基準にそろえる。
      const base = `<base href="file://${root}/">`;
      // 高さを測るための仕込み。title に入れて --dump-dom で受け取る
      const probe = `<script>window.addEventListener('load',function(){
        document.title='H'+Math.ceil(document.body.scrollHeight);});</script>`;
      writeFileSync(
        page,
        head
          .replace('<html lang="ja">', `<html lang="ja" data-theme="${theme}">`)
          .replace("<head>", `<head>${base}`)
          .replace("</head>", `${probe}</head>`) +
          `<body class="sw">${t.body}</body></html>`
      );

      // 実際の高さを測る。見積もりだと余白だらけになるか、切れる
      let h = 1400;
      try {
        const dom = execFileSync(
          CHROME,
          ["--headless", "--disable-gpu", "--virtual-time-budget=8000",
           `--window-size=${w},600`, "--dump-dom", `file://${page}`],
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 26 }
        );
        const m = /<title>H(\d+)<\/title>/.exec(dom);
        if (m) h = Math.min(12000, Math.max(300, Number(m[1]) + 24));
      } catch {
        /* 測れなければ既定の高さで撮る */
      }
      execFileSync(
        CHROME,
        ["--headless", "--disable-gpu", "--hide-scrollbars",
         `--window-size=${w},${h}`, `--screenshot=${join(OUT, file)}`,
         "--virtual-time-budget=9000", `file://${page}`],
        { stdio: "ignore" }
      );
      shots.push({ ...t, theme, w, file });
      process.stdout.write(".");
    }
  }
}
process.stdout.write("\n");

rmSync(TMP, { recursive: true, force: true });

/* ---- 一覧ページを書く ---------------------------------------------------- */

const byTarget = new Map();
for (const s of shots) {
  if (!byTarget.has(s.id)) byTarget.set(s.id, { title: s.title, items: [] });
  byTarget.get(s.id).items.push(s);
}

let n = 0;
const blocks = [...byTarget.entries()].map(([id, g]) => {
  const imgs = g.items
    .map((s) => `      <figure><img src="./${s.file}" alt="${g.title} ${s.theme} ${s.w}px" loading="lazy">
        <figcaption>${s.theme === "light" ? "昼" : "夜"} / ${s.w}px</figcaption></figure>`)
    .join("\n");
  return `  <section id="r-${id}">
    <h2><span class="no">${String(++n).padStart(2, "0")}</span> ${g.title} <code>#${id}</code></h2>
    <div class="row">
${imgs}
    </div>
  </section>`;
}).join("\n");

const nav = [...byTarget.entries()]
  .map(([id, g], i) => `<a href="#r-${id}">${String(i + 1).padStart(2, "0")} ${g.title}</a>`)
  .join("");

writeFileSync(
  join(OUT, "index.html"),
  `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>意匠の見直し用 一覧</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; font: 14px/1.7 system-ui, sans-serif; background: #14131a; color: #e8e2d4; }
  header { position: sticky; top: 0; background: #1d1c25; padding: .9rem 1.2rem; border-bottom: 1px solid #33313d; z-index: 5; }
  h1 { font-size: 1rem; margin: 0 0 .5rem; letter-spacing: .06em; }
  nav { display: flex; flex-wrap: wrap; gap: .3rem .8rem; font-size: .78rem; }
  nav a { color: #b9b0a0; text-decoration: none; }
  nav a:hover { color: #e0b653; }
  section { padding: 1.6rem 1.2rem; border-bottom: 1px solid #2a2833; scroll-margin-top: 5.5rem; }
  h2 { font-size: .95rem; margin: 0 0 .8rem; font-weight: 600; }
  h2 .no { color: #e0b653; font-variant-numeric: tabular-nums; margin-right: .4rem; }
  h2 code { color: #8d8578; font-size: .8rem; font-weight: 400; }
  .row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start; }
  figure { margin: 0; flex: 1 1 30rem; min-width: 0; }
  img { width: 100%; height: auto; display: block; border: 1px solid #33313d; background: #fff; }
  figcaption { font-size: .72rem; color: #8d8578; margin-top: .3rem; }
  p.how { color: #b9b0a0; font-size: .82rem; margin: .3rem 0 0; }
</style></head>
<body>
<header>
  <h1>意匠の見直し用 一覧 — ${shots.length}枚 / ${byTarget.size}節</h1>
  <p class="how">気になった所は「節番号 + 何が変か」だけ書いてもらえれば直します。まとめて渡してもらう方が速いです。</p>
  <p class="how" style="color:#e0b653">⚠ この絵は撮影した端末での見え方です。手元にだけ入っている書体があると、公開時と違う字で写ります。<code>npm run audit</code> で確かめてください。</p>
  <nav>${nav}</nav>
</header>
${blocks}
</body></html>
`
);

console.log(`✓ docs/review/index.html を書きました（${shots.length}枚 / ${byTarget.size}節）`);
console.log("  ブラウザで開いてください:");
console.log(`  open ${join(OUT, "index.html")}`);
