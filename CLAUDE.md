# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CDN Trainer is an educational web tool for learning about CDN, WAF, and origin server security configurations. It's a simple static web application that runs entirely in the browser with no backend or build process required.

## Architecture

This is a vanilla JavaScript application with five runtime files:

- `index.html` - Configuration and scenario controls, diagram, diagnosis, table, help, meta CSP
- `cdn-messages.js` - DOM-independent Japanese message dictionary and interpolation
- `cdn-model.js` - DOM-independent evaluation, paths and coordinates
- `script.js` - DOM rendering, one animation loop, diagnosis, table, help and theme controls
- `style.css` - Responsive styling, diagram classes and light/dark color variables

The application compares four attack scenarios across eight configurations. It reports
blocked attacks out of four, legitimate-user reachability and one of five security levels.
`assets/` contains three README screenshots; `test/` contains seven test files.

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
- Save only the `darkMode` boolean string in localStorage; catch read and write failures.
- Keep the strict meta CSP. Do not use style attributes, inline handlers, inline scripts or innerHTML.
- Load classic scripts in message, model, UI order. ES modules would break direct file:// usage.
- Keep the model and message dictionary compatible with CommonJS through conditional module.exports.
- Add no external API, CDN, font, framework or npm dependency.

### Tests

- `test/model.test.js` - Eight configurations, four scenarios, paths, 12 coordinate fixtures and properties
- `test/messages.test.js` - Dictionary keys, interpolation and no Japanese literals in model/UI code
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

Documentation and UI text are in Japanese. Keep generated Japanese text and emoji in
`cdn-messages.js`, under the `ja` dictionary. Use `CdnMessages.t(key, params)` in the UI;
unknown keys throw. Do not add Japanese literals to `script.js` or `cdn-model.js` (comments excepted).
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
