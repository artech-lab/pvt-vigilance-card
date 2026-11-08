// End-to-end test in a real browser engine, with a simulated Home Assistant.
// Requires the dev dependencies:  npm install && npx playwright install chromium
// Run with:  npm run test:e2e   (about 45 seconds: two short tests, the import and the editor)
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const CARD = fileURLToPath(new URL("../dist/pvt-vigilance-card.js", import.meta.url));

const STUBS = `
<style>body{margin:0;padding:16px;background:#111;font-family:sans-serif;
  --primary-color:#03a9f4;--primary-text-color:#e1e1e1;--secondary-text-color:#9b9b9b;
  --card-background-color:#1c1c1c;--divider-color:rgba(225,225,225,.12);}
  #host{width:420px}</style>
<div id="host"></div>
<script>
customElements.define("ha-card", class extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:"open"}).innerHTML =
    '<style>:host{display:block;background:var(--card-background-color);border-radius:12px;color:var(--primary-text-color)}</style><slot></slot>'; }
});
customElements.define("ha-icon", class extends HTMLElement {});
customElements.define("ha-form", class extends HTMLElement {});
/* simulated Home Assistant for the "Create helpers" button */
window.makeHelperHass = function (lang, admin) {
  const log = { ws: [], api: [] }, registry = [];
  let flows = 0;
  const slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); };
  window.__hlog = log;
  return {
    language: lang, locale: { language: lang }, states: {}, user: { is_admin: admin },
    callWS: async function (msg) {
      log.ws.push(msg.type);
      await new Promise(function (r) { setTimeout(r, 5); });
      if (msg.type === "config/entity_registry/list") return registry;
      const d = msg.type.split("/")[0];
      registry.push({ entity_id: d + "." + slug(msg.name), platform: d, unique_id: slug(msg.name) });
      return { id: slug(msg.name) };
    },
    callApi: async function (method, path, data) {
      log.api.push(path);
      await new Promise(function (r) { setTimeout(r, 5); });
      if (path === "config/config_entries/flow") { flows += 1; return { type: "menu", flow_id: "f" + flows }; }
      if (data.next_step_id) return { type: "form", flow_id: path.split("/").pop() };
      registry.push({ entity_id: "sensor." + slug(data.name), platform: "template", config_entry_id: "e" + flows });
      return { type: "create_entry", result: { entry_id: "e" + flows } };
    }
  };
};
window.mountEditor = function (config, hass) {
  const ed = document.createElement("pvt-vigilance-card-editor");
  ed._hpWait = 1;
  window.__configs = [];
  ed.addEventListener("config-changed", function (ev) { window.__configs.push(ev.detail.config); });
  ed.setConfig(config);
  ed.hass = hass;
  document.getElementById("host").innerHTML = "";
  document.getElementById("host").appendChild(ed);
  window.editor = ed;
  return ed;
};
window.makeHass = function (lang, states, store, stats) {
  const log = { ws: [], services: [] };
  window.__log = log;
  window.__store = store;
  return {
    language: lang, locale: { language: lang }, states: states, user: { is_admin: true },
    callWS: async function (msg) {
      log.ws.push(JSON.parse(JSON.stringify(msg)));
      await new Promise(function (r) { setTimeout(r, 5); });
      if (msg.type === "frontend/get_user_data") return { value: window.__store };
      if (msg.type === "frontend/set_user_data") { window.__store = JSON.parse(JSON.stringify(msg.value)); return null; }
      if (msg.type === "recorder/statistics_during_period") return stats || {};
      if (msg.type === "history/history_during_period") return {};
      throw new Error("unexpected " + msg.type);
    },
    callService: async function (domain, service, data) {
      const rec = { call: domain + "." + service, entity: data.entity_id, at: performance.now() };
      log.services.push(rec);
      await new Promise(function (r) { setTimeout(r, 15); });
      rec.done = performance.now();
    }
  };
};
window.mount = function (config, hass) {
  const card = document.createElement("pvt-vigilance-card");
  card.setConfig(Object.assign({ type: "custom:pvt-vigilance-card" }, config));
  document.getElementById("host").innerHTML = "";
  document.getElementById("host").appendChild(card);
  card.hass = hass;
  window.card = card;
  return card;
};
/* simulated participant: answers each stimulus after delayMs, with an optional false start */
window.participant = function (delayMs, mode, falseStartAtWait) {
  return new Promise(function (resolve) {
    const card = window.card;
    const arena = card.shadowRoot.getElementById("arena");
    let lastStim = null, waits = 0, inWait = false;
    const fire = function () {
      if (mode === "keyboard") arena.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, composed: true }));
      else arena.dispatchEvent(new PointerEvent("pointerdown", { pointerType: mode, button: 0, bubbles: true, composed: true }));
    };
    const tick = function () {
      if (card._phase === "done" || card._phase === "idle") { resolve(card._phase); return; }
      if (card._phase === "wait" && !inWait) {
        inWait = true; waits += 1;
        if (waits === falseStartAtWait) setTimeout(fire, 100);
      }
      if (card._phase !== "wait") inWait = false;
      if (card._phase === "stim" && card._stimT !== lastStim) {
        lastStim = card._stimT;
        setTimeout(fire, delayMs);
      }
      setTimeout(tick, 4);
    };
    tick();
  });
};
</script>`;

const ENTITIES = {
  "input_number.s": { state: "0" }, "input_number.m": { state: "0" }, "input_number.b": { state: "0" },
  "input_number.w": { state: "0" }, "input_number.l": { state: "0" }, "input_number.f": { state: "0" },
  "input_datetime.d": { state: "2026-01-01 08:00:00" }, "counter.c": { state: "0" }
};
const HELPERS = {
  score_entity: "input_number.s", mean_entity: "input_number.m", best_entity: "input_number.b",
  worst_entity: "input_number.w", lapses_entity: "input_number.l", false_entity: "input_number.f",
  last_entity: "input_datetime.d", count_entity: "counter.c"
};
const shadowText = (page, id) => page.evaluate((i) => {
  const el = window.card.shadowRoot.getElementById(i); return el ? el.textContent : null;
}, id);

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => { console.error("PAGE ERROR:", e.message); process.exitCode = 1; });
await page.setContent("<!doctype html><html><body>" + STUBS + "</body></html>");
await page.addScriptTag({ path: CARD });

/* 1. full test with a mouse, one false start, helpers mirrored */
await page.evaluate(([states, helpers]) => {
  window.mount(Object.assign({ duration: 30, isi_min: 1, isi_max: 1.5, warmup: 1 }, helpers),
    window.makeHass("en", states, null));
}, [ENTITIES, HELPERS]);
await page.waitForFunction(() => window.card._store !== undefined && window.card._store !== null);
assert.equal(await shadowText(page, "hchip"), "To do today");
await page.evaluate(() => window.card.shadowRoot.getElementById("startbtn").click());
const end1 = await page.evaluate(() => window.participant(250, "mouse", 4));
assert.equal(end1, "done");
await page.waitForFunction(() => window.__store && window.__store.tests && window.__store.tests.length === 1, null, { timeout: 5000 });
await page.waitForFunction(() => window.__log.services.some((s) => s.call === "input_datetime.set_datetime"), null, { timeout: 5000 });
const r1 = await page.evaluate(() => ({ store: window.__store, services: window.__log.services, saved: window.card.shadowRoot.getElementById("dsavedtxt").textContent }));
const e = r1.store.tests[0];
console.log("test 1 entry:", JSON.stringify(e));
assert.ok(e[1] >= 240 && e[1] <= 290, "mean reaction time close to the simulated 250 ms, got " + e[1]);
assert.ok(e[2] <= e[1] && e[3] >= e[1], "best <= mean <= worst");
assert.equal(e[6], 1, "one false start");
assert.equal(e[8], "mouse");
assert.ok(e[4] >= 80 && e[4] < 100, "score penalised by the false start, got " + e[4]);
assert.equal(r1.saved, "Saved to your history");
const order = r1.services.map((s) => s.call);
const iCounter = order.indexOf("counter.increment"), iDate = order.indexOf("input_datetime.set_datetime");
assert.equal(order.filter((c) => c === "input_number.set_value").length, 6);
assert.ok(order.lastIndexOf("input_number.set_value") < iCounter && iCounter < iDate, "write order values -> counter -> date");
const numbersDone = Math.max(...r1.services.filter((s) => s.call === "input_number.set_value").map((s) => s.done));
assert.ok(r1.services[iCounter].at >= numbersDone, "counter written after the values were stored");
await page.evaluate(() => window.card.shadowRoot.getElementById("closebtn").click());
assert.equal(await shadowText(page, "hchip"), "Done today");
assert.ok(await page.evaluate(() => !!window.card.shadowRoot.querySelector("#hdays svg")), "7-day chart rendered");
console.log("test 1 OK: timing, score, store, write order, history");

/* 2. keyboard answers, then the page is hidden: the test must be interrupted */
await page.evaluate(() => window.mount({ duration: 30, isi_min: 1, isi_max: 1.2, warmup: 0 }, window.makeHass("en", {}, null)));
await page.waitForFunction(() => window.card._store !== null && window.card._store !== undefined);
await page.evaluate(() => { window.card.shadowRoot.getElementById("startbtn").click(); window.participant(220, "keyboard", 0); });
await page.waitForFunction(() => window.card._rts && window.card._rts.length >= 2, null, { timeout: 15000 });
const kb = await page.evaluate(() => window.card._mods.keyboard);
assert.ok(kb >= 2, "keyboard answers counted");
await page.evaluate(() => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
  document.dispatchEvent(new Event("visibilitychange"));
});
assert.equal(await page.evaluate(() => window.card._phase), "idle");
assert.match(await shadowText(page, "ilast"), /interrupted/);
await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); });
assert.equal(await page.evaluate(() => window.__store), null, "an interrupted test is not saved");
console.log("test 2 OK: keyboard input, interruption on hidden page");

/* 3. Italian UI and one-time import of a history recorded in helpers (synthetic data) */
const H = 3600000, t0 = Date.UTC(2026, 0, 12, 9), t1 = Date.UTC(2026, 0, 13, 15);
const stats = {
  "sensor.sm": [{ start: t0, end: t0 + H, mean: 310, min: 310, max: 310 }, { start: t1, end: t1 + H, mean: 300, min: 300, max: 300 }],
  "sensor.sb": [{ start: t0, end: t0 + H, mean: 270, min: 270, max: 270 }, { start: t1, end: t1 + H, mean: 262, min: 262, max: 262 }],
  "sensor.sw": [{ start: t0, end: t0 + H, mean: 360, min: 360, max: 360 }, { start: t1, end: t1 + H, mean: 355, min: 355, max: 355 }],
  "sensor.sc": [{ start: t0, end: t0 + H, mean: 1, min: 1, max: 1 }, { start: t1, end: t1 + H, mean: 2, min: 2, max: 2 }]
};
await page.evaluate((st) => window.mount({
  stat_mean_entity: "sensor.sm", stat_best_entity: "sensor.sb", stat_worst_entity: "sensor.sw", stat_count_entity: "sensor.sc"
}, window.makeHass("it", {}, null, st)), stats);
await page.waitForFunction(() => window.__store && window.__store.migrated === true, null, { timeout: 5000 });
const r3 = await page.evaluate(() => ({ store: window.__store, note: window.card.shadowRoot.getElementById("hnote").textContent,
  head: window.card.shadowRoot.querySelector(".hhead span").textContent, start: window.card.shadowRoot.getElementById("startlbl").textContent }));
assert.equal(r3.store.tests.length, 2);
assert.equal(r3.store.imported, 2);
assert.equal(r3.head, "Storico");
assert.equal(r3.start, "Inizia il test");
assert.match(r3.note, /2 test dal .* 2 importati dagli helper$/);
console.log("test 3 OK: Italian UI, import from helpers (" + r3.note + ")");

/* 4. visual editor: one-click creation of the helpers */
const hp = (sel) => page.evaluate((q) => { const el = window.editor.querySelector(q); return el ? { text: el.textContent, hidden: el.hidden } : null; }, sel);
await page.evaluate(() => window.mountEditor({ type: "custom:pvt-vigilance-card", duration: 120 }, window.makeHelperHass("en", true)));
await page.waitForFunction(() => window.editor.querySelector(".pvt-hp button"), null, { timeout: 5000 });
assert.equal((await hp(".pvt-hp-s")).text, "0 of 12 helpers linked");
assert.equal((await hp(".pvt-hp button")).text, "Create helpers");
await page.evaluate(() => window.editor.querySelector(".pvt-hp button").click());
assert.equal((await hp(".pvt-hp button")).text, "Creating helpers...");
await page.waitForFunction(() => /^Done:/.test(window.editor.querySelector(".pvt-hp-s").textContent), null, { timeout: 15000 });
const r4 = await page.evaluate(() => ({ status: window.editor.querySelector(".pvt-hp-s").textContent, configs: window.__configs, log: window.__hlog }));
assert.match(r4.status, /^Done: 13 created, 0 already present\./);
assert.equal(r4.configs.length, 1);
const cfg4 = r4.configs[0];
assert.equal(cfg4.duration, 120, "existing options are kept");
for (const k of ["score_entity", "mean_entity", "best_entity", "worst_entity", "lapses_entity", "false_entity", "last_entity",
  "count_entity", "stat_mean_entity", "stat_best_entity", "stat_worst_entity", "stat_count_entity"]) assert.ok(cfg4[k], "linked " + k);
assert.equal(cfg4.last_entity, "input_datetime.pvt_b_last_test");
assert.equal(cfg4.stat_mean_entity, "sensor.pvt_b_history_mean_time");
assert.equal(r4.log.ws.filter((t) => /\/create$/.test(t)).length, 8);
assert.equal(r4.log.api.filter((p) => p === "config/config_entries/flow").length, 5);
/* a user who is not an administrator sees no button */
await page.evaluate(() => window.mountEditor({ type: "custom:pvt-vigilance-card" }, window.makeHelperHass("it", false)));
await page.waitForFunction(() => window.editor.querySelector(".pvt-hp button"), null, { timeout: 5000 });
assert.equal((await hp(".pvt-hp button")).hidden, true);
assert.equal((await hp(".pvt-hp-s")).text, "Solo un amministratore pu\u00f2 creare gli helper.");
assert.equal((await hp(".pvt-hp-t")).text, "Helper per automazioni e backup");
console.log("test 4 OK: editor button creates and links 13 helpers; hidden for non-administrators");

await browser.close();
console.log(process.exitCode ? "E2E FAILED" : "ALL E2E TESTS PASSED");
