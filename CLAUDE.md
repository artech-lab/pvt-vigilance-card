# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: PVT-B Vigilance Card

Home Assistant dashboard card (Lovelace custom card) that runs the 3-minute brief Psychomotor Vigilance
Test (PVT-B) and keeps a persistent history of reaction times. It is distributed through HACS (category
`plugin`, shown as "Dashboard"; from Home Assistant 2026.11 HACS is built in as the Marketplace).

Answer the maintainer in the language they write in. Code, comments, commit messages and the English
README stay in English.

## Commands

```bash
npm run check        # syntax check of the card
npm test             # unit tests (node:test, no dependencies, Node 20+); CI runs them with TZ=UTC
node --test --test-name-pattern="store" tests/card.test.mjs   # a single unit test, by name
npm install && npx playwright install chromium   # once, for the two commands below
npm run test:e2e     # browser tests with a simulated Home Assistant (~45 s)
npm run screenshots  # regenerates images/preview.png and images/result-light-it.png with demo data
```

The unit tests reach the card's functions only through the `globalThis.__api` list built at the top of
`tests/card.test.mjs`: add a new top-level function there before testing it. `tests/e2e.mjs` is a plain
sequential script (one shared page, plain `assert`), not a test runner, so it cannot run one case alone.

ASCII check (also in CI): `grep -nP '[^\x00-\x7F]' dist/pvt-vigilance-card.js` must print nothing.

Slash commands: `/publish` (first publication on GitHub, release, HACS default store) and
`/release X.Y.Z` (later versions). Maintainer notes in Italian: `PUBLISHING.md`.

## Layout

| Path | Content |
| --- | --- |
| `dist/pvt-vigilance-card.js` | The whole card: one dependency-free file, no build step. HACS serves it as is |
| `tests/card.test.mjs` | Unit tests: the card runs in a `vm` sandbox, top-level functions are tested directly |
| `tests/e2e.mjs` | Playwright tests with stub `ha-card` / `ha-icon` / `ha-form` and a mocked `hass` |
| `scripts/screenshots.cjs` | Builds the README images from a deterministic demo history |
| `examples/` | `minimal.yaml`, `full.yaml`, `packages/pvt_vigilance.yaml` (YAML version of the helpers) |
| `README.md`, `README.it.md` | English and Italian documentation: keep them aligned |
| `hacs.json`, `.github/workflows/` | HACS metadata, validation (HACS action + tests) and release workflows |

## Architecture of the card file

In order: constants and defaults (`PVT_DEFAULTS`), dictionary `PVT_I18N` (`en`, `it`), formatting and
scoring helpers, history store, import from helpers, SVG chart, CSS, the card class `PvtVigilanceCard`,
one-click helpers, the editor `PvtVigilanceCardEditor`, registration (`customElements.define`,
`window.customCards`).

- **History**: stored per Home Assistant user with the WebSocket API `frontend/get_user_data` /
  `frontend/set_user_data`, key `pvt_vigilance_card`, value `{ v, migrated, imported, tests }`.
  Each test is `[t, mean, best, worst, score, lapses, falseStarts, weight, mode]`; at most
  `PVT_STORE_MAX` (5000) tests. Saving re-reads and merges, so other devices are not overwritten.
- **Test engine**: frame-aligned stimulus onset (double `requestAnimationFrame`), `event.timeStamp` for
  responses, warm-up trials, per-input offsets, abort on `visibilitychange`.
- **Helpers written after a test** (optional): values, then counter, then `input_datetime`, each awaited.
  Automations triggered by the date rely on this order: keep it.
- **One-click helpers** (`pvtCreateHelpers`): admin only. `input_number/create`, `input_datetime/create`,
  `counter/create` over WebSocket; template sensors through the Template config flow
  (`hass.callApi("POST", "config/config_entries/flow", ...)`, menu step `sensor`). Entity ids are read
  back from `config/entity_registry/list`. Existing or linked helpers are reused. Helper names are fixed
  English strings in `PVT_INPUT_HELPERS` / `PVT_TEMPLATE_HELPERS`, never translated, so entity ids are the
  same in every language and match the YAML package.
- **Statistics sensors**: `pvtTemplateState()` is the single source of truth for their templates; they
  return `none` outside the 90 s after a test so that each long-term statistics row is one test.
  `examples/packages/pvt_vigilance.yaml` must contain exactly the same templates (a unit test checks it).
- **Import** (`pvtImportEvents`): when the store is empty, rebuilds tests from the hourly long-term
  statistics of the `stat_*` sensors plus raw recorder history, discarding hour-boundary repeats and
  values restored after a restart.

## Rules

1. `dist/pvt-vigilance-card.js` is ASCII only. Write non-ASCII characters as `\uXXXX` escapes and run
   the ASCII check after every edit: some tools silently turn escapes into real characters.
2. Every user-visible string goes into `PVT_I18N`, in **both** `en` and `it`, with the same placeholders
   (`{name}`). Unit tests fail otherwise. Exception: helper names and units stay in English.
3. Plain JavaScript custom elements, no Lit, no imports, no bundler, no runtime dependencies.
4. Do not change the store key or the entry format without a migration that keeps existing data.
5. Never put personal data in the repository: no names, e-mails, locations, time zones, real
   measurements or details of a specific Home Assistant instance. Images use demo data only
   (`npm run screenshots`). Copyright holder: "The pvt-vigilance-card contributors".
6. Until `/publish` runs, the repository owner is the placeholder `GITHUB_USER`. Do not hardcode another
   owner; `/publish` replaces it everywhere except in `PUBLISHING.md`, `CLAUDE.md` and `.claude/`.
7. Version lives in three places: `PVT_VERSION` in the card, `version` in `package.json`, `CHANGELOG.md`.
   The release workflow fails if the tag `vX.Y.Z` does not match.
8. User-facing changes: update `CHANGELOG.md` (section `Unreleased`) and both READMEs; regenerate the
   images when the look of the card changes.
9. Prefer Home Assistant public APIs; when an internal one is used (user data, config flows), fail
   gracefully and keep the card usable.

## Trying it on a Home Assistant instance

Copy `dist/pvt-vigilance-card.js` to `/config/www/` and add the resource `/local/pvt-vigilance-card.js?v=N`
(type JavaScript module), bumping `N` to bypass caches; or add the GitHub repository to HACS as a custom
repository of type Dashboard. Remove other copies of the resource: the console warns about duplicates.
