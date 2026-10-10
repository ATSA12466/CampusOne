# Bundled baseline font

`inter-latin-variable.woff2` is the unmodified Latin, normal-style variable-weight Inter font from `@fontsource-variable/inter@5.3.0` (`files/inter-latin-wght-normal.woff2`).

- Upstream: https://github.com/rsms/inter
- Distribution: https://www.npmjs.com/package/@fontsource-variable/inter
- Copyright: The Inter Project Authors
- License: SIL Open Font License 1.1; see the complete `OFL.txt` alongside the font.
- Size: 48,256 bytes; weights 100–900.

The Phase 1 audit retains the existing Inter identity but uses `next/font/local` instead of a build-time Google Fonts request. This permits reproducible builds with restricted network access and does not add a runtime dependency. The display/text pairing will be chosen in Phase 2; bundled, licensed fonts should remain the preferred delivery mechanism.
