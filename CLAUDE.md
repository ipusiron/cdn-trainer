# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CDN Trainer is an educational web tool for learning about CDN, WAF, and origin server security configurations. It's a simple static web application that runs entirely in the browser with no backend or build process required.

## Architecture

This is a vanilla JavaScript application consisting of three main files:
- `index.html` - UI with configuration checkboxes, tooltips, help modal, pattern table
- `script.js` - Configuration evaluation logic and SVG diagram generation
- `style.css` - Responsive styling with dark mode support

The application generates animated SVG diagrams showing attack flow and provides security scores (0-3 points) based on CDN, WAF, and IP restriction settings.

## Development Commands

This project has no build system, package manager, or dependencies. To develop:

```bash
# Run locally with any static server
python3 -m http.server 8000
# or
npx serve .

# Deploy to GitHub Pages
# Push to main branch - served from https://ipusiron.github.io/cdn-trainer/
```

## Key Implementation Details

- **evaluateConfig()** in script.js:1 - Main function that evaluates security configuration, generates SVG diagram, and runs attack animation
- **Pattern table toggle** in script.js:126 - Shows/hides 8-pattern evaluation table
- **Help modal** in script.js:136 - Modal dialog with usage instructions and terminology
- **Dark mode** in script.js:156 - Persisted to localStorage, triggers SVG redraw when toggled
- Security scoring based on 3 criteria: CDN enabled, WAF enabled, IP restrictions enabled
- SVG animation uses requestAnimationFrame to animate attack icon, stopping at first defense layer
- No external dependencies - pure HTML/CSS/JavaScript

## UI Components

- Checkboxes with tooltip containers for CDN/WAF/IP restriction options
- Animated SVG diagram that redraws on dark mode toggle
- Pattern table with color-coded security levels (level-best, level-high, level-low, level-worst)
- Responsive layout with mobile-optimized touch handling for tooltips

## Language

Documentation and UI text are in Japanese. The project is part of a "100 Security Tools with Generative AI" series (Day 026).