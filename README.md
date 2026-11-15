# Sohan Hajra — Portfolio Website

Static portfolio for quantitative research, research engineering, quantitative development, and systematic trading.

## Structure

- `index.html` — one page, hash-routed sections: `#about`, `#research`, `#writing`, `#cv`, `#workbench`. Older anchors (`#play`, `#work`, `#experience`, …) redirect to the matching section; `#kelly` opens the simulator.
- `research/` — project detail pages
- `resume.html` — redirect only: old résumé links land on the CV (`index.html#cv`); the full résumé is available on request
- `favicon.svg`, `assets/sigil.svg` — the sigil: a rhodonea (rose curve) r = cos(5θ/2) inside a circle, open at the hub
- `assets/styles.css` — the design system (paper, ink, one oxblood accent; Source Serif 4 + IBM Plex Mono, self-hosted in `assets/fonts/`)
- `assets/nav.js` — section routing, back-button friendly
- `assets/hero.js` — the About object: one of six wire figures per visit (Riemann zeta on the critical line, Enneper's minimal surface, a Dupin cyclide, Dini's surface, the SVI volatility smile, Lorenz regimes). Drag or arrow keys rotate; Space pauses; "Show another" or returning to About reshuffles.
- `assets/ambient.js` — faint contour field that bends around the cursor
- `assets/kelly.js` — Kelly-criterion bankroll simulator on Workbench

Vanilla JS, no build step, no dependencies. Motion respects `prefers-reduced-motion`.

## Content integrity

Project claims are grounded in Sohan's CV, public LinkedIn profile, and the public GitHub repositories. Synthetic figures (volatility surface, order book) are labeled illustrative.

## Deployment

GitHub Pages: https://sohanhajra.github.io/
