/* ============================================================
   Value formatters, keyed to Schema field "fmt" types.
   ============================================================ */
const Format = (() => {
  "use strict";

  function num(n, decimals = 0) {
    if (n === null || n === undefined) return null;
    return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function money(n, forceDecimals) {
    if (n === null || n === undefined) return null;
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${num(n, forceDecimals ? 0 : 0)}`;
  }

  function money0(n) {
    if (n === null || n === undefined) return null;
    return `$${num(Math.round(n))}`;
  }

  function value(fieldDef, raw) {
    if (raw === null || raw === undefined) return null;
    switch (fieldDef.fmt) {
      case "int": return `${num(raw)}${fieldDef.unit ? " " + fieldDef.unit : ""}`;
      case "num0": return `${num(raw, 0)}${fieldDef.unit ? " " + fieldDef.unit : ""}`;
      case "num1": return `${num(raw, 1)}${fieldDef.unit ? " " + fieldDef.unit : ""}`;
      case "num2": return `${num(raw, 2)}${fieldDef.unit ? " " + fieldDef.unit : ""}`;
      case "money": return money(raw);
      case "money0": return money0(raw);
      case "text": return raw;
      case "list": return Array.isArray(raw) ? raw.join(", ") : raw;
      case "point": return raw.name ? `${raw.name} (${num(raw.m)} m)` : null;
      case "agedist": return raw ? `0–14: ${raw.y0_14}% · 15–64: ${raw.y15_64}% · 65+: ${raw.y65p}%` : null;
      case "pctlist":
        if (!Array.isArray(raw)) return null;
        return raw.map((r) => r.pct != null ? `${r.name} (${r.pct}%)` : r.name).join(", ");
      default: return String(raw);
    }
  }

  // Numeric magnitude for comparison bars — best-effort, only for
  // fmt types that are meaningfully "bigger is more."
  function magnitude(fieldDef, raw) {
    if (raw === null || raw === undefined) return null;
    if (["int", "num0", "num1", "num2", "money", "money0"].includes(fieldDef.fmt)) return raw;
    return null;
  }

  return { num, money, money0, value, magnitude };
})();
