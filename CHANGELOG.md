# 変更履歴

書式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に、
版の付け方は [セマンティック バージョニング](https://semver.org/lang/ja/) に従います。

## [2.0.0] — 2026-07-28

**破壊的変更があります。** v1.x から上げる場合は下の移行手順を見てください。

v1 系では、クラスを消しても番号を上げていませんでした。`^1.4.0` で入れた人のページが
黙って壊れる状態だったので、今回から semver を守ります。

### 移行手順

削除したクラス。いずれも Dela Gothic One / Hachi Maru Pop に当てていたものです。

| v1.x | v2.0.0 |
| --- | --- |
| `sw-f-futo` | 外す。`sw-midashi` の既定書体が見出し向けになりました |
| `sw-f-poster` | 外す |
| `sw-f-rittai` | 外す。立体は `sw-midashi is-rittai` が担います |
| `sw-f-marumoji` | 外す。丸ゴが要るなら `sw-f-maru` |
| `sw-btn is-futo` | 外す |

削除した変数。上書きしていた場合は指定を消してください。

`--sw-futo` `--sw-poster` `--sw-rittai` `--sw-marumoji`

書体ファイルの分割。

| v1.x | v2.0.0 |
| --- | --- |
| `showa-retro-fonts.css`（Google Fonts の @import + 付属書体） | `showa-retro-fonts.css` は付属書体の `@font-face` のみ。Google Fonts は `showa-retro-webfonts.css` か `<link>` |
| `import 'showa-retro.css/fonts'` | 同じ。ただし Google Fonts は読みません |
| — | `import 'showa-retro.css/webfonts'` を追加 |

### 変更

- **極太系の書体を撤去。** ゴナU（1975・写研）の代用として Dela Gothic One を当てていましたが、
  字面が現代的すぎて代用になっていませんでした。昭和の立体文字は袋文字と影で作るものなので、
  書体ではなく `is-rittai` / `is-fukuro` が担います。
- **晩秋レトロミンを見出し専用に分離。** 収録が教育漢字＋αの1732字しかなく、本文に敷くと
  琺瑯・絣・珈琲・錆・罫 といった中心語彙が次の書体に落ちて混植になっていました。
  `--sw-mincho`（本文・字が欠けない）と `--sw-retromin`（見出し・看板）に分けています。
- **`--sw-mono` の先頭を Monaco に戻した。** M PLUS 1 Code を先頭に置くと、
  ネットワーク待ちの間コード欄が描画されませんでした。
- 表記を読みやすさ優先に統一（琺瑯→ホーロー、同梱→付属 ほか）。

### 追加

- **判子に古印体ふうのかすれ。** 古印体そのものは再配布できるフリーフォントが無いので、
  SVGマスクで輪郭のゆらぎと線のかすれを作って寄せています。`is-mincho` で明朝の判子に。
- **`src/` に分割。** 14ファイル。`01-base.css` だけ必須で、あとは使うものを足せます。
  全部入り 60KB（gzip 12.5KB）のうち、よく使う一式だけなら 23.8KB（gzip 6.0KB）、
  base と文字組だけなら 7.9KB（gzip 2.7KB）まで落ちます。
- **強制配色（Windows ハイコントラスト）対応。** 実物の意匠は作者の色を残し、
  UI部品はシステム配色に委ねて境界線を補います。
- **コントラスト比を全色実測して README に掲載。** `npm run contrast` で再生成されます。
- **ビルドと CI。** `npm run build` / `npm run check`。GitHub Actions で
  生成物・コントラスト表・ドキュメントの整合を見ます。

### 修正

- **`dist/showa-retro.min.css` が古いまま公開されていた。** 削除済みの `--sw-futo` 等が
  min 版にだけ残り、`exports["./min"]` を読む人に壊れた版が届いていました。
  同じ事故が v1.4.0 でも起きていたので、CI で塞ぎました。
- **npm 配布物に 15MB のフォント書庫が入っていた。** `files` に `fonts/` と書いていたため、
  `.gitignore` に入れても `npm pack` には含まれていました。`fonts/bansyu-retoromin/` に絞り、
  展開後 15.8MB → 539KB になりました。CI でも混入を落とします。
- **`box-sizing` を設定していなかった。** 部品はどれも太い枠と広い余白を持つので、
  content-box のままだと `width` を指定した時に枠と余白が外側に付いて親からはみ出します。
  見本帳の側が独自に `* { box-sizing: border-box }` を書いていたため見本帳だけ辻褄が合い、
  素の HTML に置いた人の所で崩れていました。`.sw` の内側に閉じて当てます。
- **README が実在しないクラスを載せていた。** 撤去済みの `sw-amiten`、未実装の
  `sw-chochin` `sw-ji-kikagaku`。逆に実装済みの13部品が載っていませんでした。
  `tools/check-docs.mjs` で機械的に検証するようにしました。
- 夜間モードで `--sw-daidai` `--sw-mizu` とその `-fuka` が二重定義されていたのを整理。
- Google Fonts の `@import` から、使わなくなった Dela Gothic One と Hachi Maru Pop を削除。

### 既知の問題

- `.sw-pop.is-karashi` のコントラスト比が 2.85 で、大きい文字でも足りません。
  芥子地に臙脂は実物の特売POPで頻出の配色なので、意匠を優先して残しています。
  README に上書き方法を書きました。
- 晩秋レトロミンを 286KB の OTF のまま配っています。woff2 化の可否を作者に照会中です。
- スクリーンリーダー向けの意味付けは一切していません。利用者側の HTML の責任です。

## [1.4.0] — 2026-07-28

- LICENSE を追加。付属の晩秋レトロミンは OFL ではなく独自条件である旨を訂正
- `dist` を esbuild で作り直し
- `package.json` に homepage / repository / bugs / author を追加

## [1.3.0]

- 実物のテンプレートを50点確認し、集中線・同心円・角丸パネルを追加
- 配色に橙と水色を追加

## [1.2.0]

- 見本帳を NES.css / system.css の型に作り直し

## [1.1.0]

- 初期の公開版

[2.0.0]: https://github.com/kanade0525/showa-retro-css/releases/tag/v2.0.0
[1.4.0]: https://github.com/kanade0525/showa-retro-css/releases/tag/v1.4.0
