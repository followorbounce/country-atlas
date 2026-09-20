/* ============================================================
   Simplified 3-bracket "population pyramid" — mirrored horizontal
   bars for two entities, one bracket per row. Not a true 5-year-band
   pyramid (this dataset doesn't carry that granularity) — labeled
   as such in the UI.
   ============================================================ */
const PyramidViz = (() => {
  "use strict";

  const BRACKETS = [
    { key: "y65p", label: "65+" },
    { key: "y15_64", label: "15–64" },
    { key: "y0_14", label: "0–14" },
  ];

  function render(svg, entityA, entityB, labelA, labelB) {
    svg.innerHTML = "";
    const ns = "http://www.w3.org/2000/svg";
    const W = 340, H = 220, midX = W / 2, barMax = 130, rowH = 56, top = 20;

    const styles = getComputedStyle(document.documentElement);
    const colorA = styles.getPropertyValue("--side-a").trim() || "#0b6e73";
    const colorB = styles.getPropertyValue("--side-b").trim() || "#c97c4b";

    const dA = entityA.population?.ageDist, dB = entityB.population?.ageDist;

    BRACKETS.forEach((b, i) => {
      const y = top + i * rowH;
      const valA = (dA && dA[b.key]) || 0;
      const valB = (dB && dB[b.key]) || 0;
      const wA = (valA / 100) * barMax;
      const wB = (valB / 100) * barMax;

      const rectA = document.createElementNS(ns, "rect");
      rectA.setAttribute("x", midX - wA); rectA.setAttribute("y", y);
      rectA.setAttribute("width", wA); rectA.setAttribute("height", 28);
      rectA.setAttribute("fill", colorA);
      svg.appendChild(rectA);

      const rectB = document.createElementNS(ns, "rect");
      rectB.setAttribute("x", midX); rectB.setAttribute("y", y);
      rectB.setAttribute("width", wB); rectB.setAttribute("height", 28);
      rectB.setAttribute("fill", colorB);
      svg.appendChild(rectB);

      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", midX); label.setAttribute("y", y + 19);
      label.setAttribute("font-size", "10.5"); label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "var(--ink)");
      label.textContent = b.label;
      svg.appendChild(label);

      const valTextA = document.createElementNS(ns, "text");
      valTextA.setAttribute("x", midX - wA - 6); valTextA.setAttribute("y", y + 19);
      valTextA.setAttribute("font-size", "10"); valTextA.setAttribute("text-anchor", "end");
      valTextA.setAttribute("fill", colorA);
      valTextA.textContent = `${valA}%`;
      svg.appendChild(valTextA);

      const valTextB = document.createElementNS(ns, "text");
      valTextB.setAttribute("x", midX + wB + 6); valTextB.setAttribute("y", y + 19);
      valTextB.setAttribute("font-size", "10"); valTextB.setAttribute("text-anchor", "start");
      valTextB.setAttribute("fill", colorB);
      valTextB.textContent = `${valB}%`;
      svg.appendChild(valTextB);
    });

    const nameA = document.createElementNS(ns, "text");
    nameA.setAttribute("x", 8); nameA.setAttribute("y", H - 6);
    nameA.setAttribute("font-size", "10.5"); nameA.setAttribute("fill", colorA);
    nameA.textContent = labelA;
    svg.appendChild(nameA);

    const nameB = document.createElementNS(ns, "text");
    nameB.setAttribute("x", W - 8); nameB.setAttribute("y", H - 6);
    nameB.setAttribute("font-size", "10.5"); nameB.setAttribute("text-anchor", "end"); nameB.setAttribute("fill", colorB);
    nameB.textContent = labelB;
    svg.appendChild(nameB);
  }

  return { render };
})();
