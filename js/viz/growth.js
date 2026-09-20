/* ============================================================
   Growth-over-time line chart. Defaults to an "indexed" view
   (first available year = 100) rather than absolute values, since
   plotting e.g. Iceland's population next to China's on a shared
   linear axis would make the smaller entity's whole trajectory
   invisible — indexing answers "how has this changed" directly,
   which is what the comparison is actually for.
   ============================================================ */
const GrowthViz = (() => {
  "use strict";

  function seriesFor(entity, metric) {
    const raw = metric === "population" ? TimeSeries.population[entity.id] : TimeSeries.gdpNominalUSD[entity.id];
    if (!raw) return [];
    return Object.entries(raw)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([year, v]) => ({ year: Number(year), value: v }))
      .sort((a, b) => a.year - b.year);
  }

  function indexed(series) {
    if (!series.length) return [];
    const base = series[0].value;
    return series.map((p) => ({ year: p.year, value: (p.value / base) * 100, raw: p.value }));
  }

  function render(svg, entityA, entityB, metric, mode) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const W = 480, H = 260;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const marginL = 50, marginR = 16, marginT = 16, marginB = 30;
    const plotW = W - marginL - marginR, plotH = H - marginT - marginB;

    let sA = seriesFor(entityA, metric);
    let sB = seriesFor(entityB, metric);
    if (mode === "indexed") { sA = indexed(sA); sB = indexed(sB); }

    if (!sA.length && !sB.length) {
      const msg = document.createElementNS(ns, "text");
      msg.setAttribute("x", W / 2); msg.setAttribute("y", H / 2);
      msg.setAttribute("text-anchor", "middle"); msg.setAttribute("fill", "var(--ink-dim)");
      msg.setAttribute("font-size", "12");
      msg.textContent = "No historical data available for this metric.";
      svg.appendChild(msg);
      return;
    }

    const allYears = [...new Set([...sA, ...sB].map((p) => p.year))].sort((a, b) => a - b);
    const allValues = [...sA, ...sB].map((p) => p.value);
    const minY = mode === "indexed" ? Math.min(80, ...allValues) : 0;
    const maxY = Math.max(...allValues) * 1.08;
    const minYear = allYears[0], maxYear = allYears[allYears.length - 1];

    function xPos(year) { return marginL + ((year - minYear) / (maxYear - minYear || 1)) * plotW; }
    function yPos(val) { return marginT + plotH - ((val - minY) / (maxY - minY || 1)) * plotH; }

    // gridlines + y labels
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const val = minY + ((maxY - minY) / steps) * i;
      const y = yPos(val);
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", marginL); line.setAttribute("x2", W - marginR);
      line.setAttribute("y1", y); line.setAttribute("y2", y);
      line.setAttribute("stroke", "var(--line)"); line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", marginL - 6); label.setAttribute("y", y + 3);
      label.setAttribute("text-anchor", "end"); label.setAttribute("font-size", "9");
      label.setAttribute("fill", "var(--ink-dim)");
      label.textContent = mode === "indexed" ? Math.round(val) : (metric === "gdpNominalUSD" ? "$" : "") + formatCompact(val);
      svg.appendChild(label);
    }
    // x labels
    allYears.forEach((yr) => {
      const x = xPos(yr);
      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", x); label.setAttribute("y", H - 6);
      label.setAttribute("text-anchor", "middle"); label.setAttribute("font-size", "9");
      label.setAttribute("fill", "var(--ink-dim)");
      label.textContent = yr;
      svg.appendChild(label);
    });

    const styles = getComputedStyle(document.documentElement);
    const colorA = styles.getPropertyValue("--side-a").trim() || "#0b6e73";
    const colorB = styles.getPropertyValue("--side-b").trim() || "#c97c4b";

    function drawLine(series, color) {
      if (!series.length) return;
      const d = series.map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(p.year)} ${yPos(p.value)}`).join(" ");
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", d); path.setAttribute("fill", "none");
      path.setAttribute("stroke", color); path.setAttribute("stroke-width", "2.5");
      svg.appendChild(path);
      series.forEach((p) => {
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", xPos(p.year)); dot.setAttribute("cy", yPos(p.value)); dot.setAttribute("r", "3");
        dot.setAttribute("fill", color);
        const prefix = metric === "gdpNominalUSD" ? "$" : "";
        const title = document.createElementNS(ns, "title");
        title.textContent = `${p.year}: ${mode === "indexed" ? Math.round(p.value) + " (index)" : prefix + formatCompact(p.value)}${p.raw != null ? " — " + prefix + formatCompact(p.raw) + " actual" : ""}`;
        dot.appendChild(title);
        svg.appendChild(dot);
      });
    }
    drawLine(sA, colorA);
    drawLine(sB, colorB);

    if (mode === "indexed") {
      const baseline = document.createElementNS(ns, "line");
      baseline.setAttribute("x1", marginL); baseline.setAttribute("x2", W - marginR);
      baseline.setAttribute("y1", yPos(100)); baseline.setAttribute("y2", yPos(100));
      baseline.setAttribute("stroke", "var(--ink-dim)"); baseline.setAttribute("stroke-dasharray", "3,3");
      svg.appendChild(baseline);
    }
  }

  function formatCompact(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return String(Math.round(n));
  }

  return { render, seriesFor, indexed };
})();
