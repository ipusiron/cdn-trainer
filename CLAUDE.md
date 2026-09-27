# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CDN Trainer is an educational web tool for learning about CDN, WAF, and origin server security configurations. It's a simple static web application that runs entirely in the browser with no backend or build process required.

## Architecture

This is a vanilla JavaScript application with six runtime files:

- `index.html` - Configuration and scenario controls, diagram, diagnosis, table, help, meta CSP
- `cdn-messages.js` - DOM-independent Japanese and English message dictionaries and interpolation
- `i18n.js` - Language selection, storage and `data-i18n` application. Holds no dictionary
- `cdn-model.js` - DOM-independent evaluation, paths and coordinates
- `script.js` - DOM rendering, one animation loop, diagnosis, table, help and theme controls
- `style.css` - Responsive styling, diagram classes and light/dark color variables

The application compares four attack scenarios across eight configurations. It reports
blocked attacks out of four, legitimate-user reachability and one of five security levels.
`assets/` contains three README screenshots; `test/` contains eight test files.
`README.md` is Japanese and `README.en.md` is English; the two cross-link at the top.

## Development Commands

There is no build step or external dependency. Node.js 22 or later runs the tests;
no npm install is needed. To develop:

```bash
# Run locally with any static server
python -m http.server 8000

# Run all tests using Node's built-in runner
npm test
```

## Key Implementation Details

### Shared evaluation model

- Domain traffic follows CDN (if enabled), origin-side IP restriction, WAF, then Origin.
- Direct traffic bypasses CDN. With CDN disabled, domain and direct traffic share a path.
- WAF is fixed immediately before Origin, after the IP gate.
- IP restriction allows only CDN source addresses. Without CDN, it also blocks legitimate users.
- CDN absorbs flood traffic, but does not inspect application attacks in this simplified model.
- WAF blocks application attacks, but does not absorb flood traffic in this model.
- A configuration is `misconfig` if legitimate users cannot reach Origin, regardless of the score.
  Otherwise, 4 blocked attacks means `best`, 3 means `high`, 1 or 2 means `low`, and 0 means `worst`.

Diagram, diagnosis and table must derive their results from `CdnModel.evaluate`; do not
handwrite results in HTML. Use `CdnModel.pathPoints` for SVG coordinates. The README's
eight-row result table is checked cell by cell against the model and dictionary.

### Rendering, motion and security

- Build SVG with `createElementNS` and other UI with DOM APIs and `textContent`.
- Store the requestAnimationFrame ID and cancel it before replaying; keep only one loop.
- Traverse the path at constant speed in 1600ms, or show the endpoint immediately for reduced motion.
- The dark-mode toggle changes CSS only and does not rebuild or restart the diagram.
- Save only the `darkMode` boolean string and the language choice in localStorage; catch read and write
  failures. The language key lives in `i18n.js` so that `script.js` keeps its two theme accesses.
- Keep the strict meta CSP. Do not use style attributes, inline handlers, inline scripts or innerHTML.
- Load classic scripts in message, language, model, UI order. ES modules would break direct file:// usage.
- Keep the model and message dictionary compatible with CommonJS through conditional module.exports.
- Add no external API, CDN, font, framework or npm dependency.

### Tests

- `test/model.test.js` - Eight configurations, four scenarios, paths, 12 coordinate fixtures and properties
- `test/messages.test.js` - Dictionary keys, interpolation and no Japanese literals in model/UI code
- `test/i18n.test.js` - Matching ja/en dictionaries, key coverage, language selection and in-place switching
- `test/html.test.js` - CSP, referrer, ARIA, IDs, scenarios and absence of inline code
- `test/script.test.js` - Safe DOM rendering, animation cancellation and storage exception handling
- `test/contrast.test.js` - All 16 foreground/background pairs in both themes, at least 4.5:1
- `test/format.test.js` - Readable line lengths and line counts; no minification
- `test/readme.test.js` - Result table, YAML metadata structure, full file tree and image references

GitHub Actions runs `npm test` on both push and pull_request using Node.js 22.
Do not weaken fixtures to make tests pass. Retest HTTP and file:// behavior after UI changes.

## UI Components

- Checkboxes with tooltip containers for CDN/WAF/IP restriction options
- Four radio scenarios and an SVG diagram with fixed nodes and direct-attack bypass routes
- Live diagnosis and a color-coded table including `level-misconfig` and the current-row marker
- Button-based table toggle, with a keyboard-scrollable table region
- Help dialog with focus entry/return, Tab wrapping, Escape and backdrop dismissal
- Responsive layout with 44px controls and hover/focus tooltips constrained to the viewport

## Language

The interface is available in Japanese and English. Keep every piece of generated text and emoji in
`cdn-messages.js`, with the same key in both the `ja` and the `en` dictionary. Use
`CdnMessages.t(key, params)` in the UI; unknown keys throw. Do not add Japanese literals to
`script.js` or `cdn-model.js` (comments excepted).

- Fixed text is marked `data-i18n="key"` in the HTML; attributes use `data-i18n-aria-label`,
  `data-i18n-title`, `data-i18n-placeholder` or `data-i18n-alt`.
- `CdnI18n.translate()` replaces `textContent`, so never put `data-i18n` on an element that owns
  child elements. Wrap the inner text in a `<span>` instead.
- Text or attributes that follow interactive state (the pattern-table label, the dark-mode
  `aria-label`) must stay out of `data-i18n` and be rebuilt in `renderGenerated()`, which runs on the
  `language-change` event. Applying `data-i18n` to them would roll the state back.
- Lists generated into the initially hidden help dialog and the collapsed assumptions are rebuilt by
  `renderStaticLists()` on every language change; nothing depends on the HTML fallback text.
- `<noscript>` cannot be translated at runtime, so it carries both languages.
- The language comes from `?lang=ja|en`, then localStorage, then `navigator.language`.

The project is part of the "100 Security Tools with Generative AI" series (Day 026).

## Staged Development

- Stage 0: Inspect and back up the original repository, create the work branch, untrack local settings.
- Stage 1: Add the model, dictionary, test runner and CI without changing the UI.
- Stage 2: Replace diagram playback and introduce the four scenarios.
- Stage 3: Generate diagnosis and the eight-configuration table from the model.
  Tooltip placement/width limits were moved here with explicit user approval for the mobile gate.
- Stage 4: Add CSP, keyboard access, help, responsive controls, color variables and static/contrast tests.
  The script.js Japanese-literal check was added here after the dictionary migration, as approved.
- Stage 5: Update README and this guide, add README tests and capture three real browser screenshots.

Each stage has its own tested commit. Publication requires HTTP/file gates, both push and PR
Test jobs, merge (not squash/rebase), main Test and Pages success, public-file hash verification,
then safe remote/local branch deletion. Do not push directly to main or bypass a failed gate.
