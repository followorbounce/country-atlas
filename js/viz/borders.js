/* ============================================================
   Border graph — every entity as a flag node placed near its
   geographic centre, joined to each land neighbour by a string.
   Data: js/data/borders.js (Borders.edges / anomalies / pos / iso),
   built by tools/build_borders.py from the research pass in
   tools/borders-source.json. Flags: flag-icons (MIT), assets/flags/.

   Layout: equirectangular projection of each centroid (Pacific
   islands east of 140°W are wrapped to the right of New Zealand),
   then a deterministic collision relaxation that pushes overlapping
   circles apart while springing each back toward its true position.
   The picture is therefore schematic: positions are approximate,
   the connections are exact.
   ============================================================ */
const BordersViz = (() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const W = 1200, H = 640;
  const WALKABLE = { "land": 1, "via-territory": 1, "disputed": 1 };
  const TYPE_LABEL = {
    "land": "land border",
    "via-territory": "via an overseas or exclave territory",
    "disputed": "disputed / de-facto",
    "bridge-or-tunnel-only": "bridge or tunnel only",
    "maritime-only": "maritime only",
  };

  let root, svg, gEdges, gRoute, gNodes, panel, routeBox, stats, anomBox, listBox;
  let nodes = [], byId = {}, adj = {}, edges = [];
  let focusId = null, anomaly = null, sideA = null, sideB = null;
  let view = { x: 0, y: 0, k: 1 };
  let api = null;

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const h = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const nameOf = (id) => (byId[id] ? byId[id].name : id);
  let base = "";
  const flagUrl = (id) => base + "assets/flags/" + (Borders.iso[id] || "xx").toLowerCase() + ".svg";
  const fmtKm = (km) => (km == null ? "length n/a" : km < 1 ? Math.round(km * 1000) + " m" : Math.round(km).toLocaleString("en-US") + " km");

  /* ---------- geometry ---------- */
  function project(lat, lon) {
    if (lon < -140) lon += 360;
    return [((lon + 120) / 335) * (W - 60) + 30, ((74 - lat) / 124) * (H - 40) + 20];
  }

  // Circle area follows the country's area.
  function radius(n) { return 5.5 + 33 * Math.sqrt((n.area || 0) / maxArea); }
  let maxArea = 1;

  function layout() {
    nodes.forEach((n) => { n.r = radius(n); n.x = n.hx; n.y = n.hy; });
    for (let it = 0; it < 360; it++) {
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const min = a.r + b.r + 2;
          if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
          let d = Math.hypot(dx, dy);
          if (d >= min) continue;
          if (d < 0.01) { dx = 0.01 * (i - j); dy = 0.01; d = Math.hypot(dx, dy); }
          const push = (min - d) / 2, ux = dx / d, uy = dy / d;
          // Bigger circles move less, so the large countries keep their places.
          const wa = b.r / (a.r + b.r), wb = a.r / (a.r + b.r);
          a.x -= ux * push * 2 * wa; a.y -= uy * push * 2 * wa;
          b.x += ux * push * 2 * wb; b.y += uy * push * 2 * wb;
        }
      }
      const pull = it < 300 ? 0.018 : 0;
      nodes.forEach((n) => {
        n.x += (n.hx - n.x) * pull; n.y += (n.hy - n.y) * pull;
        n.x = Math.max(n.r + 2, Math.min(W - n.r - 2, n.x));
        n.y = Math.max(n.r + 2, Math.min(H - n.r - 2, n.y));
      });
    }
  }

  function curve(a, b, bend) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const k = bend * Math.min(len * 0.14, 40);
    return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${(mx - (dy / len) * k).toFixed(1)},${(my + (dx / len) * k).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }

  /* ---------- drawing ---------- */
  function draw() {
    gEdges.textContent = ""; gNodes.textContent = "";
    edges.forEach((e, i) => {
      const a = byId[e.a], b = byId[e.b];
      e.path = el("path", { d: curve(a, b, i % 2 ? 1 : -1), class: "be be-" + e.type }, gEdges);
      const w = e.km == null ? 1 : 0.8 + Math.min(2.4, Math.log10(1 + e.km) * 0.62);
      e.path.style.strokeWidth = w;
    });
    nodes.forEach((n) => {
      const g = el("g", { class: "bn", transform: `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})` }, gNodes);
      el("circle", { r: n.r + 1.2, class: "bn-ring" }, g);
      el("image", { href: flagUrl(n.id), x: -n.r, y: -n.r, width: n.r * 2, height: n.r * 2, "clip-path": "url(#bClip)", preserveAspectRatio: "xMidYMid slice" }, g);
      el("title", {}, g).textContent = n.name;
      if (n.r >= 15) el("text", { y: n.r + 11, class: "bn-label" }, g).textContent = n.name;
      n.g = g;
    });
    paint();
  }

  /* Highlight state: focus (hovered/tapped node), selected anomaly, A/B ring, route. */
  function paint() {
    const hot = new Set();
    if (focusId) { hot.add(focusId); (adj[focusId] || []).forEach((x) => hot.add(x.id)); }
    if (anomaly) anomaly.entities.forEach((x) => hot.add(x));
    const dimming = hot.size > 0;
    nodes.forEach((n) => {
      n.g.classList.toggle("dim", dimming && !hot.has(n.id));
      n.g.classList.toggle("is-a", n.id === sideA);
      n.g.classList.toggle("is-b", n.id === sideB);
      n.g.classList.toggle("is-focus", n.id === focusId);
    });
    edges.forEach((e) => {
      const on = focusId ? (e.a === focusId || e.b === focusId) : anomaly ? (hot.has(e.a) && hot.has(e.b)) : false;
      e.path.classList.toggle("hot", on);
      e.path.classList.toggle("dim", dimming && !on);
    });
    drawRoute();
  }

  /* ---------- route between Side A and Side B ---------- */
  function route(from, to) {
    if (!byId[from] || !byId[to]) return null;
    const prev = { [from]: null }, q = [from];
    while (q.length) {
      const c = q.shift();
      if (c === to) break;
      (adj[c] || []).forEach((x) => {
        if (!WALKABLE[x.type] || x.id in prev) return;
        prev[x.id] = c; q.push(x.id);
      });
    }
    if (!(to in prev)) return null;
    const path = [];
    for (let c = to; c != null; c = prev[c]) path.unshift(c);
    return path;
  }

  function drawRoute() {
    gRoute.textContent = "";
    if (!routeBox) return;
    routeBox.textContent = "";
    if (!sideA || !sideB || !byId[sideA] || !byId[sideB]) return;
    const lab = h("span", "br-k", "Land route between Side A and Side B");
    routeBox.appendChild(lab);
    if (sideA === sideB) { routeBox.appendChild(h("span", "br-t", "Same place on both sides.")); return; }
    const p = route(sideA, sideB);
    if (!p) {
      const lonely = [sideA, sideB].filter((id) => !(adj[id] || []).length).map(nameOf);
      routeBox.appendChild(h("span", "br-t", lonely.length
        ? `No land route — ${lonely.join(" and ")} ${lonely.length > 1 ? "have" : "has"} no land border.`
        : `No land route — ${nameOf(sideA)} and ${nameOf(sideB)} are on separate land masses.`));
      return;
    }
    const chain = h("span", "br-chain");
    p.forEach((id, i) => {
      if (i) {
        const step = (adj[p[i - 1]] || []).find((x) => x.id === id);
        chain.appendChild(h("span", "br-arrow", step && step.via ? `→ via ${step.via} →` : step && step.type === "disputed" ? "→ (disputed) →" : "→"));
      }
      const c = h("button", "br-stop" + (i === 0 ? " a" : i === p.length - 1 ? " b" : ""));
      c.type = "button";
      const im = h("img"); im.src = flagUrl(id); im.alt = ""; c.appendChild(im);
      c.appendChild(document.createTextNode(nameOf(id)));
      c.addEventListener("click", () => setFocus(id));
      chain.appendChild(c);
    });
    routeBox.appendChild(chain);
    routeBox.appendChild(h("span", "br-n", `${p.length - 1} border crossing${p.length === 2 ? "" : "s"}`));
    for (let i = 1; i < p.length; i++) {
      const e = edges.find((x) => (x.a === p[i - 1] && x.b === p[i]) || (x.b === p[i - 1] && x.a === p[i]));
      if (e) el("path", { d: e.path.getAttribute("d"), class: "be-route" }, gRoute);
    }
  }

  /* ---------- side panel ---------- */
  function showOverview() {
    panel.textContent = "";
    panel.appendChild(h("h4", null, "The land-border graph"));
    panel.appendChild(h("p", null, "Click any flag on the map to see its neighbours and how long each border is."));
    panel.appendChild(h("p", null, "Thicker lines are longer borders. Circles are sized by area and placed roughly where the country is — small countries are nudged apart so you can still click them."));
  }

  function showCountry(id) {
    const n = byId[id];
    panel.textContent = "";
    const head = h("div", "bp-head");
    const im = h("img", "bp-flag"); im.src = flagUrl(id); im.alt = ""; head.appendChild(im);
    head.appendChild(h("h4", null, n.name));
    head.appendChild(closeBtn());
    panel.appendChild(head);
    const list = adj[id] || [];
    const total = list.reduce((s, x) => s + (x.km || 0), 0);
    panel.appendChild(h("p", "bp-sum", list.length
      ? `${list.length} land neighbour${list.length > 1 ? "s" : ""}${total ? " · " + fmtKm(total) + " of land border" : ""}`
      : "No land borders — every neighbour is across water."));
    const ul = h("ul", "bp-list");
    list.slice().sort((x, y) => (y.km || 0) - (x.km || 0)).forEach((x) => {
      const li = h("li");
      const b = h("button", "bp-n"); b.type = "button";
      const fi = h("img"); fi.src = flagUrl(x.id); fi.alt = ""; b.appendChild(fi);
      b.appendChild(document.createTextNode(nameOf(x.id)));
      b.addEventListener("click", () => setFocus(x.id));
      li.appendChild(b);
      li.appendChild(h("span", "bp-km", fmtKm(x.km)));
      if (x.type !== "land") li.appendChild(h("span", "bp-tag", x.via ? "via " + x.via : TYPE_LABEL[x.type]));
      if (x.note) li.title = x.note;
      ul.appendChild(li);
    });
    panel.appendChild(ul);
    if (api) {
      const row = h("div", "bp-pick");
      ["a", "b"].forEach((side) => {
        const b = h("button", "bp-side " + side, side === "a" ? "Compare as A" : "Compare as B");
        b.type = "button";
        b.addEventListener("click", () => api.select(side, id));
        row.appendChild(b);
      });
      panel.appendChild(row);
    }
  }

  function closeBtn() {
    const b = h("button", "bp-close", "×"); b.type = "button"; b.setAttribute("aria-label", "Clear selection");
    b.addEventListener("click", () => { focusId = null; anomaly = null; markAnomaly(); showOverview(); paint(); });
    return b;
  }

  function setFocus(id) {
    if (!byId[id]) return;
    focusId = id;
    anomaly = null; markAnomaly(); showCountry(focusId);
    paint();
  }

  /* ---------- anomalies ---------- */
  function buildAnomalies() {
    anomBox.textContent = "";
    const chips = h("div", "ba-chips");
    Borders.anomalies.forEach((a, i) => {
      const b = h("button", "ba-chip", a.title); b.type = "button"; b.dataset.i = i;
      b.addEventListener("click", () => {
        anomaly = anomaly === a ? null : a;
        focusId = null; markAnomaly();
        if (anomaly) showAnomaly(a); else showOverview();
        paint();
      });
      chips.appendChild(b);
    });
    anomBox.appendChild(chips);
  }
  function markAnomaly() {
    anomBox.querySelectorAll(".ba-chip").forEach((b) => {
      const on = anomaly && Borders.anomalies[b.dataset.i] === anomaly;
      b.classList.toggle("on", !!on); b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  function showAnomaly(a) {
    panel.textContent = "";
    const top = h("div", "bp-head"); top.appendChild(h("div", "bp-kind", a.kind.replace(/-/g, " "))); top.appendChild(closeBtn()); panel.appendChild(top);
    panel.appendChild(h("h4", null, a.title));
    panel.appendChild(h("p", null, a.fact));
    const row = h("div", "bp-ents");
    a.entities.filter((id) => byId[id]).forEach((id) => {
      const b = h("button", "bp-n"); b.type = "button";
      const fi = h("img"); fi.src = flagUrl(id); fi.alt = ""; b.appendChild(fi);
      b.appendChild(document.createTextNode(nameOf(id)));
      b.addEventListener("click", () => setFocus(id));
      row.appendChild(b);
    });
    panel.appendChild(row);
    if (a.src) panel.appendChild(h("p", "bp-src", "Source: " + a.src));
  }

  /* ---------- stats + text list ---------- */
  // Groups of entities joined by land. With overseas territories counted (French Guiana, Gibraltar...),
  // or only contiguous borders (land + disputed).
  function groups(ok) {
    const seen = {}; let count = 0;
    nodes.forEach((n) => {
      if (seen[n.id] || !(adj[n.id] || []).some((y) => ok[y.type])) return;
      count++; const q = [n.id]; seen[n.id] = 1;
      while (q.length) { const x = q.shift(); (adj[x] || []).forEach((y) => { if (ok[y.type] && !seen[y.id]) { seen[y.id] = 1; q.push(y.id); } }); }
    });
    return count;
  }
  function buildStats() {
    const all = groups(WALKABLE), contiguous = groups({ "land": 1, "disputed": 1 });
    const islands = nodes.filter((n) => !(adj[n.id] || []).length).length;
    const maxDeg = Math.max(...nodes.map((n) => (adj[n.id] || []).length));
    const top = nodes.filter((n) => (adj[n.id] || []).length === maxDeg).map((n) => n.name);
    stats.textContent = "";
    [[edges.length, "land borders"], [all, `land-connected groups (${contiguous} without overseas territories)`], [maxDeg, "most neighbours: " + top.join(" & ")], [islands, "with no land border"]].forEach(([v, k]) => {
      const d = h("div", "bs-cell"); d.appendChild(h("b", null, String(v))); d.appendChild(h("span", null, k)); stats.appendChild(d);
    });
  }

  function buildList() {
    const tbl = h("table", "bt");
    const thead = h("thead"); const tr = h("tr");
    ["Country", "Neighbours", "Shared land borders"].forEach((t) => tr.appendChild(h("th", null, t)));
    thead.appendChild(tr); tbl.appendChild(thead);
    const tb = h("tbody");
    nodes.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((n) => {
      const r = h("tr");
      const c0 = h("td"); const b = h("button", "bt-n", n.name); b.type = "button";
      b.addEventListener("click", () => { setFocus(n.id); root.scrollIntoView({ behavior: "smooth", block: "start" }); });
      c0.appendChild(b); r.appendChild(c0);
      const list = adj[n.id] || [];
      r.appendChild(h("td", "bt-c", String(list.length)));
      r.appendChild(h("td", null, list.length ? list.map((x) => nameOf(x.id) + " (" + fmtKm(x.km) + (x.type !== "land" ? ", " + (x.via ? "via " + x.via : TYPE_LABEL[x.type]) : "") + ")").join(", ") : "—"));
      tb.appendChild(r);
    });
    tbl.appendChild(tb);
    listBox.appendChild(tbl);
  }

  /* ---------- zoom / pan / picking ---------- */
  function applyView() {
    const w = W / view.k, hh = H / view.k;
    view.x = Math.max(0, Math.min(W - w, view.x)); view.y = Math.max(0, Math.min(H - hh, view.y));
    svg.setAttribute("viewBox", `${view.x.toFixed(1)} ${view.y.toFixed(1)} ${w.toFixed(1)} ${hh.toFixed(1)}`);
    // Zoomed in: drags pan the graph. At full view: the page scrolls normally on touch.
    svg.style.touchAction = view.k > 1.01 ? "none" : "pan-y";
  }
  function zoomAt(k, cx, cy) {
    k = Math.max(1, Math.min(8, k));
    const w0 = W / view.k, h0 = H / view.k;
    const fx = (cx - view.x) / w0, fy = (cy - view.y) / h0;
    view.k = k;
    view.x = cx - fx * (W / k); view.y = cy - fy * (H / k);
    applyView();
  }
  function toGraph(e) {
    const r = svg.getBoundingClientRect();
    return [view.x + ((e.clientX - r.left) / r.width) * (W / view.k), view.y + ((e.clientY - r.top) / r.height) * (H / view.k), r.width / (W / view.k)];
  }
  // Nearest node within ~18 screen px of the pointer (so tiny countries are still tappable).
  function pick(e) {
    const [x, y, s] = toGraph(e);
    let best = null, bd = Infinity;
    nodes.forEach((n) => {
      const d = Math.hypot(n.x - x, n.y - y) - n.r;
      if (d < bd) { bd = d; best = n; }
    });
    return bd * s <= 18 ? best : null;
  }

  function wirePointer() {
    const pts = new Map();
    let drag = null, moved = false, pinch = null;
    svg.addEventListener("pointerdown", (e) => {
      pts.set(e.pointerId, e);
      moved = false;
      if (pts.size === 2 && view.k > 1.01) {
        const [p, q] = [...pts.values()];
        pinch = { d: Math.hypot(p.clientX - q.clientX, p.clientY - q.clientY), k: view.k };
      } else if (view.k > 1.01) {
        drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
        svg.setPointerCapture(e.pointerId);
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, e);
      if (pinch && pts.size === 2) {
        const [p, q] = [...pts.values()];
        const d = Math.hypot(p.clientX - q.clientX, p.clientY - q.clientY);
        const mid = { clientX: (p.clientX + q.clientX) / 2, clientY: (p.clientY + q.clientY) / 2 };
        const [cx, cy] = toGraph(mid);
        zoomAt(pinch.k * d / pinch.d, cx, cy); moved = true; return;
      }
      if (drag) {
        const r = svg.getBoundingClientRect(), s = (W / view.k) / r.width;
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) moved = true;
        view.x = drag.vx - (e.clientX - drag.x) * s; view.y = drag.vy - (e.clientY - drag.y) * s;
        applyView(); return;
      }
      if (e.pointerType === "mouse") svg.style.cursor = pick(e) ? "pointer" : view.k > 1.01 ? "grab" : "default";
    });
    const end = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (drag && !pts.size) drag = null;
    };
    svg.addEventListener("pointerup", (e) => {
      // A click on a flag selects it; a click on empty space keeps the current choice.
      if (!moved) { const n = pick(e); if (n) setFocus(n.id); }
      end(e);
    });
    svg.addEventListener("pointercancel", end);
    svg.addEventListener("dblclick", (e) => { const [x, y] = toGraph(e); zoomAt(view.k * 2, x, y); });
  }

  /* ---------- public ---------- */
  /* opts: { select(side, id) } on the atlas page; { root, base } when embedded elsewhere (the homepage
     passes base "/country-atlas/" and has no A/B sides, route strip or text list). */
  function init(opts) {
    opts = opts || {};
    root = typeof opts.root === "string" ? document.getElementById(opts.root) : opts.root || document.getElementById("borders");
    if (!root || typeof Borders === "undefined") return;
    api = opts.select ? opts : null;
    base = opts.base || "";
    svg = root.querySelector("#borderGraph");
    panel = root.querySelector("#borderPanel");
    routeBox = root.querySelector("#borderRoute");
    stats = root.querySelector("#borderStats");
    anomBox = root.querySelector("#borderAnomalies");
    listBox = root.querySelector("#borderList");

    const ents = typeof Countries !== "undefined" ? Countries
      : Object.keys(Borders.ents || {}).map((id) => ({ id, name: Borders.ents[id][0], geography: { totalAreaKm2: Borders.ents[id][1] } }));
    nodes = ents.filter((c) => Borders.pos[c.id]).map((c) => {
      const [hx, hy] = project(Borders.pos[c.id][0], Borders.pos[c.id][1]);
      return { id: c.id, name: c.name, hx, hy, area: c.geography?.totalAreaKm2, pop: c.population?.total };
    });
    nodes.forEach((n) => { byId[n.id] = n; adj[n.id] = []; });
    maxArea = Math.max(...nodes.map((n) => n.area || 0)) || 1;
    // Bridge/tunnel-only links (Channel Tunnel, Øresund, causeways) are not land borders: kept in the data, not drawn.
    edges = Borders.edges.filter((e) => byId[e.a] && byId[e.b] && WALKABLE[e.type]);
    edges.forEach((e) => {
      adj[e.a].push({ id: e.b, km: e.km, type: e.type, via: e.via, note: e.note });
      adj[e.b].push({ id: e.a, km: e.km, type: e.type, via: e.via, note: e.note });
    });

    const defs = el("defs", {}, svg);
    const cp = el("clipPath", { id: "bClip", clipPathUnits: "objectBoundingBox" }, defs);
    el("circle", { cx: 0.5, cy: 0.5, r: 0.5 }, cp);
    gEdges = el("g", { class: "b-edges" }, svg);
    gRoute = el("g", { class: "b-route" }, svg);
    gNodes = el("g", { class: "b-nodes" }, svg);

    root.querySelector(".bz-in").addEventListener("click", () => zoomAt(view.k * 1.6, view.x + W / view.k / 2, view.y + H / view.k / 2));
    root.querySelector(".bz-out").addEventListener("click", () => zoomAt(view.k / 1.6, view.x + W / view.k / 2, view.y + H / view.k / 2));
    root.querySelector(".bz-reset").addEventListener("click", () => { view = { x: 0, y: 0, k: 1 }; applyView(); });

    layout(); draw(); applyView(); wirePointer();
    buildStats(); buildAnomalies(); if (listBox) buildList(); showOverview();
  }

  function update(a, b) { sideA = a; sideB = b; if (svg && nodes.length) paint(); }

  return { init, update, _route: route };
})();
