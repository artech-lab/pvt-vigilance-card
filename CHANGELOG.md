# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-11-08

First public release.

### Added

- 3-minute brief Psychomotor Vigilance Test (PVT-B) with the standard protocol: random wait of 1-4 s,
  lapse threshold 355 ms, false starts below 100 ms, warm-up trials.
- Score 0-100, mean, best and worst reaction time, lapses, false starts and a short verdict.
- Persistent history stored by Home Assistant through the frontend user-data API: no helpers needed,
  shared by all devices of the same user, not affected by the recorder purge (latest 5,000 tests).
- History charts in the style of the statistics graph: last 7 days and a configurable time-of-day
  profile (`band_start`, `band_end`, `band_size`) built from all tests.
- Frame-aligned stimulus onset, hardware event timestamps and per-input latency compensation
  (`offset_touch`, `offset_mouse`, `offset_keyboard`).
- Answers by touch, mouse or keyboard (Space or Enter); the test is discarded if the page is hidden.
- Optional helpers for automations and goal cards, written in a guaranteed order:
  values, then counter, then date and time.
- One-click creation of the helpers and statistics sensors from the visual editor (administrators only),
  with fixed English names; existing helpers are reused and linked to the card.
- Statistics sensors that keep a permanent copy of every result in the long-term statistics, and an
  automatic one-time rebuild of an empty history from them.
- English and Italian localization of the card and of the visual editor.
- Warning in the browser console when two copies of the card are loaded.
- Unit tests, browser end-to-end tests, HACS validation and release workflows.

[Unreleased]: https://github.com/artech-lab/pvt-vigilance-card/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/artech-lab/pvt-vigilance-card/releases/tag/v1.0.0
