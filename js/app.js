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
    return entity.population.total / entity.geography.landAreaKm2;
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

  function renderStatRow(cat, field, a, b) {
    const rawA = fieldValue(a, cat.key, field.key);
    const rawB = fieldValue(b, cat.key, field.key);
    const valA = Format.value(field, rawA);
    const valB = Format.value(field, rawB);
    const magA = Format.magnitude(field, rawA);
    const magB = Format.magnitude(field, rawB);
    let bar = "";
    if (magA != null && magB != null && (magA > 0 || magB > 0)) {
      const total = magA + magB || 1;
      const pctA = (magA / total) * 100;
      bar = `<div class="stat-compare-bar"><div class="a" style="width:${pctA}%"></div><div class="b" style="width:${100 - pctA}%"></div></div>`;
    }
    return `
      <tr class="stat-row">
        <td class="stat-val a">${valA ?? '<span class="stat-na">no data</span>'}</td>
        <td class="stat-label">
          <span class="name">${field.label}</span>
          <button class="info-btn" data-cat="${cat.key}" data-field="${field.key}">what is this?</button>
          ${bar}
        </td>
        <td class="stat-val b">${valB ?? '<span class="stat-na">no data</span>'}</td>
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
  const KIND_LABELS = { country: "Countries", territory: "Territories & SARs", subnational: "Subnational (states)" };
  const KIND_ORDER = ["country", "territory", "subnational"];

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
    card.innerHTML = `
      <div class="flag-big">${entity.flag}</div>
      <div>
        <h2>${entity.name}</h2>
        <div class="kind-tag">${entity.kind}</div>
        <div class="basics">
          <div><b>Capital:</b> ${entity.government.capital}</div>
          <div><b>Population:</b> ${Format.num(entity.population.total)}</div>
          <div><b>Area:</b> ${Format.num(entity.geography.totalAreaKm2)} km²</div>
          <div><b>Currency:</b> ${entity.economy.currency}</div>
        </div>
      </div>`;
  }

  /* ---------- Relative scale strip ---------- */
  function renderScaleStrip() {
    const a = byId(sideA), b = byId(sideB);
    const areaRatio = a.geography.totalAreaKm2 / b.geography.totalAreaKm2;
    const popRatio = a.population.total / b.population.total;
    const gdpRatio = a.economy.gdpNominalUSD / b.economy.gdpNominalUSD;
    const densRatio = density(a) / density(b);
    const items = [
      { label: "Area", big: areaRatio >= 1 ? `${a.name} fits ${b.name} ${areaRatio.toFixed(1)}×` : `${b.name} fits ${a.name} ${(1 / areaRatio).toFixed(1)}×`, pctA: areaRatio >= 1 ? (areaRatio / (areaRatio + 1)) * 100 : (1 / (1 / areaRatio + 1)) * 100 },
      { label: "Population", big: `${popRatio >= 1 ? popRatio.toFixed(1) + "× more" : (1 / popRatio).toFixed(1) + "× fewer"} people in ${a.name}`, pctA: (a.population.total / (a.population.total + b.population.total)) * 100 },
      { label: "GDP (nominal)", big: `${gdpRatio >= 1 ? gdpRatio.toFixed(1) + "× larger" : (1 / gdpRatio).toFixed(1) + "× smaller"} economy: ${a.name}`, pctA: (a.economy.gdpNominalUSD / (a.economy.gdpNominalUSD + b.economy.gdpNominalUSD)) * 100 },
      { label: "Population density", big: `${a.name} is ${densRatio >= 1 ? densRatio.toFixed(1) + "× denser" : (1 / densRatio).toFixed(1) + "× less dense"}`, pctA: (density(a) / (density(a) + density(b))) * 100 },
    ];
    $("#scaleStrip").innerHTML = items.map((i) => `
      <div class="scale-card">
        <div class="label">${i.label}</div>
        <div class="value">${i.big}</div>
        <div class="scale-bar"><div class="a" style="width:${i.pctA}%"></div><div class="b" style="width:${100 - i.pctA}%"></div></div>
      </div>`).join("");
  }

  /* ---------- Special viz ---------- */
  function renderSpecial() {
    const a = byId(sideA), b = byId(sideB);
    RadarViz.render($("#radarChart"), a, b);
    $("#radarLabelA").textContent = `${a.flag} ${a.name}`;
    $("#radarLabelB").textContent = `${b.flag} ${b.name}`;
    PyramidViz.render($("#pyramidChart"), a, b, `${a.flag} ${a.name}`, `${b.flag} ${b.name}`);

    const areaRatio = a.geography.totalAreaKm2 / b.geography.totalAreaKm2;
    $("#relativeScaleBody").innerHTML = `
      <p style="font-size:0.9rem;margin:0 0 10px">
        <b style="color:var(--side-a)">${a.name}</b> (${Format.num(a.geography.totalAreaKm2)} km²) is
        <b>${(areaRatio >= 1 ? areaRatio : 1 / areaRatio).toFixed(2)}×</b>
        the ${areaRatio >= 1 ? "size of" : "size of (i.e. smaller than)"}
        <b style="color:var(--side-b)">${b.name}</b> (${Format.num(b.geography.totalAreaKm2)} km²).
      </p>
      <div class="scale-bar" style="height:22px">
        <div class="a" style="width:${(a.geography.totalAreaKm2 / (a.geography.totalAreaKm2 + b.geography.totalAreaKm2)) * 100}%"></div>
        <div class="b" style="width:${(b.geography.totalAreaKm2 / (a.geography.totalAreaKm2 + b.geography.totalAreaKm2)) * 100}%"></div>
      </div>
      <p class="viz-caption">Bar widths are proportional to total area — a schematic size comparison, not a true equal-area map projection.</p>
    `;
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
    $("#scopeNote").innerHTML = `This atlas covers <b>${Countries.length} hand-curated entities</b> (not the full ~200 countries/territories worldwide) across a focused set of fields per category — chosen to keep every figure honestly sourced rather than padded with unverifiable numbers. See the project's own documentation for the full scope note and what was deliberately left out.`;
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
    renderScopeNote();
    setActiveCategory(activeCategory);
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
