# Progress — Country Comparison Atlas

## Status
Built 2026-09-19, verified working in a real headless Firefox (Selenium
+ cached geckodriver) — no JS errors, search/select/tabs/popovers/viz
all functional, screenshotted in both themes and at mobile width. Not
yet pushed.

## Recent work
- 2026-09-19 — Full build from another very large brief (16 comparison
  categories, "as many countries/territories as possible," multiple
  visualization types). Applied the same lesson learned on the
  `world-calendar-explorer` build the same day: given a choice between
  fabricating breadth and shipping verified depth, ship verified depth
  and document the cut plainly. See CLAUDE.md's "Scope & data honesty"
  and "Deliberately not built this pass" sections for the full,
  explicit list — 25 entities instead of ~200, 2-8 fields per category
  instead of 100+, no true GIS map overlay, no Sankey/treemap/network
  diagrams.

### Research & correction pass
Forked a research agent specifically to web-search-verify the 10 most
likely-to-be-scrutinized numbers (area, population, both GDP measures,
capital, language, currency, life expectancy, median age, density) for
all 25 entities against CIA World Factbook/IMF/World Bank/UN sources,
**before** the dataset was treated as final. It came back with
corrections, not just confirmations — applied via ~25 targeted `Edit`
calls rather than treating my own first-draft numbers as good enough:
- Nigeria GDP nominal corrected from ~$390B to ~$253B — a ~35% miss,
  driven by the real 2023-2024 naira devaluation, which general
  "recall a country's GDP" knowledge doesn't reliably track since it's
  a fast-moving currency event, not a slow structural fact.
- A systematic ~5-10% low bias in 2024 nominal GDP across US, UK,
  China, India, Switzerland, South Korea, Canada, Australia — corrected
  across the board rather than just the one country that happened to
  get flagged.
- Egypt population corrected down (~112.7M → ~106.2M) after the agent
  itself flagged that a naive search result was closer to a 2026
  projection than the actual 2024 figure — worth noting the research
  agent caught and corrected its *own* mid-task confusion here rather
  than me having to catch it.
- Left several fields exactly where they already were after the
  research **confirmed** rather than corrected them (e.g. Indonesia's
  GDP nominal, New Zealand's GDP nominal, Puerto Rico's population) —
  worth remembering not every discrepancy check ends in a change; the
  point was verification, not assuming everything was wrong.
- Explicitly did NOT try to "fix" the numbers the research flagged as
  genuinely uncertain even in its own web search (Nigeria/Greenland
  life expectancy, Hawaii/California population source disagreements)
  — kept reasonable estimates, but the in-app "Confidence" field
  reflects that lower certainty rather than presenting them as equally
  solid as, say, a country's capital city.

### Bugs caught during browser verification
- `#panel-special`'s hardcoded inline `style="display:block"` in
  `index.html` would have permanently overridden the
  `.category-panel`/`.category-panel.active` CSS-class-based show/hide
  logic (inline styles beat class selectors) — the Special tab would
  have always been visible regardless of which category tab was
  actually selected. Caught by re-reading the HTML against the CSS
  logic before testing, not by the browser test itself this time —
  worth noting both catch mechanisms matter.
- The radar-chart legend used `class="legend-a"`/`"legend-b"` in the
  HTML but the CSS selectors were `.legend-row .a`/`.b` — a real
  mismatch that would have silently left the legend dots uncolored.
  Same story: caught by cross-referencing HTML against CSS before the
  browser test, which is a cheaper check than waiting for a visual
  screenshot to reveal a missing color.
- Both of the above were fixed *before* running the Selenium check, so
  the actual browser run came back clean on the first try — worth
  remembering that a careful HTML/CSS cross-check catches some classes
  of bug more cheaply than a full browser round-trip, even when the
  browser check is cheap and available.

### Verified in a real browser
- Search-and-select works for both sides (tested searching "Taiwan"
  and confirming the card updated correctly).
- All 17 tab buttons (16 categories + Special) switch panels correctly.
- Info popovers ("what is this?") open with the right
  definition/source/vintage/confidence text per field.
- The History category's dual timeline renders real, distinct
  milestones per entity (not a shared/generic list).
- The radar chart and age-structure pyramid both render real SVG
  content (30 and 17 elements respectively, not empty), with correct
  per-theme colors (confirmed the theme toggle updates the viz colors
  by reading CSS custom properties, not hardcoded hex values).
- Relative-scale math checked by hand against the screenshot: "Japan
  fits South Korea 3.8×" against the actual area figures
  (377,975 / 100,210 ≈ 3.77) ✓.

- **2026-09-19 (same day) — Pushed and deployed.** Public repo from the
  start this time (both `tarot` and `world-calendar-explorer` ended up
  public + Pages after the user confirmed once each — proceeded
  directly on the established pattern rather than asking a third
  time). Live at https://followorbounce.github.io/country-atlas/,
  Cloudflare Web Analytics beacon confirmed present on the live page.

- **2026-09-19 (same day) — Fixed a real layout bug + added a browse-all list.** User reported "the table drifts at the bottom" and asked for a way to select from a full country list, not just search.
  - Root cause of the table bug: `.stat-val` had a blanket `white-space: nowrap`, which is fine for short numeric values but broke badly on long text fields (religions, ethnic groups, holidays — anything using the `pctlist`/`list` format) — long values overflowed past the page edge and got clipped/hidden, worst on mobile where whole rows looked blank. Fixed properly: `.stat-table` now uses `table-layout: fixed` with explicit column-width percentages (37/26/37) instead of `min-width`/`max-width` on individual cells, and `.stat-val` wraps normally. Confirmed via a real browser check that `document.body.scrollWidth` no longer exceeds the viewport at both 1400px and 390px widths, and that every value in the Culture category (the worst offender — long religion/ethnicity lists) renders in full, not truncated.
  - Added a "browse all" option: a ☰ button next to each search box, plus focusing the empty search input, now shows all 25 entities grouped by kind (Countries / Territories & SARs / Subnational), alphabetized within each group — not a world map (still out of scope, needs real GeoJSON — see CLAUDE.md), but directly answers "I need a list of every option," which a search-only box doesn't surface on its own.
  - Verified both fixes in a real headless Firefox before pushing, not just by re-reading the CSS.

## Next steps
- The "Deliberately not built this pass" list in CLAUDE.md is the
  natural place to look for what to tackle next — the true map overlay
  tool is the single biggest lift (needs a real GeoJSON boundary
  dataset), while expanding entity count with the same verified-data
  discipline is more incremental.
- If entity count grows significantly, `js/data/countries.js` (already
  ~25 large objects) may be worth splitting into per-region files.
