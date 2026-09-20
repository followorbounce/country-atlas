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

- **2026-09-19 (same day) — Added the Growth Over Time chart.** User
  asked what data would be worth adding next; recommended time-series
  (population/GDP growth) over more entities, since it was the one
  entirely-missing *capability* from the brief rather than just
  missing numbers, and the user picked it.
  - Built `js/viz/growth.js` first, with placeholder Japan/South
    Korea-only data, to get the chart mechanics (indexed vs. absolute
    mode, metric toggle, hover tooltips, SVG line rendering) right and
    browser-tested before spending the research budget — this way a
    chart-logic bug wouldn't be mixed up with a data bug during
    verification. Caught and fixed two real issues at this stage: a
    stray `padR: undefined` typo left over from editing (syntax
    error), and a `formatCompact()` gap that rendered trillions as
    "3100.0B" instead of "$3.10T" plus lowercased "GDP" to "gdp" in a
    caption via an overzealous `.toLowerCase()` call.
  - In parallel, forked a research agent to get real historical
    population (1960-2020, 7 points) and GDP nominal (1990-2020, 4
    points) for all 25 entities. It pulled most of it directly from
    the World Bank Open Data API rather than search-scraping — a
    stronger sourcing method than the previous two research passes
    used, since it's hitting a structured data API instead of
    interpreting search results. It also proactively surfaced real
    definitional issues without being asked to smooth them over
    (Germany's reunified-equivalent series, Russia's RSFSR/Federation
    continuity, a BEA SIC→NAICS break affecting California/Hawaii's
    GDP) — all preserved as comments in `timeseries.js`, not
    discarded.
  - Replaced the placeholder with the full verified dataset, then
    **re-verified in the browser again** — and caught a real bug in my
    own *test script*, not the app: I'd used `element.click()` via
    `execute_script`, which only fires a synthetic "click" event, but
    the app's selection dropdown listens for "mousedown" (a deliberate
    choice from the original build, to fire before the input's `blur`
    handler closes the dropdown). The test was silently doing nothing
    while I read stale default-selection data and almost concluded
    "Iceland has no data" incorrectly. Fixed by dispatching a real
    `MouseEvent('mousedown', {bubbles:true})` instead, matching the
    pattern already used successfully in the earlier browse-all-button
    test — then confirmed correct data for Germany/Russia,
    Taiwan/Hong Kong, and California/Greenland pairs by checking the
    actual rendered first/last point values against the source data by
    hand.

- **2026-09-19 (same day) — Added 5 more entities: Palestine, Kosovo,
  Faroe Islands, French Polynesia, New Caledonia.** User asked why the
  list was only 25, then specifically requested these 5 — the ones
  explicitly named in the original brief but missing from the first
  pass.
  - Forked a research agent with an explicit neutrality brief for
    Palestine/Kosovo (asked it to use CIA World Factbook/UN/Wikipedia-
    style neutral phrasing for government-type/sovereignty fields, not
    editorialize either direction). It came back well-calibrated: every
    politically sensitive fact (recognition counts, the Oslo Accords
    Area A/B/C structure, the Gaza/PA split, Kosovo's 2008 declaration
    and disputed status) was phrased factually, and it proactively
    flagged where sourcing was genuinely unstable rather than picking
    one convenient number — most notably Palestine's GDP, which
    collapsed 28-81% depending on region after October 2023 and can't
    honestly be reduced to one "current" figure.
  - Added a new `kind: "disputed"` category (alongside the existing
    `country`/`territory`/`subnational`) specifically for Palestine and
    Kosovo, plus a 4th browse-all group ("Disputed / Partially
    Recognized") — verified in the browser that all 30 entities
    (up from 25) show correctly grouped.
  - Built a new small feature rather than just stuffing a caveat into
    the info popover: `entity.fieldNotes`, a per-entity per-field
    override that renders as a visible ⚠ note directly under the
    value in the stat table (not just hidden behind "what is this?").
    Used for Palestine's GDP (pre-war baseline vs. wartime collapse),
    Kosovo's population (~1.58M vs ~1.98M source disagreement), and
    New Caledonia's GDP (pre-May-2024-unrest baseline). This is a
    genuinely reusable mechanism for any future entity with a similar
    "this number needs context, not just a bare figure" problem.
  - Historical time series for these 5 are intentionally sparse
    (Palestine 3/7 population years, Kosovo 1/7, the other three 2/7
    each, none with historical GDP) — the research flagged most other
    year/entity combinations as derived-not-sourced, and those were
    left out rather than guessed, consistent with how this project has
    handled uncertain data from the start.
  - User also suggested checking artlebedev.com/susha/ (Art. Lebedev
    Studio's "Land Surface" poster project) as a possible data source —
    fetched and checked it directly rather than assuming: it's a 2016
    design/poster project with no downloadable dataset or individual
    territory pages, and it explicitly *excludes* dependent territories
    from the poster — so it couldn't have covered 3 of the 5 entities
    being added anyway. Reported this back rather than silently
    ignoring the suggestion or pretending to use a source that didn't
    fit.
  - Verified all of the above in a real headless Firefox: entity count
    (30), new browse-all group, Palestine/Kosovo card rendering, the
    GDP field-flag actually appearing in the Economy tab, no layout
    overflow from Palestine's long government-status paragraph (the
    `table-layout: fixed` fix from the earlier bug-fix pass held up),
    and the growth chart handling sparse series gracefully for
    New Caledonia vs. French Polynesia and Faroe Islands vs. Greenland.

- **2026-09-19 (same day) — Critical correction: full entity roster,
  not a curated subset.** The user was very unhappy to discover the
  list was still only ~25-30 countries when the brief had explicitly
  asked for all countries/territories, and pointed out (correctly)
  that a list of which countries exist doesn't need "verification" the
  way a statistic does — only the fields being filled in do. Fix:
  added stub entries (`CountriesCore` in `js/data/countries.js`) for
  all 174 remaining UN member states + Vatican City, bringing the
  total to 205. Made every render path in `js/app.js` defensive with
  optional chaining (`renderCard`, `renderScaleStrip`, the relative-
  scale text, `density()`, `PyramidViz.render`) so a dataset spanning
  full 16-category entities next to near-empty stubs can't crash.
  Committed immediately as "Phase 1" before starting the research pass
  below. See `[[feedback-entity-list-vs-data-depth]]` in the
  assistant's memory — this is now a standing rule for any project
  with a "list all X" brief.

- **2026-09-19 (same day) — First core-data research pass on the 175
  stub entities.** 5 parallel research subagents (one per world
  region) were tried first and all 5 failed with HTTP 429 "session
  limit" rate-limit errors. Direct WebFetch calls from the main
  session kept working, so the research was redone as a single
  sequential pass of WebFetch calls against comprehensive Wikipedia
  reference tables instead of per-country lookups — far more
  efficient for 175 entities at once:
  - Population: "List of countries by population (United Nations)"
  - Area: "List of countries and dependencies by area"
  - GDP nominal: "List of countries by GDP (nominal)" (IMF figures)
  - Capital: "List of national capitals"
  - Official language(s): "List of official languages by country and
    territory"
  - Currency: "List of circulating currencies"
  - Median age: "List of countries by median age" (CIA 2024 estimates)
  - Government type: "List of countries by system of government"
  - Life expectancy: "List of countries by life expectancy" — **only
    partially usable**. A first fetch attempt returned entries for the
    lower-ranked (mostly African) countries that formed a suspiciously
    perfect linear staircase (constant −0.15/country decrements) —
    almost certainly the WebFetch summarization model interpolating
    rather than reading real table cells. A stricter, explicitly
    anti-fabrication re-fetch confirmed the real page content available
    to the tool only covered down to Ukraine (73.42 years); everything
    below that in the first attempt was discarded rather than used.
    Result: life expectancy is filled in for ~96 of the 175 entities
    (elsewhere in the "no data" style seen throughout this dataset);
    the rest — mostly African and a handful of Asian states — simply
    don't have it yet. **This is the cautionary example for this
    project going forward: verify WebFetch table extractions for
    internal consistency (monotonic tables producing suspiciously
    regular arithmetic sequences is a tell), don't just trust a
    fluent-looking response.**
  - Cross-referencing ~200-row tables by country name surfaced the
    expected naming mismatches (Ivory Coast vs. Côte d'Ivoire, DR
    Congo vs. Democratic Republic of the Congo vs. Congo DR, Cape
    Verde vs. Cabo Verde, Czechia vs. Czech Republic, Timor-Leste vs.
    East Timor) — resolved via an explicit per-field alias map, not
    fuzzy matching.
  - **Real bug caught and fixed during this pass, not before it**: the
    stub-generation code from the earlier "Phase 1" commit ended with
    `].map((e) => ({ ...e, geography: {}, population: {}, ... }))` —
    a transformation that unconditionally reset every category back to
    an empty object. It was originally meant to *initialize* the
    stubs, but was still present and running *after* this pass's real
    data was spliced into the array literal, silently wiping every
    field back out. First Selenium check showed Kenya/Vietnam
    rendering "no data" everywhere despite the served JS file visibly
    containing correct data — traced by injecting a real `<script>`
    tag into the live page (not `execute_script`, which runs in an
    isolated context that can't see top-level `const` bindings from
    other `<script>` tags) to dump the in-memory `Countries` entry and
    confirm it really was empty in-page, then finding and deleting the
    leftover `.map()` call. Re-verified after the fix: Kenya and
    Vietnam both render full capital/population/area/GDP/currency/
    government-type correctly, and Vatican City (the sparsest entry —
    only currency, capital, government type, and official language
    could be sourced; no area/population/GDP appear in these reference
    tables for a state that small) degrades to "Data not available"
    everywhere else without crashing any tab, including Special
    Comparisons (radar/pyramid/growth).
  - Result: 65 of 175 stub entities got all 9 core fields; 109 got a
    partial set (most missing only life expectancy); 0 got zero fields
    (Vatican City is the sparsest, at 4 of 9).
  - Still not filled in for these 175: the other 10 of 16 categories
    (culture, further history, infrastructure, education, environment,
    agriculture, transportation, technology, position on Earth, hazards)
    and GDP PPP/urban population/unemployment — a legitimate next-pass
    target if deeper coverage is wanted, following the same "verify or
    leave blank" discipline.

- **2026-09-20 — User bug reports: swapped comparison text + missing
  capitals; CA/HI removed; last 10 government-type gaps filled.**
  - Real bug found and fixed: `renderScaleStrip()`'s `ratioCard()`
    helper had a subject/object swap in its "ratio below 1" branch —
    whenever the smaller entity was in side A (e.g. Russia vs. United
    States, Russia first), it produced nonsense like "United States
    has 2.4× fewer people than United States." The Area card had a
    second, separate bug: its "fits" phrasing hardcoded the wrong
    entity name in the same branch, and was confusingly worded even
    when technically correct. Rewrote Area's copy to match the other
    three cards' "has Nx more/less" pattern. Verified in a real
    browser, then re-verified directly against the **live production
    URL** (not localhost) after the user reported still seeing the
    bug — confirmed it was a stale-cache/timing issue on their end,
    not a real regression; the deployed fix was already correct.
  - The user's "can't even find capitals" complaint turned out to be
    about only 4 of 205 entities, not Belarus (which was already
    correct) — Libya, Seychelles, Suriname, Nauru. Filled via targeted
    WebSearch, plus Libya's contested government status, Nauru's
    population/area, and Seychelles' area/full language list.
  - Removed California and Hawaii (205 → 203 entities) now that
    [[us-states-atlas-site]] is a dedicated US-states comparison tool —
    see CLAUDE.md.
  - Filled the remaining 10 stub entities' missing `government.type`
    (Burkina Faso, Guinea-Bissau, Madagascar, Mali, Niger, Somalia,
    South Sudan, Sudan, Syria, Yemen) — these are all countries with
    genuinely volatile, recent political change (several 2025 coups,
    Syria's post-Assad transition, Sudan's civil-war split), so this
    required live WebSearch for current (Sept 2026) status rather than
    the bulk reference-table approach used for the rest of the core
    data — training-knowledge-only answers would likely have been
    stale or wrong for this specific set.

- **2026-09-20 — Geography category completed for all 175 stub
  entities.** See CLAUDE.md's "Scope & data honesty" section for the
  full writeup (sourcing, the land≈total-for-microstates finding, and
  a real mid-pass splicing bug that was caught and fixed before
  committing). Summary: `landAreaKm2`, `coastlineKm`, `highestPoint`,
  `lowestPoint`, `climate`, and `terrain` now filled for all 175 (was:
  only `totalAreaKm2`, and even that was completely missing for 30 of
  them, including Kazakhstan and Argentina). Cross-checked all
  existing `totalAreaKm2` values against a fresh source — zero
  discrepancies, confirming the earlier pass's area data was accurate,
  just incomplete for those 30. Verified in a real headless Firefox
  across multiple extreme pairings (Kazakhstan vs. Tuvalu, Vatican
  City vs. Nauru, Chad vs. Singapore) — no crashes, "Data not
  available" shown honestly wherever a field genuinely isn't sourced
  (e.g. Tuvalu's population), radar/pyramid/growth all degrade
  gracefully.

## Next steps
- The "Deliberately not built this pass" list in CLAUDE.md is the
  natural place to look for what to tackle next — the true map overlay
  tool is the single biggest lift (needs a real GeoJSON boundary
  dataset), while expanding entity count with the same verified-data
  discipline is more incremental.
- If entity count grows significantly, `js/data/countries.js` (already
  ~25 large objects) may be worth splitting into per-region files.

## 2026-09-20 — Population/Languages/Government/Economy fill for the 175 core entities
Direct follow-up to the user's "проверь остальные категории на такие же
пробелы" (check the other categories for the same kind of gaps),
running concurrently with a separate pass filling the Geography
category. Scope: the 4 categories that had a partial fill from the
Phase 2 core-data pass.

**Method** — bulk World Bank indicator API calls via `curl` (not
WebFetch's summarization, which had already proven unreliable once on
a long ranking table — see the government-type/life-expectancy note
above): `SP.URB.TOTL.IN.ZS`, `SP.POP.GROW`, `SP.DYN.TFRT.IN`,
`SP.DYN.LE00.IN`, `NY.GDP.PCAP.CD`, `NY.GDP.MKTP.PP.CD`,
`SL.UEM.TOTL.ZS`, `SP.POP.0014.TO.ZS`, `SP.POP.1564.TO.ZS`,
`SP.POP.65UP.TO.ZS` — each one fetched as raw JSON covering every
economy in one request, matched to our entities by ISO3 code (a manual
id→ISO3 mapping, since these codes are a stable standard, not a
statistic requiring per-entity verification). This is a materially
more reliable extraction method than re-scraping a long HTML table
through a summarizing model, and is worth reusing for future bulk
data passes on this project.

Voting age and legal-system tradition were sourced from Wikipedia's
"Voting age" and "List of national legal systems" list articles
(parsed with BeautifulSoup, not model-summarized) — spot-checked
several non-18 voting ages (Austria/Malta/Cuba/Nicaragua/Argentina/
Ecuador at 16; Nauru/Cameroon/Bahrain at 20; Kuwait/Lebanon/Oman at 21)
against known real-world exceptions to confirm the parse was sound
before trusting it for all 175.

`languages.family`/`languages.script` were filled from a manual
language→(family, script) reference table built from standard
linguistic classification (e.g. "Arabic" → Afro-Asiatic (Semitic) /
Arabic script) — this is stable, textbook linguistic fact rather than
a volatile statistic, so it didn't need per-country web verification,
the same reasoning already applied to ISO3 codes elsewhere in this
project.

**Coverage achieved** (out of 175): urbanPct/growthRatePct/
fertilityRate/lifeExpectancy/ageDist 174/175 (Vatican City is the one
gap — it isn't a World Bank member and doesn't report these);
languages family/script 171/175; votingAge 172/175 (Afghanistan and
UAE genuinely hold no elections, Vatican N/A); legalSystem 144/175
(Wikipedia's list article itself only covers ~178 of ~195 countries —
the other 31 are a genuine source gap, left blank rather than
guessed); gdpPerCapitaUSD 173/175, gdpPPPUSD 170/175 (North Korea,
Cuba, and the European microstates don't have IMF PPP figures),
unemploymentPct 159/175 (mostly missing for Pacific/Caribbean
microstates that don't report ILO-standard unemployment data).

**Still genuinely missing for most of the 175** (left blank, not
guessed, per this project's standing data-integrity rule):
`languages.widely`, `government.largestCity`, `government.
adminDivisions`, `economy.industries`. These are per-country judgment
calls with no clean bulk source — a future pass could work through
them country-by-country, but that's a materially larger, slower effort
than this one, which prioritized the fields with clean authoritative
bulk sources first.

Verified in a real headless Firefox (Belarus vs. Nauru comparison
across Population/Languages/Government/Economy/Geography tabs, plus
the Special-Comparisons radar/pyramid) — all render correctly, no
crashes, missing fields correctly show "no data" rather than blank
breakage.

## 2026-09-20 — Infrastructure/Education/Health/Environment/Agriculture/Technology fill
Continuing the same category-by-category audit-and-fill pass. Sourced
via the World Bank indicator API directly (raw JSON via curl, not
WebFetch's summarizing model — the most reliable approach found this
session) for the 9 fields with clean bulk indicators:
`IT.NET.USER.ZS` (internet penetration/users), `IT.CEL.SETS.P2`
(mobile subscriptions), `SE.ADT.LITR.ZS` (literacy), `SP.DYN.IMRT.IN`
(infant mortality), `SH.XPD.CHEX.GD.ZS` (health expenditure),
`SH.MED.PHYS.ZS` (physicians), a CO2 emissions indicator, `AG.LND.FRST.ZS`
(forest cover), `ER.LND.PTLD.ZS` (protected land), `AG.LND.AGRI.ZS`
(agricultural land).

**Coverage achieved (out of 175)**: internetPenetrationPct/
internetUsersPct 174, mobileSubsPer100 174, renewableEnergyPct 171,
literacyRatePct 153 (many developed countries simply don't report this
to the World Bank since it's assumed ~99% — a real reporting gap, not
a research failure), infantMortalityPer1000/healthExpPctGDP/
physiciansPer1000 173, co2MtPerYear 167, forestPct 174,
protectedLandPct 173, agriculturalLandPct 173.

**Not yet done — 4 fields with no bulk source, still 0/175**:
`airports`, `notableUniversities`, `mainCrops`, `notableTechNote`.
These are genuine per-country judgment calls (which airports count as
"major," which crops lead, which universities are internationally
recognized) with no single reference table — the research pass got
cut off by a session rate limit right as it was about to start this
per-country phase, having correctly prioritized the bulk-sourceable
fields first. A future pass should work through these 4 fields
country-by-country.

Verified in a real headless Firefox (Kuwait vs. Chad across all 6 new
category tabs) before committing — renders correctly, no crashes,
"no data" shown correctly for the unfilled fields above.
