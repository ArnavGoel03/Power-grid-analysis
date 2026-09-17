# Power Grid current handover

Updated 2026-09-17. This is a static DSC 80 research writeup, hosted by GitHub
Pages at https://arnavgoel03.github.io/Power-grid-analysis/.
`index.md` includes README.md through Jekyll and the Hydejack theme. There is no
application backend or database. Chart HTML uses Plotly 2.35.2; four frames contain
tables. Research conclusions and the archived Zenodo artifact are unchanged.

## Lazy-frame candidate

All ten embedded documents are below the opening article content and now use
native iframe lazy loading. Their existing explicit heights reserve space.
Six 800px charts also have max-width:100% so their frames fit narrow content.
Browsers choose the lazy preload distance; this does not promise zero initial
chart requests. No runtime dependency, loader script, or new product copy added.

Validation: source parsing checks ten preserved URLs/heights and local targets.
GitHub Pages deployment and live desktop/mobile browser acceptance are pending.
The manual browser workflow checks actual live frame activation and saves
screenshots. This source repo does not contain the research notebook; no new
model-training or statistical validation is claimed.
