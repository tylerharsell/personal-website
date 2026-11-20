# tylerharsell.com

Personal site. Plain HTML and CSS with no build step; `lattice.js` draws the interactive 3D lattice in the hero (static SVG fallback without JavaScript), deployed on Vercel as static files.

- `index.html`: the whole site. The hero lattice is an inline SVG.
- `styles.css`: palette, type scale, layout.
- `assets/`: résumé PDF and favicon.

To preview locally: `python3 -m http.server` and open http://localhost:8000.
