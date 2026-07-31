#!/usr/bin/env node
/*
 * 見本帳を実際に描画して、CSS を読むだけでは分からないことを測る。
 *
 * `npm run check` は静的解析なので CI で回せますが、次の二つは
 * 描画しないと分かりません。実際、両方とも見落として指摘を受けました。
 *
 *   ① 合成ボールド
 *      晩秋レトロミンは weight 400 しか持たない。太字を要求すると
 *      ブラウザが太らせた偽の太字が出て、収録外で次の書体に落ちた字は
 *      本物の太字で出るので、一つの見出しの中で太さがばらつく。
 *      CSS から探すと、font-family を書かずに継承だけしている要素
 *      （<b> <strong> <th> .nedan など54箇所）を丸ごと取りこぼす。
 *
 *   ② 端末にしか無い書体への依存
 *      撮影した端末に しねきゃぷしょん が入っていたせいで、字幕の見本が
 *      本物の書体で写っていた。閲覧者の大半には角ゴで出る。
 *      「この Mac での見え方」を「公開ページの見え方」と取り違えていた。
 *
 *   node tools/audit.mjs
 *
 * Chrome が要るので CI では回しません。手元で、公開前に実行してください。
 * 場所は CHROME 環境変数で変えられます。
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...xs) => join(root, ...xs);

const CHROME =
  process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
  console.error(`✗ Chrome が見つかりません: ${CHROME}\n  CHROME=... で場所を指定してください`);
  process.exit(1);
}

// 同梱しているか、Google Fonts から読んでいる書体。ここに無いものが
// 実際に使われていたら、それは端末にしか無い書体
const html = readFileSync(p("index.html"), "utf8");
const linked = [...html.matchAll(/family=([A-Za-z0-9+]+)/g)].map((m) => m[1].replace(/\+/g, " "));
const SHIPPED = new Set(["晩秋レトロミン", "Bansyu-retoromin", "Bansyu-retoromin R", ...linked]);

const probe = `<script>
window.addEventListener('load', function () {
  var bold = {}, local = {};
  function label(el) {
    return el.tagName.toLowerCase() +
      (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '');
  }
  document.querySelectorAll('*').forEach(function (el) {
    var hasText = Array.prototype.some.call(el.childNodes, function (n) {
      return n.nodeType === 3 && n.textContent.trim().length > 0;
    });
    if (!hasText) return;
    var cs = getComputedStyle(el);
    var first = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    var w = parseInt(cs.fontWeight, 10);
    var syn = (cs.fontSynthesisWeight || cs.fontSynthesis || '').indexOf('none') >= 0;

    if (first.indexOf('晩秋レトロミン') === 0 && w > 400 && !syn) {
      bold[label(el)] = (bold[label(el)] || 0) + 1;
    }
    local[first] = (local[first] || 0) + 1;
  });
  document.title = 'AUDIT';
  var out = document.createElement('script');
  out.type = 'application/json';
  out.id = 'audit';
  out.textContent = JSON.stringify({ bold: bold, local: local });
  document.body.appendChild(out);
});
</script>`;

const page = p("_audit.html");
writeFileSync(page, html.replace("</head>", probe + "</head>"));

let dom = "";
try {
  dom = execFileSync(
    CHROME,
    ["--headless", "--disable-gpu", "--virtual-time-budget=10000",
     "--window-size=1280,900", "--dump-dom", `file://${page}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28 }
  );
} finally {
  rmSync(page, { force: true });
}

const m = /<script type="application\/json" id="audit">([\s\S]*?)<\/script>/.exec(dom);
if (!m) {
  console.error("✗ 描画結果を取得できませんでした");
  process.exit(1);
}
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
const { bold, local } = JSON.parse(decode(m[1]));

let bad = false;

/* ---- ① 合成ボールド ------------------------------------------------------ */

const boldEntries = Object.entries(bold).sort((a, b) => b[1] - a[1]);
const boldTotal = boldEntries.reduce((a, [, n]) => a + n, 0);
if (boldTotal) {
  bad = true;
  console.error(`✗ 合成ボールド ${boldEntries.length}種 / ${boldTotal}箇所`);
  console.error("  晩秋レトロミンは weight 400 しか持ちません。");
  console.error("  font-weight: 400 と font-synthesis: none を当ててください。");
  for (const [k, n] of boldEntries) console.error(`    ${k}  ${n}`);
} else {
  console.log("✓ 合成ボールドはありません");
}

/* ---- ② 端末にしか無い書体 ------------------------------------------------ */

const strays = Object.entries(local)
  .filter(([f]) => f && !SHIPPED.has(f) && !/^(monospace|sans-serif|serif|system-ui|-apple-system)$/.test(f))
  .filter(([f]) => !/^(Monaco|Menlo|Consolas|SFMono-Regular|Hiragino|Yu |Osaka)/.test(f))
  .sort((a, b) => b[1] - a[1]);

// これは不具合ではありません。各スタックの先頭に昭和書体の名前を置くのは
// 意図した設計です（手元にあれば拾う）。ただし撮影した絵を「公開時の
// 見え方」と取り違える原因になるので、必ず目に入るところに出します。
if (strays.length) {
  console.log(`\n⚠ この端末にだけ入っている書体が ${strays.length}件 使われています`);
  console.log("  設計どおりですが、閲覧者の大半には別の書体で出ます。");
  console.log("  撮影した絵を公開時の見え方と取り違えないでください。");
  for (const [f, n] of strays) console.log(`    ${f}  ${n}箇所`);
} else {
  console.log("✓ 端末にしか無い書体への依存はありません");
}

process.exit(bad ? 1 : 0);
