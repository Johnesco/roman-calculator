"use strict";

/* ---------- Roman numeral helpers ---------- */

const PAIRS = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

const MAX = 3999999; // largest integer part we can show (with vinculum)

function intToRoman(n) {
  let s = "";
  for (const [v, r] of PAIRS) {
    while (n >= v) { s += r; n -= v; }
  }
  return s;
}

// Every canonical numeral 1..3999 -> value. Every prefix of a canonical
// numeral is itself canonical, so this map doubles as the input validator.
const ROMAN = new Map();
for (let i = 1; i <= 3999; i++) ROMAN.set(intToRoman(i), i);

const FRACTION = /^S?·{0,5}$/; // semis (6/12) + up to five unciae (1/12)

function splitEntry(str) {
  const i = str.search(/[S·]/);
  return i < 0 ? [str, ""] : [str.slice(0, i), str.slice(i)];
}

function isValidEntry(str) {
  if (str === "N") return true;
  if (str === "") return true;
  const [int, frac] = splitEntry(str);
  if (int && !ROMAN.has(int)) return false;
  return FRACTION.test(frac);
}

function parseRoman(str) {
  if (str === "N" || str === "") return 0;
  const [int, frac] = splitEntry(str);
  const whole = int ? ROMAN.get(int) : 0;
  const twelfths = (frac.startsWith("S") ? 6 : 0) + (frac.match(/·/g) || []).length;
  return whole + twelfths / 12;
}

/** Number -> HTML string of Roman numerals (nearest twelfth). */
function toRomanHTML(x) {
  const neg = x < 0;
  const t = Math.round(Math.abs(x) * 12);
  if (t === 0) return "N";
  const whole = Math.floor(t / 12);
  const frac = t % 12;

  let s = "";
  if (whole >= 4000) {
    const hi = Math.floor(whole / 1000);
    s += `<span class="vinc">${intToRoman(hi)}</span>` + intToRoman(whole % 1000);
  } else {
    s += intToRoman(whole);
  }
  if (frac >= 6) s += "S";
  s += "·".repeat(frac % 6);

  return (neg ? "−" : "") + s;
}

function compute(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
  return NaN;
}

function inRange(x) {
  return Number.isFinite(x) && Math.round(Math.abs(x) * 12) < (MAX + 1) * 12;
}

/* ---------- Calculator state ---------- */

const state = {
  acc: null,    // left operand
  op: null,     // pending operator
  entry: "",    // numeral being typed
  shown: null,  // number shown when nothing is being typed
  fresh: false, // just pressed "="
  err: false,
};

function reset() {
  Object.assign(state, { acc: null, op: null, entry: "", shown: null, fresh: false, err: false });
}

function current() {
  return state.entry ? parseRoman(state.entry) : (state.shown ?? 0);
}

function fail() {
  reset();
  state.err = true;
}

function inputDigit(ch) {
  if (state.err) reset();
  if (state.fresh) { reset(); }
  if (state.entry === "N") return;
  if (ch === "N") { if (state.entry === "") state.entry = "N"; return; }
  const next = state.entry + ch;
  if (isValidEntry(next)) state.entry = next;
  else flashInvalid();
}

function inputOp(op) {
  if (state.err) return;
  if (state.entry && state.op && state.acc !== null) {
    const r = compute(state.acc, state.op, current());
    if (!inRange(r)) return fail();
    state.acc = r;
  } else if (state.entry || state.acc === null) {
    state.acc = current();
  }
  state.op = op;
  state.entry = "";
  state.shown = state.acc;
  state.fresh = false;
}

function equals() {
  if (state.err || state.op === null || state.acc === null) return;
  const r = compute(state.acc, state.op, current());
  if (!inRange(r)) return fail();
  Object.assign(state, { acc: null, op: null, entry: "", shown: r, fresh: true });
}

function backspace() {
  if (state.err) return reset();
  if (state.fresh) return;
  state.entry = state.entry.slice(0, -1);
}

/* ---------- UI ---------- */

if (typeof document !== "undefined") {
  const exprEl = document.getElementById("expr");
  const valueEl = document.getElementById("value");
  const opButtons = [...document.querySelectorAll("[data-op]")];

  window.flashInvalid = () => {
    valueEl.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" },
       { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
      { duration: 180 }
    );
  };

  function render() {
    exprEl.innerHTML = state.acc !== null && state.op
      ? `${toRomanHTML(state.acc)} ${state.op}`
      : "";

    let html;
    if (state.err) html = "∞";
    else if (state.entry) html = state.entry;
    else if (state.shown !== null) html = toRomanHTML(state.shown);
    else html = "N";

    valueEl.innerHTML = html;
    valueEl.classList.toggle("err", state.err);
    valueEl.classList.toggle("long", valueEl.textContent.length > 12);

    opButtons.forEach(b =>
      b.classList.toggle("active", !state.entry && state.op === b.dataset.op));
  }

  function handle(btn) {
    if (btn.dataset.d) inputDigit(btn.dataset.d);
    else if (btn.dataset.op) inputOp(btn.dataset.op);
    else if (btn.dataset.fn === "eq") equals();
    else if (btn.dataset.fn === "clear") reset();
    else if (btn.dataset.fn === "back") backspace();
    render();
  }

  document.querySelector(".keys").addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (btn) handle(btn);
  });

  const KEYMAP = {
    m: '[data-d="M"]', d: '[data-d="D"]', c: '[data-d="C"]', l: '[data-d="L"]',
    x: '[data-d="X"]', v: '[data-d="V"]', i: '[data-d="I"]', s: '[data-d="S"]',
    n: '[data-d="N"]', ".": '[data-d="·"]', ",": '[data-d="·"]',
    "+": '[data-op="+"]', "-": '[data-op="−"]', "*": '[data-op="×"]', "/": '[data-op="÷"]',
    Enter: '[data-fn="eq"]', "=": '[data-fn="eq"]',
    Backspace: '[data-fn="back"]', Escape: '[data-fn="clear"]', Delete: '[data-fn="clear"]',
  };

  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const sel = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase()];
    if (!sel) return;
    e.preventDefault();
    const btn = document.querySelector(sel);
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 100);
    handle(btn);
  });

  render();
} else {
  globalThis.flashInvalid = () => {};
  module.exports = { intToRoman, toRomanHTML, parseRoman, isValidEntry, state, reset, inputDigit, inputOp, equals };
}
