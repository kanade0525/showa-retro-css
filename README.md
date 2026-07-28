# 昭和レトロ.css

**見本帳 → https://kanade0525.github.io/showa-retro-css/**


昭和レトロ CSS フレームワーク。ホーロー看板・純喫茶のお品書き・回数券・ブラウン管・刷りの網点を、クラス一つで再現します。

**JavaScript も画像も使いません。** 読みに行くのは CSS だけです。圧縮版は 58KB。

## 導入

```html
<link rel="stylesheet" href="showa-retro-fonts.css">  <!-- 任意 -->
<link rel="stylesheet" href="showa-retro.css">

<body class="sw">
  <button class="sw-btn is-enji">押す</button>
</body>
```

```sh
npm i showa-retro.css
```

```js
import 'showa-retro.css';
import 'showa-retro.css/fonts';   // 任意
import 'showa-retro.css/min';     // 圧縮版 58KB
```

## 色の三層

色は三つの層に分かれています。**ここを混ぜると夜間モードで壊れます。**

| 層 | トークン | 昼夜 | 用途 |
| --- | --- | --- | --- |
| ① 紙と墨 | `--sw-paper` `--sw-sumi` ほか | 入れ替わる | ページの地と文字 |
| ② 刷り色 | `--sw-enji` `--sw-karashi` `--sw-tokiwa` `--sw-kon` `--sw-asagi` `--sw-momo` | 明度を調整 | 紙に刷る六色 |
| ③ 物体色 | `--sw-o-*` | **変えない** | ホーロー看板・提灯・レコード盤など実物の塗り |

ホーロー看板は夜になっても色が変わりません。だから物体色は昼夜で固定しています。逆に、地色をテーマ変数から取りながら文字色を直書きすると、夜に地色だけが反転して文字が読めなくなります。地色を持つ部品は文字色も対で持たせてください。

刷り色は一枚で多くて三色までを目安に。昭和の印刷は版が少ないので、色数を絞るほど"らしく"なります。


## 収録しているもの

| 分類 | 主なクラス |
| --- | --- |
| 書体 | `sw-f-mincho` `sw-f-gothic` `sw-f-jimaku` `sw-f-tegaki` `sw-f-anchikku` `sw-f-maru` `sw-f-dot` |
| 文字組 | `sw-midashi`（`is-kage` 影文字／`is-fukuro` 袋文字／`is-fuchi` 二重縁取り／`is-rittai` 押し出し）`sw-tate` `sw-tcy` `sw-choutai` `sw-heitai` `sw-marker` `sw-boten` `sw-teisei` |
| 印刷技法 | `sw-amiten` 網点　`sw-hanzure` 版ズレ　`sw-kasure` かすれ　`sw-taishoku` 退色　`sw-monokuro` 白黒 |
| 枠と看板 | `sw-waku`（`is-nijuu` `is-kage` `with-title`）`sw-kanban`（`is-sabi` さび）`sw-sodekanban` `sw-obi` |
| ボタン | `sw-btn` ＋ 6色　`sw-kenbai` 券売機　`sw-tsumami` つまみ |
| 記入欄 | `sw-input`（`is-genkou` 升目）`sw-select` `sw-textarea` `sw-check` `sw-radio` |
| 表 | `sw-table` `sw-shinagaki` 品書き　`sw-denpyo` 伝票　`sw-list is-maru` 丸数字 |
| 紙もの | `sw-inkan`（`is-mincho` 明朝／`is-kaku` 角印／`is-beta` べた）`sw-fusen` `sw-fukidashi` `sw-kippu` `sw-nifuda` `sw-senjafuda` `sw-noshi` `sw-pop` 特売　`sw-shojo` 賞状　`sw-genkou` 原稿用紙　`sw-stampcard` `sw-shashin` |
| 店先 | `sw-noren` `sw-chochin` `sw-match` マッチラベル　`sw-garasu` 型板ガラス　`sw-denshou` 電照看板 |
| 家電 | `sw-tv`（`is-sunaarashi` 砂嵐／`is-nagare` 走査線）`sw-jimaku` `sw-neon` `sw-denkou` 電光掲示板　`sw-patapata` `sw-keikoutou` `sw-record` `sw-cassette` `sw-dial` 黒電話 |
| 地紋 | `sw-ji-hanagara` 花柄　`sw-ji-kikagaku` `sw-ji-tile` `sw-ji-garasu` `sw-ji-sofa` `sw-ji-ichimatsu` `sw-ji-yagasuri` `sw-ji-koushi` `sw-ji-mizutama` `sw-ji-shima` `sw-ji-amiten` `sw-ji-hougan` |
| 飾り | `sw-shusen` 集中線　`sw-hana` 花　`sw-kirakira` キラキラ　`sw-arch` アーチ枠　`sw-panel` 角丸パネル　`sw-tanzaku` 短冊 |
| 動き | `sw-anim-chirachira` ネオン　`sw-anim-tenmetsu` 蛍光灯　`sw-anim-kaiten` レコード |

動きはすべて `prefers-reduced-motion: reduce` で停止します。

## 昼と夜

夜間モードは色を反転させません。紙を宵闇に、刷り色をネオン管の発色に置き換えます。ネオンの発光は夜だけ点きます。

OS の設定に従うほか、`<html data-theme="dark">` で明示的に指定できます。

## 書体

**先にお断りします。** 本物の昭和の見出し書体は写研の **ゴナU（1975）**・**ナール（1973）**・**石井明朝** で、いずれも写研の所有です。モリサワが2024年から復刻を始めましたが商用書体のため、OFLライセンスでは付属できません。したがって付属書体の多くは**代用**です。

| 役割 | 付属書体 | 昭和の何か |
| --- | --- | --- |
| `.sw-f-mincho` 明朝 | Zen Old Mincho | 石井明朝・本蘭明朝の方向（代用）**地の文はこれ** |
| `.sw-f-maru` 丸ゴ | Zen Maru Gothic | ナール（1973・写研）の代用 |
| `.sw-f-anchikku` アンチック | Shippori Antique | 漫画のセリフ書体（**昭和から続く様式**） |
| `.sw-f-dot` ドット | DotGothic16 | 16ドットの表示装置（**昭和末期を参照**） |
| `.sw-f-tegaki` 手書POP | Yusei Magic | 油性マジックの手書き（年代は特定しない） |
| `.sw-f-gothic` 角ゴ | Zen Kaku Gothic New | 現代の書体。ラベルとボタンに限る |
| `.sw-f-jimaku` 字幕 | 付属なし | しねきゃぷしょん等。手元にあれば使う |

昭和の本文組は明朝です。角ゴを地の文に敷くと現代の顔になるため、`.sw` の既定を明朝にしています。


### 晩秋レトロミン（付属）

すずみばと書林の[晩秋レトロミン ver.3.2](https://suzumi-bato.booth.pm/items/4674383) を付属しています。利用条件でWebサイトへの埋め込みが許諾されているためです（二次配布にあたるので `fonts/bansyu-retoromin/readme.txt` を添付したまま扱ってください）。

**ただし本文には使いません。収録は教育漢字＋αの1732字だけです。** 見本帳の本文に出る632字種のうち95字種（15%）が収録外で、次の書体に落ちて混植になります。落ちるのは 琺瑯・絣・珈琲・錆・罫・臙脂・芥子・浅葱・駄 といった、まさにこのフレームワークが扱う語の字です。作者も readme で「本文組というよりも、見出し向けのフォント」と明記しています。

そこで変数を二つに分けています。

| 変数 | 中身 | 使う場所 |
| --- | --- | --- |
| `--sw-mincho` | Zen Old Mincho ほか、字が欠けない明朝 | 地の文。`.sw` の既定 |
| `--sw-retromin` | 晩秋レトロミン →（無ければ `--sw-mincho`） | 見出し・看板・POP など字数の少ない箇所 |

`--sw-retromin` を当てているのは `.sw-midashi` `.sw-kanban`（題字のみ。本文は `--sw-mincho` に戻します）`.sw-sodekanban` `.sw-denshou` `.sw-pop .nedan` `.sw-noren .nuno` `.sw-match .yago` `.sw-neon` の8か所です。地の文にも使いたい場合は `--sw-mincho` の先頭に足してください。混植を承知のうえで、ということになります。

### 本物に寄せる

手元に昭和書体を入れて変数を上書きしてください。各スタックの先頭にその名前を並べてあります。

```css
:root {
  --sw-jimaku: "しねきゃぷしょん", sans-serif;
  --sw-tegaki: "たぬき油性マジック", sans-serif;
  --sw-gothic: "かんじゅくゴシック", sans-serif;
}
```

付属していないのは、**「商用利用可」と「webフォントとして再配布可」が別の許諾**で、多くのフリーフォントが後者を認めていないためです。差し替え先の一覧は `showa-retro-fonts.css` のコメントにあります。


## 実物のテンプレートから学んだこと

流通している昭和レトロのテンプレートを50点ほど確認して、思い込みが三つ崩れました。

1. **集中線が最頻出だった。** 中心から放射する線で紙を埋めるのが昭和の広告の定番なのに、一つも作っていませんでした。`sw-shusen` を追加。
2. **大柄は「同心円」だった。** 色違いの輪がびっしり並ぶ柄です。以前これを「架空」として撤去しましたが、方向は正しく実装が間違っていただけでした。`sw-ji-dosen` として作り直し。
3. **角丸を多用している。** 色地に白い角丸パネルを置く型が非常に多い。「昭和に角丸は無い」は私の思い込みでした。`sw-panel` を追加。

ほかに、花を地紋ではなく単体の飾りとして置く型（`sw-hana`）、キラキラ（`sw-kirakira`）、アーチ枠（`sw-arch`）、短冊（`sw-tanzaku`）、そして配色に**橙と水色**が足りていませんでした。

## 何が昭和固有か

91の部品のうち、昭和固有と言えるのは3割ほどです。残りは「和風」「日本語組版」「汎用UI」を昭和の見た目で塗ったものです。フレームワークとしてはボタンや表が必要なので当然そうなりますが、区別せずに並べるのは不誠実なので記しておきます。

| 分類 | 例 |
| --- | --- |
| 昭和固有 | ホーロー看板・袖看板・電照看板・マッチラベル・型板ガラス・モザイクタイル・花柄・券売機・回数券・特売POP・スタンプカード・複写伝票・お品書き・写真の日付焼き込み・ブラウン管・砂嵐・映画字幕・ネオン管・電光掲示板・パタパタ発車標・蛍光灯・レコード・カセット・黒電話・かすれ・版ズレ・退色・ドットの書体・写植の長体平体 |
| 和風（江戸〜現行） | 千社札・のし紙・市松・矢がすり・のれん |
| 年代を特定しない | 判子・原稿用紙・賞状・方眼・荷札・バッジ・吹き出し・ふせん・蛍光ペン・水玉・しま・格子・縦組み・傍点・ルビ・各種UI部品 |

作る過程で、実在しないデザイン（等間隔の点を「網点」と称する、一様なセピアを「退色」と称する等）や、再現が中途半端な部品（縦の骨がない提灯、指止めのない黒電話）を混ぜていました。前者は撤去し、後者は作り直しています。

## 見本帳

`index.html` をブラウザで開いてください。

NES.css と system.css に倣い、**1カラム・上部に目次・「見出し → 説明 → 実物 → コード」の固定順序**で並べています。

- **全61項すべてに、見本の直下でコード欄とコピーボタン**が付きます
- **早見表**は末尾に索引として置いています。絞り込み検索付きで、クラス名をクリックするとコピーします
- **作例**は部品を並べるのではなく、一枚に組んだものを3点

## ライセンス

CSS・HTML・設定ファイルは **MIT**。詳細は [LICENSE](./LICENSE)。

**書体は MIT ではありません。** それぞれ別のライセンスです。

| | ライセンス | 付属 |
|---|---|---|
| 晩秋レトロミン ver.3.2（すずみばと書林） | [独自条件](https://suzumi-bato.booth.pm/items/4674383)。Web埋め込みと二次配布が可。readme.txt の添付が必須、改変版の配布は不可 | `fonts/` に付属 |
| Zen Kaku Gothic New / Zen Old Mincho / Zen Maru Gothic / Yusei Magic / Shippori Antique / DotGothic16 / M PLUS 1 Code | SIL Open Font License 1.1 | 付属せず Google Fonts から読み込み |

再配布するときは各条件を確認してください。**「商用利用可」と「Webフォントとして再配布可」は別の許諾です。**

## 出典

デザインと書体は以下を参照しました。

- [昭和レトロ配色パターン集｜純喫茶・看板・家電の色使い](https://uto-room.com/color/pattern/showa-retro/)
- [昭和レトロデザインの教科書](https://webdesign-master.com/webdesign/retro-design-points/)
- [「昭和レトロ」に合うフォント｜デザインポケット](https://designpocket.jp/static/font/fontguide/002.html)
- [昭和レトロ＆モダンな日本語フリーフォント｜Workship MAGAZINE](https://goworkship.com/magazine/retro-free-font/)
- [レトロ広告の魅力と当時の制作方法｜ヒラメキ工房](https://hirameki.noge-printing.jp/retro-advertisement-charm/)
- [【カフェ内装】おしゃれなデザインガラス](https://www.order-glass.com/shop/column/design-glass/interior/for-cafe/)
