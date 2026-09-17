# Power Grid current handover

## Current live readback, 18 September 2026

The GitHub Pages article returns HTTP 200. All ten live iframe src/width/height/
loading/style attributes match README, and all ten frame documents return 200
with bytes exactly matching the local assets. Receipt:
`docs/receipts/live-frame-readback-2026-09-18.json`.

GitHub confirms Chromium acceptance run 35168433667 succeeded; the tested README
and frame assets are unchanged. Its desktop/phone eager-control and scroll-to-chart
comparison remains applicable, so no identical browser gate was rerun. This does
not extend the result to WebKit, Firefox, physical devices or Web Vitals. GitHub
API confirms this is a public repository. No code or research content changed.

Updated 2026-09-17. This is a static DSC 80 research writeup, hosted by GitHub
Pages at https://arnavgoel03.github.io/Power-grid-analysis/.
`index.md` includes README.md through Jekyll and the Hydejack theme. There is no
application backend or database. Chart HTML uses Plotly 2.35.2; four frames contain
tables. Research conclusions and the archived Zenodo artifact are unchanged.

## Live lazy-frame release

All ten embedded documents are below the opening article content and now use
native iframe lazy loading. Their existing explicit heights reserve space.
Six 800px charts also have max-width:100% so their frames fit narrow content.
Browsers choose the lazy preload distance; this does not promise zero initial
chart requests. No runtime dependency, loader script, or new product copy added.

PR #1 merged as `1de25f28d035a838ad34ab86e5f6b1e9319d39ca`; GitHub Pages
build/deploy run 35168270610 succeeded. All ten live frame attributes match source.
Source parsing checks preserve all URLs/heights and local asset targets.

Live Chromium acceptance run 35168433667 passed at 1440x1000 and 393x852.
Five frame documents started initially on desktop, three on phone; an eager
control started all ten and correctly failed the deferral detector. Scrolling
rendered all six real Plotly charts and four tables in both contexts. Frame
heights and horizontal viewport bounds passed; six screenshots were inspected.
The existing duplicate article title and horizontally scrolling data tables are
visible in those screenshots and were not altered by this delivery change.
No Web Vitals score, byte saving, or cross-browser guarantee is inferred.

Evidence: https://github.com/ArnavGoel03/Power-grid-analysis/actions/runs/35168433667
The manual workflow preserves screenshots/results as a seven-day artifact; this
receipt retains the outcome after artifact expiry. This source repo does not contain the research notebook; no new
model-training or statistical validation is claimed.
