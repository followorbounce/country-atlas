/* ============================================================
   App wiring: selectors, category tabs, stat tables, relative
   scale, radar + pyramid viz, dual timeline, info popovers, theme.
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const byId = (id) => Countries.find((c) => c.id === id);

  let sideA = "japan";
  let sideB = "south-korea";
  let activeCategory = "geography";

  function density(entity) {
    const pop = entity.population?.total;
    const land = entity.geography?.landAreaKm2 || entity.geography?.totalAreaKm2;
    if (!pop || !land) return null;
    return pop / land;
  }

  function fieldValue(entity, catKey, fieldKey) {
    if (fieldKey === "densityPerKm2") return density(entity);
    const catObj = entity[catKey];
    return catObj ? catObj[fieldKey] : undefined;
  }

  /* ---------- Category nav ---------- */
  function buildCatNav() {
    const nav = $("#catNav");
    const items = [...Schema.categories.map((c) => ({ key: c.key, label: `${c.icon} ${c.label}` })), { key: "special", label: "📊 Special" }];
    nav.innerHTML = items.map((c) => `<button data-cat="${c.key}" class="${c.key === activeCategory ? "active" : ""}">${c.label}</button>`).join("");
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-cat]");
      if (!btn) return;
      setActiveCategory(btn.dataset.cat);
    });
  }

  function setActiveCategory(key) {
    activeCategory = key;
    $$("#catNav button").forEach((b) => b.classList.toggle("active", b.dataset.cat === key));
    $$(".category-panel").forEach((p) => p.classList.toggle("active", p.id === `panel-${key}`));
    document.getElementById(`panel-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Category panels (data-driven) ---------- */
  function buildCategoryPanels() {
    const container = $("#categoryPanels");
    container.innerHTML = Schema.categories.map((cat) => `
      <section class="category-panel" id="panel-${cat.key}">
        <div class="category-head"><h2>${cat.icon} ${cat.label}</h2></div>
        <p class="category-sub">${cat.sub}</p>
        ${cat.key === "history" ? '<div id="historyStats"></div><div class="dual-timeline" id="dualTimeline" style="margin-top:24px"></div>' : `<table class="stat-table"><tbody id="stats-${cat.key}"></tbody></table>`}
      </section>
    `).join("");
  }

  function renderCategoryData() {
    const a = byId(sideA), b = byId(sideB);
    Schema.categories.forEach((cat) => {
      const tbody = document.getElementById(`stats-${cat.key}`);
      if (!tbody) return; // history handled separately
      tbody.innerHTML = cat.fields.map((f) => renderStatRow(cat, f, a, b)).join("");
    });
    renderHistoryStats(a, b);
    renderDualTimeline(a, b);
    wireInfoButtons();
  }

  function fieldNote(entity, catKey, fieldKey) {
    return entity.fieldNotes?.[`${catKey}.${fieldKey}`];
  }

  function renderStatRow(cat, field, a, b) {
    const rawA = fieldValue(a, cat.key, field.key);
    const rawB = fieldValue(b, cat.key, field.key);
    const valA = Format.value(field, rawA);
    const valB = Format.value(field, rawB);
    const magA = Format.magnitude(field, rawA);
    const magB = Format.magnitude(field, rawB);
    const noteA = fieldNote(a, cat.key, field.key);
    const noteB = fieldNote(b, cat.key, field.key);
    let bar = "";
    if (magA != null && magB != null && (magA > 0 || magB > 0)) {
      const total = magA + magB || 1;
      const pctA = (magA / total) * 100;
      bar = `<div class="stat-compare-bar"><div class="a" style="width:${pctA}%"></div><div class="b" style="width:${100 - pctA}%"></div></div>`;
    }
    return `
      <tr class="stat-row">
        <td class="stat-val a">${valA ?? '<span class="stat-na">no data</span>'}${noteA ? `<div class="field-flag">⚠ ${noteA}</div>` : ""}</td>
        <td class="stat-label">
          <span class="name">${field.label}</span>
          <button class="info-btn" data-cat="${cat.key}" data-field="${field.key}">what is this?</button>
          ${bar}
        </td>
        <td class="stat-val b">${valB ?? '<span class="stat-na">no data</span>'}${noteB ? `<div class="field-flag">⚠ ${noteB}</div>` : ""}</td>
      </tr>`;
  }

  function renderHistoryStats(a, b) {
    const el = $("#historyStats");
    if (!el) return;
    const cat = Schema.categories.find((c) => c.key === "history");
    el.innerHTML = `<table class="stat-table"><tbody>${cat.fields.map((f) => renderStatRow(cat, f, a, b)).join("")}</tbody></table>`;
  }

  function renderDualTimeline(a, b) {
    const el = $("#dualTimeline");
    if (!el) return;
    const tlA = HistoryTimelines[a.id] || [];
    const tlB = HistoryTimelines[b.id] || [];
    el.innerHTML = `
      <div class="tl-col a">
        <h3 style="margin-top:0">${a.flag} ${a.name}</h3>
        ${tlA.map((t) => `<div class="tl-item"><div class="yr">${t.year}</div><p>${t.text}</p></div>`).join("") || '<p class="stat-na">No milestones recorded</p>'}
      </div>
      <div class="tl-col b">
        <h3 style="margin-top:0">${b.flag} ${b.name}</h3>
        ${tlB.map((t) => `<div class="tl-item"><div class="yr">${t.year}</div><p>${t.text}</p></div>`).join("") || '<p class="stat-na">No milestones recorded</p>'}
      </div>`;
  }

  /* ---------- Info popovers (Data Explorer) ---------- */
  function wireInfoButtons() {
    $$(".info-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cat = Schema.categories.find((c) => c.key === btn.dataset.cat);
        const field = cat.fields.find((f) => f.key === btn.dataset.field);
        showInfoPopover(btn, field);
      });
    });
  }
  function showInfoPopover(anchor, field) {
    const pop = $("#infoPopover");
    $("#infoPopoverBody").innerHTML = `
      <dt>Metric</dt><dd>${field.label}${field.unit ? ` (${field.unit})` : ""}</dd>
      <dt>Definition</dt><dd>${field.def}</dd>
      <dt>Source</dt><dd>${field.src}</dd>
      <dt>Vintage</dt><dd>Approximate, recent-year (2023–2025) estimate</dd>
      <dt>Confidence</dt><dd>${confidenceFor(field)}</dd>
    `;
    const rect = anchor.getBoundingClientRect();
    pop.style.top = `${Math.min(window.innerHeight - 220, rect.bottom + 6)}px`;
    pop.style.left = `${Math.max(10, Math.min(window.innerWidth - 330, rect.left - 100))}px`;
    pop.classList.add("open");
  }
  function confidenceFor(field) {
    if (["totalAreaKm2", "landAreaKm2", "capital", "official", "currency", "type"].includes(field.key)) return "High — stable, well-documented facts";
    if (["gdpNominalUSD", "gdpPPPUSD", "unemploymentPct", "co2MtPerYear"].includes(field.key)) return "Moderate — figures shift year to year and by source/methodology";
    return "Moderate — recent-year estimate, not live data";
  }

  /* ---------- Country panels + search / browse-all ---------- */
  const KIND_LABELS = { country: "Countries", territory: "Territories & SARs", disputed: "Disputed / Partially Recognized", subnational: "Subnational (states)" };
  const KIND_ORDER = ["country", "territory", "disputed", "subnational"];

  function renderGroupedList(results) {
    const groups = KIND_ORDER.map((kind) => ({
      kind,
      label: KIND_LABELS[kind],
      items: Countries.filter((c) => c.kind === kind).sort((x, y) => x.name.localeCompare(y.name)),
    })).filter((g) => g.items.length);
    results.innerHTML = groups.map((g) => `
      <div class="results-group-label">${g.label}</div>
      ${g.items.map((c) => `<button data-id="${c.id}"><span class="flag">${c.flag}</span>${c.name}<span class="kind">${c.kind}</span></button>`).join("")}
    `).join("");
    results.classList.add("open");
  }

  function renderFilteredList(results, q) {
    const matches = Countries.filter((c) => c.name.toLowerCase().includes(q)).sort((x, y) => x.name.localeCompare(y.name));
    results.innerHTML = matches.map((c) => `<button data-id="${c.id}"><span class="flag">${c.flag}</span>${c.name}<span class="kind">${c.kind}</span></button>`).join("") || `<div style="padding:10px;font-size:0.82rem;color:var(--ink-dim)">No matches</div>`;
    results.classList.add("open");
  }

  function buildPanel(side) {
    const panel = $(`#panel${side.toUpperCase()}`);
    panel.innerHTML = `
      <div class="panel-side-label">Side ${side.toUpperCase()}</div>
      <div class="search-box">
        <div class="search-row">
          <input type="text" placeholder="Search or browse all ${Countries.length}..." data-side="${side}">
          <button type="button" class="browse-btn" data-side="${side}" title="Browse full list">☰</button>
        </div>
        <div class="search-results" data-side="${side}"></div>
      </div>
      <div class="country-card" data-side="${side}"></div>
    `;
    const input = panel.querySelector("input");
    const browseBtn = panel.querySelector(".browse-btn");
    const results = panel.querySelector(".search-results");

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { renderGroupedList(results); return; }
      renderFilteredList(results, q);
    });
    input.addEventListener("focus", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) renderGroupedList(results); else renderFilteredList(results, q);
    });
    browseBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      input.value = "";
      renderGroupedList(results);
      input.focus();
    });
    input.addEventListener("blur", () => setTimeout(() => results.classList.remove("open"), 150));
    results.addEventListener("mousedown", (e) => {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      selectCountry(side, btn.dataset.id);
      input.value = "";
      results.classList.remove("open");
    });
  }

  function selectCountry(side, id) {
    if (side === "a") sideA = id; else sideB = id;
    renderCard(side);
    renderAll();
  }

  function renderCard(side) {
    const entity = byId(side === "a" ? sideA : sideB);
    const card = document.querySelector(`.country-card[data-side="${side}"]`);
    const capital = entity.government?.capital ?? "—";
    const pop = entity.population?.total != null ? Format.num(entity.population.total) : "—";
    const area = entity.geography?.totalAreaKm2 != null ? `${Format.num(entity.geography.totalAreaKm2)} km²` : "—";
    const currency = entity.economy?.currency ?? "—";
    card.innerHTML = `
      <div class="flag-big">${entity.flag}</div>
      <div>
        <h2>${entity.name}</h2>
        <div class="kind-tag">${entity.kind}</div>
        <div class="basics">
          <div><b>Capital:</b> ${capital}</div>
          <div><b>Population:</b> ${pop}</div>
          <div><b>Area:</b> ${area}</div>
          <div><b>Currency:</b> ${currency}</div>
        </div>
      </div>`;
  }

  /* ---------- Relative scale strip ---------- */
  function safeRatio(x, y) {
    if (typeof x !== "number" || typeof y !== "number" || !x || !y) return null;
    return x / y;
  }
  function renderScaleStrip() {
    const a = byId(sideA), b = byId(sideB);
    const areaA = a.geography?.totalAreaKm2, areaB = b.geography?.totalAreaKm2;
    const popA = a.population?.total, popB = b.population?.total;
    const gdpA = a.economy?.gdpNominalUSD, gdpB = b.economy?.gdpNominalUSD;
    const densA = (popA && areaA) ? popA / (a.geography.landAreaKm2 || areaA) : null;
    const densB = (popB && areaB) ? popB / (b.geography.landAreaKm2 || areaB) : null;

    function ratioCard(label, x, y, nameA, nameB, verb) {
      const r = safeRatio(x, y);
      if (r == null) return { label, big: "Data not available for this comparison", pctA: 50 };
      const big = r >= 1 ? `${nameA} ${verb.gte.replace("{n}", r.toFixed(1))}` : `${nameB} ${verb.lt.replace("{n}", (1 / r).toFixed(1))}`;
      const pctA = (x / (x + y)) * 100;
      return { label, big, pctA };
    }

    const items = [
      ratioCard("Area", areaA, areaB, a.name, b.name, { gte: `fits ${b.name} {n}×`, lt: `fits ${a.name} {n}×` }),
      ratioCard("Population", popA, popB, a.name, b.name, { gte: `has {n}× more people than ${b.name}`, lt: `has {n}× fewer people than ${b.name}` }),
      ratioCard("GDP (nominal)", gdpA, gdpB, a.name, b.name, { gte: `has a {n}× larger economy than ${b.name}`, lt: `has a {n}× smaller economy than ${b.name}` }),
      ratioCard("Population density", densA, densB, a.name, b.name, { gte: `is {n}× denser than ${b.name}`, lt: `is {n}× less dense than ${b.name}` }),
    ];
    $("#scaleStrip").innerHTML = items.map((i) => `
      <div class="scale-card">
        <div class="label">${i.label}</div>
        <div class="value">${i.big}</div>
        <div class="scale-bar"><div class="a" style="width:${i.pctA}%"></div><div class="b" style="width:${100 - i.pctA}%"></div></div>
      </div>`).join("");
  }

  /* ---------- Growth over time ---------- */
  let growthMetric = "population";
  let growthMode = "indexed";
  function renderGrowth() {
    const a = byId(sideA), b = byId(sideB);
    GrowthViz.render($("#growthChart"), a, b, growthMetric, growthMode);
    $("#growthLabelA").textContent = `${a.flag} ${a.name}`;
    $("#growthLabelB").textContent = `${b.flag} ${b.name}`;
    const metricLabel = growthMetric === "population" ? "population" : "GDP (nominal)";
    $("#growthCaption").textContent = growthMode === "indexed"
      ? `Indexed view: each line starts at 100 in its first available year, so ${metricLabel} trajectories are comparable regardless of the two entities' very different absolute scale. Hover a point for the actual value. Some entities/years have no data (border or currency-history reasons) and are simply skipped, not estimated.`
      : `Absolute ${metricLabel} values. Hover a point for the exact figure. Some entities/years have no data and are simply skipped, not estimated.`;
  }
  function initGrowthControls() {
    $("#growthMetricChips").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-metric]");
      if (!btn) return;
      growthMetric = btn.dataset.metric;
      $$("#growthMetricChips .chip").forEach((c) => c.classList.toggle("active", c === btn));
      renderGrowth();
    });
    $("#growthModeChips").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-mode]");
      if (!btn) return;
      growthMode = btn.dataset.mode;
      $$("#growthModeChips .chip").forEach((c) => c.classList.toggle("active", c === btn));
      renderGrowth();
    });
  }

  /* ---------- Special viz ---------- */
  function renderSpecial() {
    const a = byId(sideA), b = byId(sideB);
    RadarViz.render($("#radarChart"), a, b);
    $("#radarLabelA").textContent = `${a.flag} ${a.name}`;
    $("#radarLabelB").textContent = `${b.flag} ${b.name}`;
    PyramidViz.render($("#pyramidChart"), a, b, `${a.flag} ${a.name}`, `${b.flag} ${b.name}`);
    renderGrowth();

    const areaA = a.geography?.totalAreaKm2, areaB = b.geography?.totalAreaKm2;
    if (areaA && areaB) {
      const areaRatio = areaA / areaB;
      $("#relativeScaleBody").innerHTML = `
        <p style="font-size:0.9rem;margin:0 0 10px">
          <b style="color:var(--side-a)">${a.name}</b> (${Format.num(areaA)} km²) is
          <b>${(areaRatio >= 1 ? areaRatio : 1 / areaRatio).toFixed(2)}×</b>
          the ${areaRatio >= 1 ? "size of" : "size of (i.e. smaller than)"}
          <b style="color:var(--side-b)">${b.name}</b> (${Format.num(areaB)} km²).
        </p>
        <div class="scale-bar" style="height:22px">
          <div class="a" style="width:${(areaA / (areaA + areaB)) * 100}%"></div>
          <div class="b" style="width:${(areaB / (areaA + areaB)) * 100}%"></div>
        </div>
        <p class="viz-caption">Bar widths are proportional to total area — a schematic size comparison, not a true equal-area map projection.</p>
      `;
    } else {
      $("#relativeScaleBody").innerHTML = `<p class="stat-na">Area data not available for one or both selections.</p>`;
    }
  }

  /* ---------- Theme ---------- */
  function initTheme() {
    const saved = localStorage.getItem("atlas-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $("#themeToggle").addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("atlas-theme", next); } catch (e) { /* ignore */ }
      renderAll(); // re-render so viz colors (read from CSS vars) update
    });
  }

  /* ---------- Popover close ---------- */
  function initPopoverClose() {
    $("#infoPopoverClose").addEventListener("click", () => $("#infoPopover").classList.remove("open"));
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#infoPopover") && !e.target.closest(".info-btn")) $("#infoPopover").classList.remove("open");
    });
  }

  /* ---------- Scope note ---------- */
  function renderScopeNote() {
    $("#scopeNote").innerHTML = `This atlas covers <b>${Countries.length} entities</b> — every UN member state plus the Holy See and a set of major territories/disputed regions. Depth varies: a curated set has full profiles across all 16 categories, verified against primary sources; the rest have core fields filled in as a research pass verifies them, and show "no data" rather than a guessed number for anything not yet confirmed. See the project's own documentation for exactly which entities have full depth today.`;
  }

  /* ---------- Orchestration ---------- */
  function renderAll() {
    renderCard("a"); renderCard("b");
    renderScaleStrip();
    renderCategoryData();
    renderSpecial();
  }

  function init() {
    buildCatNav();
    buildCategoryPanels();
    buildPanel("a"); buildPanel("b");
    initTheme();
    initPopoverClose();
    initGrowthControls();
    renderScopeNote();
    setActiveCategory(activeCategory);
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
