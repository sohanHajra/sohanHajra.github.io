# Sohan Hajra — Portfolio Website

Static portfolio for quantitative research, research engineering, quantitative development, and systematic trading.

## Structure

- `index.html` — one page, hash-routed sections: `#about`, `#research`, `#writing`, `#cv`, `#play`. Older anchors (`#work`, `#experience`, …) redirect to the matching section; `#kelly` opens the simulator.
- `research/` — project detail pages
- `resume.html` — web résumé (print-friendly)
- `assets/styles.css` — the design system (paper, ink, one oxblood accent; Source Serif 4 + IBM Plex Mono, self-hosted in `assets/fonts/`)
- `assets/nav.js` — section routing, back-button friendly
- `assets/hero.js` — the About object: one of five markets-meets-math figures per visit (Brownian paths → Gaussian, SVI volatility smile, Ornstein–Uhlenbeck, Lorenz regimes, order-book depth). Drag or arrow keys rotate; Space pauses.
- `assets/ambient.js` — faint contour field that bends around the cursor
- `assets/kelly.js` — Kelly-criterion bankroll simulator on Play

Vanilla JS, no build step, no dependencies. Motion respects `prefers-reduced-motion`.

## Content integrity

Project claims are grounded in the current résumé, public LinkedIn profile, and the public GitHub repositories. Synthetic figures (volatility surface, order book) are labeled illustrative.

## Deployment

GitHub Pages: https://sohanhajra.github.io/
