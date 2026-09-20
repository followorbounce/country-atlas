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
100+ possible metrics. **Entity count and data depth are two separate
axes, and only one of them is allowed to vary.** Earlier in this
project's history, the entity list itself was curated down to ~25-30
"hand-picked" countries, reasoning that verified data was only
realistic for a smaller set — the user corrected this firmly: a list
of which countries/territories exist is not something that needs
per-entry verification the way a GDP figure does, so it must be
complete. Depth of data, not the roster, is the axis that legitimately
varies. See `[[feedback-entity-list-vs-data-depth]]` in the assistant's
memory for the general rule this produced.

- **203 entities**: every UN member state (193) + the Holy See +
  9 additional territories/disputed regions researched earlier
  (Greenland, Puerto Rico, Taiwan, Hong Kong, Palestine, Kosovo,
  Faroe Islands, French Polynesia, New Caledonia). The original 30
  hand-curated entities (Japan, South Korea, China, India, United
  States, Germany, Brazil, Russia, Australia, Canada, Iceland,
  Singapore, United Kingdom, France, Nigeria, Egypt, Indonesia,
  Switzerland, New Zealand, and the 9 above) still have the fullest,
  most-verified profiles across all 16 categories.
- **California and Hawaii were removed 2026-09-19** (they were the
  `kind: "subnational"` pair, present so early demo comparisons like
  "Hawaii vs. Iceland" worked). Once the sibling
  [[us-states-atlas-site]] shipped as a dedicated US-states comparison
  tool, keeping 2 of 50 states mixed into a *country* atlas was
  confusing scope creep rather than useful coverage — the user flagged
  this directly. Removed from `countries.js`, `history-timeline.js`,
  and `timeseries.js`; `kind: "subnational"` is currently unused but
  left in the schema in case a genuinely complete subnational layer is
  ever added on purpose.
- **The other 175 entities** (`CountriesCore` in `js/data/countries.js`)
  started 2026-09-19 as bare stubs (id/name/flag/kind only, every
  category object empty `{}`), then got a first real-data pass the
  same day: 9 core fields — total area, population, GDP nominal,
  capital, official language(s), currency, government type, median
  age, and (where sourced) life expectancy — filled in from Wikipedia
  reference tables (population/UN, area, GDP/IMF, national capitals,
  official languages, circulating currencies, median age/CIA,
  government systems) fetched directly via WebFetch. The other 10
  categories (culture, history beyond what's in
  `history-timeline.js`, infrastructure, education, environment,
  agriculture, transportation, technology, position on Earth, natural
  hazards) are still empty `{}` for these 175 — a depth gap, not a
  roster gap, and the app is fully defensive about it (every render
  path uses optional chaining and shows "no data" rather than
  crashing or guessing).
- Life expectancy specifically could only be reliably sourced for
  ~96 of the 175 (WebFetch's extraction of the long Wikipedia table
  became unreliable past a certain point — a re-check caught it
  fabricating a suspiciously perfect linear staircase of values for
  the lower part of the ranking, which was discarded rather than used;
  see progress.md for the detail). The unfilled ones show "no data"
  rather than an invented number.
- **2026-09-20 — Geography category completed for all 175.** The user
  asked explicitly for a full audit-and-fill pass on Geography,
  correctly rejecting the idea that "insufficient data" justified
  leaving founding G7-sized countries (Kazakhstan, Argentina — both
  had a completely empty `geography: {}`) without even a total area.
  Added `landAreaKm2`, `coastlineKm`, `highestPoint`, `lowestPoint`,
  `climate`, and `terrain` for all 175, plus independently
  cross-checked every existing `totalAreaKm2` against a fresh source —
  0 discrepancies found (all 145 previously-filled values were
  already correct; the other 30, including Kazakhstan and Argentina,
  had simply never been filled in at all, which the cross-check caught
  by contrast rather than by finding a wrong number).
  - Area/coastline/elevation extremes: bulk-sourced from Wikipedia's
    "List of countries and dependencies by area," "List of countries
    by length of coastline," and "List of elevation extremes by
    country," each covering ~all countries in one table — far more
    efficient than 175 separate lookups, and the same
    approach used successfully in the earlier core-data pass.
  - Land area for the ~29 smallest states (Vatican City, Monaco,
    Nauru, Maldives, several Caribbean/Pacific microstates) wasn't in
    the bulk table; verified via a targeted check (Maldives: CIA
    Factbook confirms land = total, 0 water area) that land ≈ total
    is a real, not assumed, property of small islands without inland
    water bodies, then applied that as the fallback for the rest.
  - Climate/terrain has no single bulk source, so this was ~25
    targeted WebSearch calls (grouped ~6-8 countries per call) against
    Wikipedia/CIA-Factbook-style geography summaries, written as
    terse 1-line descriptions matching the original 30 entities'
    style. All 175 got both fields (only Vatican City needed a
    separate manual pass, added from general knowledge of its
    location within Rome).
  - Vatican City also got real fixes beyond geography while in there:
    `totalAreaKm2` corrected from a wrongly-rounded `0` to the real
    `0.49`, and `population.total` added (882, with a `fieldNotes`
    caveat — sources genuinely diverge 500-900 depending on whether
    non-resident staff are counted).
  - Caught and fixed a real splicing bug mid-pass: a first attempt at
    inserting `climate`/`terrain` used a regex (`geography: \{([^}]*)\}`)
    that stopped at the first `}` it found — which, once `highestPoint`/
    `lowestPoint` sub-objects existed, was the *inner* object's closing
    brace, not the outer `geography` object's. This nested
    `climate`/`terrain` incorrectly inside `highestPoint` for all 174
    entities touched. Caught immediately via a rendered-page spot
    check (Kazakhstan's Highest Point cell showed the climate text
    instead of just "Khan Tengri (7,010 m)"), fixed with a second
    corrective regex pass, then re-verified in a real browser before
    committing.
- **2026-09-20 — History.founded and Hazards completed for all 175.**
  `history.founded`: 175/175, sourced from Wikipedia's "List of
  national independence days" plus targeted lookups for the ~10
  old-monarchy countries missing from that table. `hazards`: 174/175
  (South Sudan is the one real gap), sourced from a mirror of the CIA
  World Factbook's "Natural hazards" field — the live Factbook site
  was itself discontinued in February 2026. `culture` (religions,
  ethnic groups, UNESCO sites, holidays) and `history.govSince` are
  still empty for all 175 — no clean bulk source exists for either, so
  this genuinely needs a future per-country research pass rather than
  the bulk-table approach that worked for area/population/GDP/hazards.
  Full detail, including a real cross-entity data-contamination bug
  caught and fixed during this pass, in progress.md.
- **A new `kind: "disputed"` category** (alongside `country`/
  `territory`/`subnational`) was added for Palestine and Kosovo — an
  ordinary `"country"` tag would gloss over their contested status,
  and `"territory"` (used for uncontested cases like Greenland or the
  Faroe Islands) implies a single clear administering sovereign, which
  neither has in the same way.
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
- `js/data/countries.js` — the 205-entity dataset (`Countries`, the
  original 30 full-depth entities, plus `CountriesCore`, the 175
  UN-member/Vatican entities with the 9-field core-data pass described
  above), structured to mirror the schema's category/field keys 1:1.
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

## Disputed/contested entities: neutrality approach
Palestine and Kosovo needed real editorial care, given the app's stated
goal of "not subjective judgments." Approach:
- Government-type and sovereignty-status fields use the same neutral,
  factual register CIA World Factbook / UN / Wikipedia infoboxes use —
  e.g. Kosovo's entry states plainly that it unilaterally declared
  independence in 2008, is recognized by roughly 100-118 of 193 UN
  member states (sources disagree on the exact count), is not a UN
  member itself, and that Serbia disputes its sovereignty — without
  taking a position on who's "right." Same approach for Palestine's
  Oslo Accords Area A/B/C structure, the Gaza/West Bank Hamas/PA split,
  and East Jerusalem's status.
- **A new `entity.fieldNotes` mechanism** (an optional `{ "category.field":
  "caveat text" }` map on an entity) was added specifically for cases
  where a single number would be actively misleading without context —
  the flagship case is Palestine's GDP, where the pre-war 2022 baseline
  (~$17.2B) is the only reasonably-sourced figure, but the 2023-24 war
  crashed West Bank GDP ~28% and Gaza's GDP ~81% in a single quarter.
  Rather than picking one number and hiding the caveat in the generic
  info popover, `renderStatRow()` in `app.js` now prints a visible
  red-flagged note (⚠) directly under the value in the stat table
  itself. Same mechanism used for Kosovo's population (sources diverge
  meaningfully, ~1.58M vs ~1.98M) and New Caledonia's GDP (2023 figure
  predates the May 2024 civil unrest).
- Several qualitative fields for these 5 (`urbanPct`, `growthRatePct`,
  `fertilityRate`, `ageDist` for Palestine/Kosovo especially) are
  reasonable estimates rather than research-verified figures — the
  research pass for these 5 entities prioritized the politically
  load-bearing fields (status, recognition count, GDP) over exhaustive
  verification of every demographic field, consistent with this
  project's standing practice of spending verification effort where
  it's most likely to matter.
- Historical population time series for these 5 are genuinely sparse
  (Palestine: 3 of 7 possible years; Kosovo: 1 of 7; the three French/
  Danish territories: 2 of 7 each) because the research explicitly
  flagged the other years as derived/unconfirmed rather than directly
  sourced — left out rather than interpolated. No historical GDP
  series at all for these 5 (only current-year GDP), since the research
  pass didn't produce verified historical GDP figures for them.

## Category-by-category depth pass for the 175 core entities
2026-09-20, following the entity-list correction above: the user asked
to audit every remaining category the same way Geography had been —
not just spot-fix a complaint, but systematically check for and fill
gaps with real sourcing. Done, in order: Geography, Population/
Languages/Government/Economy, Infrastructure/Education/Health/
Environment/Agriculture/Technology, History.founded/Hazards,
Transportation/Astronomy. See progress.md for the full sourcing detail
per pass (World Bank indicator API, IANA tzdata, Wikipedia bulk list
tables parsed directly with BeautifulSoup rather than model-summarized,
a real country-bounding-box GitHub dataset). **Still empty for all/most
of the 175**: `culture` (all 4 fields — no clean bulk source for
religion/ethnicity breakdowns), `history.govSince`, and a handful of
per-country judgment-call fields with no bulk source (`infrastructure.
airports`, `education.notableUniversities`, `agriculture.mainCrops`,
`economy.industries`, `government.largestCity`/`adminDivisions`,
`languages.widely`) — a future pass should work through these
country-by-country rather than trying to batch them.

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
