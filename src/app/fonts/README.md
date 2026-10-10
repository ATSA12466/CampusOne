# CampusOne bundled font pair

All assets are unmodified Fontsource variable WOFF2 subsets, served through `next/font/local`. Builds and browsers do not contact Google Fonts.

| File | Distribution | Weights | Bytes | Purpose |
| --- | --- | --- | ---: | --- |
| `fraunces-latin-variable.woff2` | `@fontsource-variable/fraunces@5.3.0`, `fraunces-latin-wght-normal.woff2` | 100–900 | 36,620 | Editorial display headings |
| `manrope-latin-variable.woff2` | `@fontsource-variable/manrope@5.3.0`, `manrope-latin-wght-normal.woff2` | 200–800 | 24,836 | Interface/body text |
| `manrope-latin-ext-variable.woff2` | Same package, `manrope-latin-ext-wght-normal.woff2` | 200–800 | 15,120 | On-demand currency/extended Latin glyphs, including `₵` |

Upstreams: https://github.com/undercasetype/Fraunces and https://github.com/sharanda/manrope. Full SIL Open Font License 1.1 notices: `Fraunces-OFL.txt` and `Manrope-OFL.txt`.

Two above-the-fold fonts are preloaded (60 KiB combined); extended Manrope is a separate fallback family with preload disabled. Disabling generated Arial fallbacks for Manrope ensures `GH₵` reaches the extended font instead of a system fallback. Fraunces uses a metric-adjusted Times fallback. Phase 1's temporary Inter asset has been retired; provenance remains in that phase's Git history.
