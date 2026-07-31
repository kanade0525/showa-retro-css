# showa-retro.css

**Live sample book → https://kanade0525.github.io/showa-retro-css/**

*[日本語版はこちら](./README.md) — the Japanese README is the canonical one and goes into more detail.*

![Enamel shop sign, coffee-shop menu, ticket book, CRT television, name seals and sale stars, all rendered in CSS](./docs/hero.png)

A CSS framework for building UI in the style of Japan's **Shōwa era** (specifically the 1950s–80s): porcelain-enamel street signs, coffee-shop menus, ticket books, CRT televisions, misregistered printing.

**No JavaScript. No images.** Everything is gradients and inline SVG data URIs. 65.6KB minified, **13.6KB gzipped**. Import only what you need and it drops to 8KB.

```html
<link rel="stylesheet" href="showa-retro.css">

<body class="sw">
  <button class="sw-btn is-enji">Press</button>
</body>
```

```sh
npm i showa-retro.css
```

## Why this exists, and what it is not

Retro CSS frameworks usually recreate something the developer grew up with — NES.css, 98.css, system.css. This one recreates something most people reading this did *not* grow up with, so a note on what is actually being modelled.

The Shōwa era ran 1926–1989. What people in Japan mean by "Shōwa retro" is roughly 1955–1985: the postwar boom. Concretely, the vocabulary here is:

| Class | What it is |
| --- | --- |
| `sw-kanban` | **Hōrō kanban** — porcelain-enamelled steel advertising signs nailed to the sides of buildings. Rusted, sun-bleached, still there in the countryside. |
| `sw-shinagaki` | The handwritten menu board of a *junkissa*, an old-style coffee shop |
| `sw-kippu` | A **kaisūken** — a book of tear-off transit tickets |
| `sw-tv` | A CRT television, with optional static and scanlines |
| `sw-hanzure` | **Han-zure** — plate misregistration in offset printing |
| `sw-inkan` | A **hanko**, the personal name seal used instead of a signature |
| `sw-noren` | The split fabric curtain hung in a shop doorway |
| `sw-denkou` | A scrolling LED display board |

## The one design idea worth stealing

Colours are split into **three layers**, and mixing them breaks dark mode:

| Layer | Tokens | Dark mode | Use |
| --- | --- | --- | --- |
| ① Paper and ink | `--sw-paper` `--sw-sumi` | Swapped | Page background and text |
| ② Print colours | `--sw-enji` `--sw-karashi` `--sw-tokiwa` `--sw-kon` `--sw-asagi` `--sw-momo` `--sw-daidai` `--sw-mizu` | Lightness adjusted | Ink printed on paper |
| ③ Object colours | `--sw-o-*` | **Never change** | The actual paint on real objects |

![The same markup in dark mode: paper and ink have swapped, but the sign, the side-sign and the sale stars keep their colour](./docs/hero-dark.png)

Those two images are the same HTML. Paper and text have inverted; the sign, side-sign and sale stars have not.

**An enamel sign does not change colour at night.** So object colours are fixed across themes, while paper and ink swap. If you take a background from a theme variable but hardcode the text colour, dark mode inverts the background out from under your text. Any component with a background carries its own text colour.

Dark mode does not invert. It replaces paper with dusk and print colours with neon-tube values.

## Contrast

Every colour is measured. The full table is in the [Japanese README](./README.md#色の三層) and regenerates with `npm run contrast`.

The short version: **only four print colours pass AA for body text in light mode** — sumi (12.10), enji (5.32), tokiwa (4.95), kon (8.55). Karashi, asagi, momo, daidai and mizu land between 2.08 and 2.97 and must be used for headings or as backgrounds. In dark mode all of them clear 6.7.

`sw-kasure`, `sw-taishoku` and `sw-monokuro` reduce contrast by definition. They are print-texture decoration. Do not put body text in them.

## Fonts, and an honest disclaimer

**The real Shōwa display typefaces are not available.** Gona U (1975), Naru (1973) and Ishii Mincho all belong to Sha-Ken. Morisawa began releasing revivals in 2024, but they are commercial and cannot ship under OFL. So most of what is bundled here is a **substitute**, and the README says so rather than pretending otherwise.

Only two references are direct rather than substitute: the *anchikku* comic-lettering style and the 16-dot display face.

Fonts are optional and split three ways:

```html
<!-- Fast: substitutes from Google Fonts, loaded in parallel -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Old+Mincho&display=swap">

<!-- Bundled Bansyū Retromin, for headings. Makes no external request -->
<link rel="stylesheet" href="showa-retro-fonts.css">
```

```css
/* Convenient but slow — @import serialises into a second round trip */
@import "showa-retro.css/webfonts";
```

Load none of them and the framework falls back to the OS Japanese fonts and still works.

Referencing Google Fonts directly sends your visitors' IP addresses to Google, which a German regional court has ruled on. All seven substitute faces are SIL OFL, so self-hosting is permitted — see the Japanese README for the steps.

## Import only what you need

`src/` is split into 14 files. **Only `01-base.css` is required.**

```css
@import "showa-retro.css/src/01-base.css";     /* required: colour, type, dark mode */
@import "showa-retro.css/src/02-moji.css";     /* headings and typesetting */
@import "showa-retro.css/src/04-kanban.css";   /* signboards */
```

| What you load | Minified | Gzipped |
| --- | --- | --- |
| Everything | 65.6KB | 13.6KB |
| Common set (base, type, signs, buttons, tables, layout, forced colours) | 27.2KB | 6.6KB |
| Base and typesetting only | 9.1KB | 3.0KB |

## Accessibility

Stated plainly, including what is not covered:

| | Status |
| --- | --- |
| Keyboard focus | 3px `:focus-visible` outline, switching to `Highlight` under forced colours |
| Motion | All animation stops under `prefers-reduced-motion: reduce` |
| Dark mode | OS preference and `data-theme`; replacement, not inversion |
| Forced colours | Supported — real-world artefacts keep their authored colour, UI parts defer to system colours |
| Contrast | Every colour measured and published. **Some combinations fail.** |
| Screen readers | **Nothing is done.** Semantics are the consuming HTML's responsibility |

`sw-kippu` will not be announced as a ticket. `sw-inkan` just reads out the character inside it. Add your own `aria-*` and correct elements where meaning matters.

## What is actually Shōwa-specific

Of roughly 91 components, about 30% are genuinely Shōwa-specific. The rest are "Japanese", "Japanese typesetting", or ordinary UI painted in a Shōwa palette. A framework needs buttons and tables, so this is unavoidable — but listing them without distinction would be dishonest, so the Japanese README breaks them into three groups.

During development, decorations that never existed (calling an evenly-spaced dot grid a "halftone", calling a flat sepia wash "fading") were mixed in. Those were removed rather than kept.

## Licence

CSS, HTML and configuration are **MIT**. See [LICENSE](./LICENSE).

**Fonts are not MIT.** Bansyū Retromin (Suzumibato Shorin) ships under its own terms — web embedding and redistribution permitted, `readme.txt` must stay attached, modified versions may not be redistributed. The seven substitute faces are SIL OFL 1.1 and are not bundled.

Note for redistributors: **"free for commercial use" and "may be redistributed as a webfont" are different permissions.** Many Japanese free fonts grant the first and not the second.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md). v2.0.0 contains breaking changes and a migration table.
