/* ============================================================
   Radar chart: 6 axes, each normalized to a fixed reference ceiling
   (not to the min/max of the two countries being compared) so the
   shapes stay meaningfully comparable across any pair, and so the
   chart doesn't silently change scale when you swap countries.
   ============================================================ */
const RadarViz = (() => {
  "use strict";

  const AXES = [
    { key: "density", label: "Pop. density", get: (e) => e.population.total / e.geography.landAreaKm2, norm: (v) => Math.min(100, (Math.log10(v + 1) / Math.log10(10000)) * 100) },
    { key: "gdppc", label: "GDP/capita", get: (e) => e.economy.gdpPerCapitaUSD, norm: (v) => Math.min(100, (v / 120000) * 100) },
    { key: "life", label: "Life expectancy", get: (e) => e.population.lifeExpectancy, norm: (v) => Math.max(0, Math.min(100, ((v - 50) / 40) * 100)) },
    { key: "urban", label: "Urban %", get: (e) => e.population.urbanPct, norm: (v) => v },
    { key: "internet", label: "Internet %", get: (e) => e.infrastructure.internetPenetrationPct, norm: (v) => v },
    { key: "forest", label: "Forest %", get: (e) => e.environment.forestPct, norm: (v) => v },
  ];

  function pointOn(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function polygonPoints(cx, cy, maxR, values) {
    const n = values.length;
    return values.map((v, i) => {
      const angle = (360 / n) * i;
      const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
      return pointOn(cx, cy, r, angle);
    });
  }

  function render(svg, entityA, entityB) {
    const cx = 170, cy = 170, maxR = 120;
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";

    // rings
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const ring = document.createElementNS(ns, "polygon");
      const pts = AXES.map((_, i) => pointOn(cx, cy, maxR * f, (360 / AXES.length) * i));
      ring.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "var(--line)");
      ring.setAttribute("stroke-width", "1");
      svg.appendChild(ring);
    });

    // axis lines + labels
    AXES.forEach((axis, i) => {
      const angle = (360 / AXES.length) * i;
      const end = pointOn(cx, cy, maxR, angle);
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", cx); line.setAttribute("y1", cy);
      line.setAttribute("x2", end.x); line.setAttribute("y2", end.y);
      line.setAttribute("stroke", "var(--line)"); line.setAttribute("stroke-width", "1");
      svg.appendChild(line);

      const labelPt = pointOn(cx, cy, maxR + 24, angle);
      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", labelPt.x); label.setAttribute("y", labelPt.y);
      label.setAttribute("font-size", "9.5");
      label.setAttribute("fill", "var(--ink-dim)");
      label.setAttribute("text-anchor", "middle");
      label.textContent = axis.label;
      svg.appendChild(label);
    });

    function drawEntity(entity, color) {
      const values = AXES.map((axis) => {
        try { return axis.norm(axis.get(entity)); } catch (e) { return 0; }
      });
      const pts = polygonPoints(cx, cy, maxR, values);
      const poly = document.createElementNS(ns, "polygon");
      poly.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "));
      poly.setAttribute("fill", color);
      poly.setAttribute("fill-opacity", "0.22");
      poly.setAttribute("stroke", color);
      poly.setAttribute("stroke-width", "2");
      svg.appendChild(poly);
      pts.forEach((p) => {
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("r", "2.5");
        dot.setAttribute("fill", color);
        svg.appendChild(dot);
      });
    }

    const styles = getComputedStyle(document.documentElement);
    drawEntity(entityA, styles.getPropertyValue("--side-a").trim() || "#0b6e73");
    drawEntity(entityB, styles.getPropertyValue("--side-b").trim() || "#c97c4b");
  }

  return { render, AXES };
})();
