# Country Comparison Atlas

An interactive side-by-side comparison tool: pick any two countries,
territories, or subnational entities and compare them across 16
categories (geography, population, languages, culture, history,
government, economy, infrastructure, education, health, environment,
agriculture, transportation, technology, position on Earth, natural
hazards), plus a relative-scale calculator, a normalized radar chart,
a simplified age-structure comparison, and a synchronized dual history
timeline. No build step, no framework — plain HTML/CSS/JS.

## Scope & data honesty
The brief asked for "as many countries/territories as possible" across
100+ possible metrics. That's not achievable with genuinely verified
data in one pass — either you fabricate most of it, or you cover very
little. This site deliberately chose **breadth of category, depth of
curation, narrow entity count** instead:

- **25 hand-curated entities**, not the ~200 UN member states +
  territories the brief listed: Japan, South Korea, China, India,
  United States, Germany, Brazil, Russia, Australia, Canada, Iceland,
  Singapore, United Kingdom, France, Nigeria, Egypt, Indonesia,
  Switzerland, New Zealand, Taiwan, Hong Kong, Greenland, Puerto Rico,
  California, Hawaii — chosen for diversity and because they cover
  every explicit comparison example in the brief (Japan vs. South
  Korea, India vs. China, California vs. Germany, Greenland vs.
  Australia, Hawaii vs. Iceland, Taiwan vs. Singapore).
- **2-8 fields per category** (not the full 100+ item mega-list) — the
  most important, most reliably-known metrics per category. See
  `js/data/schema.js` for the exact field list and each field's
  definition/source/methodology text (shown in-app via the "what is
  this?" info popover on every stat row).
- Every entity's data lives in `js/data/countries.js`, structured to
  mirror `schema.js`'s category/field keys exactly.

## Data sourcing & verification
Forked a research agent (177s runtime, 28 tool calls) to web-search
and verify the 10 most scrutinized numbers (area, population, GDP
nominal, GDP PPP, capital, official language, currency, life
expectancy, median age, density) for all 25 entities against CIA
World Factbook / IMF / World Bank / UN sources **before** finalizing
the dataset — not trusted from memory alone. This caught real,
meaningful corrections that were applied:
- **Nigeria's GDP nominal was off by ~35%** (~$390B → ~$253B) — the
  2023-2024 naira devaluation crashed dollar-denominated GDP well
  below what pre-devaluation general knowledge would suggest.
- A **systematic pattern of 2024 nominal GDP figures running 5-10%
  low** across the US, UK, China, India, Switzerland, and others —
  corrected across the board.
- Egypt's population was corrected down (~112.7M → ~106.2M; the
  higher figure was closer to a 2026 projection than 2024 actual).
- Several fields the research explicitly flagged as genuinely
  uncertain (Nigeria/Greenland life expectancy, Hawaii/California
  population source discrepancies, Puerto Rico GDP PPP) were **kept
  at reasonable estimates but not treated as high-confidence** — see
  the info popover's "Confidence" field, which is lower for volatile
  metrics (GDP, unemployment) than for stable ones (area, capital,
  currency).
- Every number on this site should be read as **"approximately, as of
  the mid-2020s,"** not a precise, current, live figure. This is
  stated on the page itself (footer + scope note), not just here.

## Architecture
- `js/data/schema.js` — the 16 categories and their fields: label,
  unit, display format (`fmt`), definition, and source. Drives both
  the UI labels and the Data Explorer info popovers.
- `js/data/countries.js` — the 25-entity dataset, structured to
  mirror the schema's category/field keys 1:1.
- `js/data/history-timeline.js` — 3-5 well-known historical milestones
  per entity, for the synchronized dual-timeline view (History
  category only — separate from `schema.js`'s `founded`/`govSince`
  fields, which render as ordinary stat rows above the timeline).
- `js/format.js` — value formatters keyed to each field's `fmt` type
  (`int`, `money`, `list`, `point`, `agedist`, `pctlist`, etc.).
- `js/viz/radar.js` — 6-axis radar chart (population density,
  GDP/capita, life expectancy, urban %, internet %, forest %), each
  axis normalized to a **fixed reference ceiling** (not the min/max of
  the two entities being compared), so the shape stays meaningfully
  comparable across any pair and doesn't silently rescale.
- `js/viz/pyramid.js` — simplified 3-bracket (0-14/15-64/65+) mirrored
  bar chart. Explicitly not a true 5-year-band population pyramid —
  this dataset doesn't carry that granularity, and the UI says so.
- `js/app.js` — wires everything: search/select for both sides (plus a
  ☰ "browse all" option — clicking it or focusing an empty search box
  lists every entity grouped by kind: Countries / Territories & SARs /
  Subnational), category tab nav, data-driven stat-table rendering
  (with a proportional compare-bar on every numeric row), the
  relative-scale strip (area/population/GDP/density ratios, "A fits in
  B Nx"), the History category's dual timeline, info popovers, theme
  toggle.

## Design
"National Geographic / CIA World Factbook / Our World in Data / GIS"
aesthetic — deliberately distinct from this account's other two large
sites this session (`tarot`'s Bauhaus look, `world-calendar-explorer`'s
antique-observatory look). Warm atlas-paper light theme / deep
ocean-teal dark theme, with the two comparison sides color-coded
throughout (Side A = teal, Side B = terracotta) — every stat row,
compare bar, radar polygon, and timeline column uses this same
two-color language consistently. `Archivo` (display/headings),
`Source Sans 3` (body), `Space Mono` (data/figures), all Google Fonts.

## Time-series (Growth Over Time)
Added 2026-09-19, the first thing built after the initial ship: a line
chart (`js/viz/growth.js`, rendered in the Special Comparisons section)
covering the "Timeline Comparison: population growth, GDP growth"
feature from the original brief, which the first pass had left out
entirely.

- `js/data/timeseries.js` — population at 1960/1970/1980/1990/2000/
  2010/2020 (7 points) and GDP nominal current-USD at 1990/2000/2010/
  2020 (4 points), for all 25 entities. Sourced via a research pass
  that pulled directly from the World Bank Open Data API
  (`SP.POP.TOTL` / `NY.GDP.MKTP.CD`) for the 22 entities the World
  Bank tracks, plus targeted web research for Taiwan, California, and
  Hawaii (not World Bank members/series). Full sourcing notes,
  including real definitional caveats the research surfaced rather
  than smoothed over (Germany's series being consistently
  reunified-territory-equivalent throughout vs. Russia's RSFSR→Russian
  Federation continuity, California/Hawaii's Census-count vs.
  World-Bank-midyear-estimate offset, a BEA SIC→NAICS methodology
  break at 1997 affecting the two states' GDP), live as comments at
  the top of `timeseries.js` and in progress.md.
- Chart defaults to an **indexed** view (each entity's first available
  year = 100) rather than absolute values — plotting Greenland's
  ~56,000 people on the same linear axis as India's 1.4 billion would
  make the smaller entity's whole trajectory invisible. An "Absolute"
  toggle is available for when the actual scale is what matters. Every
  point has a hover tooltip with the real value.
- Population and GDP are separate toggleable metrics, not shown at once.

## Deliberately not built this pass
- **Interactive map / true equal-area overlay tool** — the brief's Map
  Overlay Tool (drag-transparency country-shape overlay without
  Mercator distortion) needs real GIS boundary polygon data (GeoJSON)
  per entity; the Relative Scale card instead shows a simple
  proportional bar, clearly labeled as schematic, not a true map.
- **Human Timekeeping Map**-style world map for regional calendar/
  cultural adoption — not applicable here, but same category of cut
  as the sibling calendar project: real interactive maps need a real
  geo dataset, not fabricated.
- **Sankey diagrams, tree maps, network diagrams** — not built. The
  radar chart and pyramid were prioritized as the two highest-value,
  most tractable visualizations from the brief's list.
- **True 5-year-band population pyramids** — only the 3-bracket
  (0-14/15-64/65+) version is implemented; finer age bands weren't in
  the curated dataset.
- **Full ~200-entity coverage** — see "Scope & data honesty" above.
- **Internationalization** — English only.
- **Full WCAG accessibility audit** — reasonable semantic HTML and
  `aria-label`s used, but no formal audit pass.

## Conventions
- Never add a country/territory without also giving it a full
  `HistoryTimelines` entry and populating every `schema.js` field (or
  explicitly `null` where genuinely not applicable, e.g. GDP PPP for
  sub-national entities) — partial entities break the comparison UI's
  assumption that both sides have comparable data.
- If you correct a number, note why in progress.md the way the Nigeria
  GDP correction is documented — a bare number change with no context
  is how the next session re-introduces the same error.
- Cloudflare Web Analytics beacon added on every new site this session
  per explicit standing user instruction — see `[[cloudflare-analytics-setup]]`
  in the assistant's memory.

## Deploy
Public repo, GitHub Pages from `main` root — live at
https://followorbounce.github.io/country-atlas/. Shares the
`followorbounce.github.io` Cloudflare Web Analytics site (see
`[[cloudflare-analytics-setup]]` in the assistant's memory).
