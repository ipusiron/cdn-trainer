# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CDN Trainer is an educational web tool for learning about CDN, WAF, and origin server security configurations. It's a simple static web application that runs entirely in the browser with no backend or build process required.

## Architecture

This is a vanilla JavaScript application consisting of three main files:
- `index.html` - UI with configuration checkboxes
- `script.js` - Configuration evaluation logic and SVG diagram generation
- `style.css` - Responsive styling

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

- **evaluateConfig()** in script.js:79 - Main function that evaluates security configuration and generates SVG
- Security scoring based on 3 criteria: CDN enabled, WAF enabled, IP restrictions enabled
- SVG animation shows attack path with stopping points based on enabled defenses
- No external dependencies - pure HTML/CSS/JavaScript

## Language

Documentation and UI text are in Japanese. The project is part of a "100 Security Tools with Generative AI" series (Day 026).