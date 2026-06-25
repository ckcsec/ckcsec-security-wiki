# CKCsec Wiki Homepage Image and I18n Design

Date: 2026-06-24

## Goal

Improve `ckcsec/wiki-vitepress` so the project has a more fitting homepage visual identity and a clear path toward internationalization.

The first implementation should:

- Replace the current VitePress logo hero image with a CKCsec-specific visual asset.
- Update the README into a bilingual Chinese/English document with direct in-page switching.
- Add VitePress Chinese/English locale support so visitors can switch between `/` and `/en/`.
- Keep Chinese as the default site and add English structure without machine-translating every historical article.

## Homepage Visual Direction

Use the approved "docs + terminal split" direction.

The hero image should feel like a security researcher's bilingual documentation workspace:

- Left side: clean documentation surface with CKCsec Wiki, README/docs, and CN <-> EN language cues.
- Right side: dark terminal/code panel with concise lines such as `locale`, `zh-CN`, `en-US`, and `build ok`.
- Style: modern, technical, developer-friendly, and readable at VitePress hero-image size.
- Avoid: radar, scanning beams, target marks, crosshairs, weapon-like UI, noisy hacker stereotypes, and tiny unreadable text.

The image should be stored inside the repository under `docs/public/images/` and referenced with a root-relative VitePress path.

## README Design

Replace the current Chinese-only README with one Markdown file containing two sections:

- Top language switch links: `中文 | English`.
- Chinese section first, preserving the existing purpose, usage notice, open-source message, support information, public account callout, and acknowledgements.
- English section second, translating the same core information for international readers.

The README should be concise and easier to scan than the current version. Existing external image references can remain if they are still needed, but the new homepage hero image should also be mentioned where useful.

## VitePress I18n Design

Use VitePress built-in locale support.

Chinese default locale:

- Path: `/`
- Label: `简体中文`
- Existing Chinese navigation and sidebars remain the default experience.
- Homepage stays at `docs/index.md`.

English locale:

- Path: `/en/`
- Label: `English`
- Add `docs/en/index.md` as the English homepage.
- Add initial English entry pages for the main project/about workflow, enough for users to navigate without dead ends.
- Configure English nav, sidebar, footer, and theme labels.

The English content should start as curated entry pages and category summaries. Existing deep Chinese technical articles should not be bulk machine-translated in this first pass. The structure should make future translation work straightforward.

## Content Scope

Implement in the first pass:

- `docs/index.md`: update Chinese homepage hero text, actions, features, and image reference.
- `docs/en/index.md`: add English homepage.
- `docs/en/about/index.md`: add English project introduction.
- `docs/en/about/support.md`: add English support page.
- `docs/en/about/guide.md`: add English usage guide.
- `docs/.vitepress/config.mts`: add locale-aware config and language switch.
- `README.md`: bilingual Chinese/English sections.
- `docs/public/images/ckcsec-docs-terminal.*`: generated or designed homepage visual.

Do not reorganize the existing Chinese article tree during this pass.

## Testing

After implementation:

- Run dependency installation if needed.
- Run `npm run docs:build`.
- Start the VitePress dev server and inspect:
  - `/`
  - `/en/`
  - language switch between Chinese and English
  - hero image rendering
  - README Markdown formatting by local inspection

## Risks and Decisions

- VitePress locale configuration can become noisy if all sidebar entries are duplicated. Decision: duplicate only top-level English entry navigation in the first pass.
- The generated image may include imperfect small text. Decision: keep text minimal and large in the visual asset; rely on page copy for exact wording.
- Existing Chinese filenames include non-ASCII paths. Decision: leave them unchanged to avoid breaking current links.
