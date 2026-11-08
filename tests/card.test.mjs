// Unit tests for the pure logic of the card. Run with: npm test
// The card file is loaded in a sandbox with minimal DOM stubs, then its
// top-level functions are exercised directly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

process.env.TZ = "UTC";

const src = readFileSync(new URL("../dist/pvt-vigilance-card.js", import.meta.url), "utf8");
const ctx = {
  console: { info() {}, warn() {}, log() {} },
  HTMLElement: class {},
  customElements: { get: () => undefined, define() {} },
  window: {},
  navigator: { language: "en-US" },
  document: {},
  setTimeout
};
vm.createContext(ctx);
vm.runInContext(
  src + "\n;globalThis.__api = { PVT_I18N, PVT_DEFAULTS, PVT_STORE_MAX, pvtLang, pvtT, pvtPlural," +
  " pvtComputeResult, pvtBands, pvtStoreMerge, pvtStoreNormalize, pvtEntryToEvent, pvtEventToEntry," +
  " pvtAgg, pvtBucket, pvtImportEvents, pvtChartSvg, pvtParseLocal, pvtEditorSchema," +
  " PVT_INPUT_HELPERS, PVT_TEMPLATE_HELPERS, PVT_HELPER_KEYS, pvtSlug, pvtTemplateState, pvtCreateHelpers };",
  ctx
);
const api = ctx.__api;

test("the card registers itself in the card picker", () => {
  assert.equal(ctx.window.customCards.length, 1);
  assert.equal(ctx.window.customCards[0].type, "pvt-vigilance-card");
});

test("source file is plain ASCII", () => {
  assert.ok(/^[\x00-\x7F]*$/.test(src));
});

test("every language has exactly the keys of the English dictionary", () => {
  const en = Object.keys(api.PVT_I18N.en).sort();
  assert.ok(Object.keys(api.PVT_I18N).includes("it"));
  for (const lang of Object.keys(api.PVT_I18N)) {
    assert.deepEqual(Object.keys(api.PVT_I18N[lang]).sort(), en, "keys of '" + lang + "' differ from 'en'");
    for (const k of en) {
      const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join();
      assert.equal(ph(api.PVT_I18N[lang][k]), ph(api.PVT_I18N.en[k]), "placeholders of '" + lang + "." + k + "'");
    }
  }
});

test("language follows Home Assistant, then the browser, then English", () => {
  assert.equal(api.pvtLang({ locale: { language: "it" } }), "it");
  assert.equal(api.pvtLang({ locale: { language: "it-IT" } }), "it");
  assert.equal(api.pvtLang({ language: "it_CH" }), "it");
  assert.equal(api.pvtLang({ locale: { language: "de" } }), "en");
  assert.equal(api.pvtLang(null), "en");
});

test("translation with placeholders, plurals and fallback", () => {
  assert.equal(api.pvtT("it", "last_test", { when: "oggi" }), "Ultimo test: oggi");
  assert.equal(api.pvtPlural("en", "tests", 1), "1 test");
  assert.equal(api.pvtPlural("en", "tests", 3), "3 tests");
  assert.equal(api.pvtPlural("it", "stimuli", 1), "1 stimolo");
  assert.equal(api.pvtPlural("it", "stimuli", 2), "2 stimoli");
  assert.equal(api.pvtT("xx", "start"), "Start test");
  assert.equal(api.pvtT("it", "no_such_key"), "no_such_key");
});

test("result: mean, best, worst and score", () => {
  const r = api.pvtComputeResult([250, 300, 400], 1, 1, 40, 1);
  assert.equal(r.mean, 317);
  assert.equal(r.best, 250);
  assert.equal(r.worst, 400);
  // 100 * (1 - 2 / 41) = 95.1
  assert.equal(r.score, 95);
  const none = api.pvtComputeResult([], 40, 0, 40, 0);
  assert.equal(none.mean, null);
  assert.equal(none.score, 0);
});

test("time-of-day bands follow the configuration", () => {
  const def = api.pvtBands({});
  assert.equal(def.length, 7);
  assert.deepEqual(JSON.parse(JSON.stringify(def[0])), { from: 7, to: 9 });
  assert.deepEqual(JSON.parse(JSON.stringify(def[6])), { from: 19, to: 21 });
  const odd = api.pvtBands({ band_start: 6, band_end: 23, band_size: 3 });
  assert.deepEqual(JSON.parse(JSON.stringify(odd[odd.length - 1])), { from: 21, to: 23 });
  const bad = api.pvtBands({ band_start: 20, band_end: 3, band_size: 0 });
  assert.ok(bad.length >= 1 && bad[0].from === 20);
});

test("store: normalization, merge, de-duplication and cap", () => {
  const s = api.pvtStoreNormalize({ tests: [[2, 300, 280, 330, 90, 0, 0, 1, "t"], "junk", [1, 0], [1, 310, 300, 320, 95, 0, 0, 1, "m"]] });
  assert.equal(s.tests.length, 2);
  assert.equal(s.tests[0][0], 1);
  assert.equal(api.pvtStoreNormalize(null).tests.length, 0);
  const merged = api.pvtStoreMerge(s.tests, [[2, 305, 280, 330, 91, 0, 0, 1, "t"]]);
  assert.equal(merged.length, 2);
  assert.equal(merged[1][1], 305);
  const many = [];
  for (let i = 1; i <= api.PVT_STORE_MAX + 10; i++) many.push([i, 300, 280, 320, 90, 0, 0, 1, ""]);
  const capped = api.pvtStoreMerge(many, []);
  assert.equal(capped.length, api.PVT_STORE_MAX);
  assert.equal(capped[0][0], 11);
});

test("bucketing: last 7 days, bands, outside count and weighted mean", () => {
  const now = new Date(2026, 10, 8, 20, 0, 0);
  const at = (d, h, m) => new Date(2026, 10, d, h, m).getTime();
  const tests = [
    [at(8, 8, 30), 300, 250, 350, 95, 0, 0, 1, "t"],
    [at(8, 18, 0), 280, 240, 330, 97, 0, 0, 1, "t"],
    [at(6, 22, 30), 340, 290, 420, 85, 1, 0, 1, "t"],
    [at(1, 10, 0), 320, 260, 400, 90, 0, 0, 2, ""]
  ];
  const b = api.pvtBucket(tests.map(api.pvtEntryToEvent), {}, now);
  assert.equal(b.days.length, 7);
  assert.equal(b.days[6].today, true);
  assert.equal(b.days[6].agg.n, 2);
  assert.equal(b.days[6].agg.mean, 290);
  assert.equal(b.days[4].agg.n, 1);
  assert.equal(b.outside, 1); // 22:30 is outside 7-21
  assert.equal(b.all.n, 5);
  assert.equal(b.all.low, 240);
  assert.equal(b.all.high, 420);
  const band8 = b.bands.find((x) => x.from === 7);
  assert.equal(band8.agg.n, 1);
  const band9 = b.bands.find((x) => x.from === 9);
  assert.equal(band9.agg.n, 2); // weighted imported entry
});

test("import from helpers: hour boundaries, restarts and live test", () => {
  // Synthetic data (TZ is UTC, so the input_datetime strings are in UTC too).
  const ids = { smean: "s.m", sbest: "s.b", sworst: "s.w", scount: "s.c", last: "dt", mean: "n.m", best: "n.b", worst: "n.w" };
  const Z = (s) => Date.parse(s);
  const row = (start, mean, min, max) => ({ start: Z(start), end: Z(start) + 3600000, mean, min, max });
  const stats = {
    "s.m": [row("2026-01-12T09:00:00Z", 310, 310, 310), row("2026-01-13T15:00:00Z", 300, 300, 300),
      row("2026-01-14T10:00:00Z", 315, 315, 315), row("2026-01-14T11:00:00Z", 315, 315, 315), // hour boundary
      row("2026-01-14T17:00:00Z", 285, 280, 290)],                                          // two tests
    "s.b": [row("2026-01-12T09:00:00Z", 270, 270, 270), row("2026-01-13T15:00:00Z", 262, 262, 262),
      row("2026-01-14T10:00:00Z", 255, 255, 255), row("2026-01-14T11:00:00Z", 255, 255, 255),
      row("2026-01-14T17:00:00Z", 241, 238, 244)],
    "s.w": [row("2026-01-12T09:00:00Z", 360, 360, 360), row("2026-01-13T15:00:00Z", 355, 355, 355),
      row("2026-01-14T10:00:00Z", 400, 400, 400), row("2026-01-14T11:00:00Z", 400, 400, 400),
      row("2026-01-14T17:00:00Z", 390, 370, 410)],
    "s.c": [row("2026-01-12T09:00:00Z", 1, 1, 1), row("2026-01-13T15:00:00Z", 2, 2, 2),
      row("2026-01-14T10:00:00Z", 3, 3, 3), row("2026-01-14T11:00:00Z", 3, 3, 3),
      row("2026-01-14T17:00:00Z", 4.5, 4, 5)]
  };
  const lu = (s) => Z(s) / 1000;
  // raw window starts after the first test; a restart restores the same values
  const raw = {
    dt: [{ s: "2026-01-13 15:20:10", lu: lu("2026-01-13T06:00:00Z") },
      { s: "unavailable", lu: lu("2026-01-14T03:00:30Z") },
      { s: "2026-01-13 15:20:10", lu: lu("2026-01-14T03:01:55Z") }],
    "n.m": [{ s: "300.0", lu: lu("2026-01-13T06:00:00Z") }, { s: "unavailable", lu: lu("2026-01-14T03:00:30Z") },
      { s: "300.0", lu: lu("2026-01-14T03:01:53Z") }],
    "n.b": [{ s: "262.0", lu: lu("2026-01-13T06:00:00Z") }],
    "n.w": [{ s: "355.0", lu: lu("2026-01-13T06:00:00Z") }]
  };
  const live = { s: "2026-01-14 20:30:00", mean: 290, best: 252, worst: 335 }; // not yet in the recorder
  const ev = api.pvtImportEvents(stats, raw, live, ids);
  const all = api.pvtAgg(ev);
  assert.equal(all.n, 6);
  assert.equal(ev.filter((e) => e.mean === 315).length, 1, "hour-boundary row discarded");
  assert.equal(ev.filter((e) => e.mean === 300).length, 1, "restart does not duplicate a test");
  assert.equal(all.low, 238);
  assert.equal(all.high, 410);
  assert.equal(api.pvtAgg(api.pvtImportEvents(stats, null, null, ids)).n, 5);
  assert.equal(api.pvtAgg(api.pvtImportEvents(null, raw, live, ids)).n, 2);
  assert.equal(api.pvtAgg(api.pvtImportEvents(null, null, null, ids)).n, 0);
  const entries = ev.map(api.pvtEventToEntry);
  assert.equal(api.pvtStoreMerge(entries, []).length, ev.length);
});

test("chart: empty data gives no chart, data gives an SVG", () => {
  assert.equal(api.pvtChartSvg([{ label: "a", mean: null, low: null, high: null }]), null);
  const svg = api.pvtChartSvg([{ label: "a", mean: 300, low: 250, high: 380, sub: "2 tests" }, { label: "b", mean: 310, low: 300, high: 320 }]);
  assert.match(svg, /^<svg /);
  assert.match(svg, /polyline/);
  assert.match(svg, /2 tests/);
});

test("editor schema is localized and covers every option", () => {
  const names = [];
  const walk = (list) => list.forEach((s) => (s.schema ? walk(s.schema) : names.push(s.name)));
  walk(api.pvtEditorSchema("it"));
  for (const k of Object.keys(api.PVT_DEFAULTS)) assert.ok(names.includes(k), "missing editor field " + k);
  for (const k of api.PVT_HELPER_KEYS) assert.ok(names.includes(k), "missing editor field " + k);
  const it = api.pvtEditorSchema("it");
  assert.equal(it.find((s) => s.name === "g_history").title, "Storico");
});

/* ---------- one-click helpers ---------- */

const plain = (o) => JSON.parse(JSON.stringify(o));
/* simulated Home Assistant for helper creation */
function helperHass(lang, states, opts = {}) {
  const log = { ws: [], api: [] };
  const registry = [];
  let flows = 0, entries = 0;
  return {
    log, registry,
    language: lang, locale: { language: lang }, states: states || {}, user: { is_admin: true },
    async callWS(msg) {
      log.ws.push(plain(msg));
      if (msg.type === "config/entity_registry/list") return registry;
      const m = /^(input_number|input_datetime|counter)\/create$/.exec(msg.type);
      if (!m) throw new Error("unexpected " + msg.type);
      const id = api.pvtSlug(msg.name);
      /* the entity id may differ from domain.id (e.g. a name already used): resolved via the registry */
      const eid = m[1] + "." + id + (opts.suffix && opts.suffix[id] ? opts.suffix[id] : "");
      registry.push({ entity_id: eid, platform: m[1], unique_id: id });
      return Object.assign({ id }, msg);
    },
    async callApi(method, path, data) {
      log.api.push({ method, path, data: plain(data) });
      if (path === "config/config_entries/flow") { flows += 1; return { type: "menu", flow_id: "f" + flows, step_id: "user" }; }
      if (data.next_step_id === "sensor") return { type: "form", flow_id: path.split("/").pop(), step_id: "sensor" };
      if (opts.failTemplate) return { type: "form", errors: { state: "invalid_template" } };
      entries += 1;
      registry.push({ entity_id: "sensor." + api.pvtSlug(data.name), platform: "template", config_entry_id: "e" + entries });
      return { type: "create_entry", result: { entry_id: "e" + entries } };
    }
  };
}

test("helper names are fixed English strings with distinct object ids", () => {
  assert.equal(api.pvtSlug("PVT-B Mean time"), "pvt_b_mean_time");
  assert.equal(api.pvtSlug("  PVT-B  False starts! "), "pvt_b_false_starts");
  const specs = api.PVT_INPUT_HELPERS.concat(api.PVT_TEMPLATE_HELPERS);
  for (const sp of specs) assert.ok(/^PVT-B [A-Za-z ]+$/.test(sp.name), "plain English name: " + sp.name);
  const ids = specs.map((sp) => api.pvtSlug(sp.name));
  assert.equal(new Set(ids).size, ids.length, "helper names must be distinct");
  for (const lang of Object.keys(api.PVT_I18N)) {
    assert.ok(!Object.keys(api.PVT_I18N[lang]).some((k) => /^hn_/.test(k)), "helper names are not translated");
  }
});

test("statistics templates: value only right after a test", () => {
  const ids = { score: "input_number.s", mean: "input_number.m", best: "input_number.b", worst: "input_number.w",
    last: "input_datetime.d", count: "counter.c" };
  const mean = api.pvtTemplateState("mean", ids);
  assert.match(mean, /states\('input_number\.m'\)/);
  assert.match(mean, /state_attr\('input_datetime\.d', 'timestamp'\)/);
  assert.match(mean, /< 90 else none \}\}$/);
  assert.match(api.pvtTemplateState("worst", ids), /input_number\.w/);
  assert.match(api.pvtTemplateState("count", ids), /states\('counter\.c'\) \| int\(0\)/);
  assert.match(api.pvtTemplateState("today", ids), /input_number\.s.*input_datetime\.d.*strftime/);
});

test("create helpers: fresh install links every option, English names in every language", async () => {
  const hass = helperHass("it", {}, { suffix: { pvt_b_mean_time: "_2" } });
  const r = await api.pvtCreateHelpers(hass, { type: "custom:pvt-vigilance-card", title: "X" }, 0);
  assert.equal(r.error, null);
  assert.equal(r.created, 13);
  assert.equal(r.reused, 0);
  assert.equal(r.config.title, "X", "other options are kept");
  for (const k of api.PVT_HELPER_KEYS) assert.ok(r.config[k], "linked " + k);
  assert.equal(r.config.mean_entity, "input_number.pvt_b_mean_time_2", "entity id taken from the registry");
  assert.equal(r.config.count_entity, "counter.pvt_b_tests");
  assert.equal(r.config.last_entity, "input_datetime.pvt_b_last_test");
  assert.equal(r.config.stat_count_entity, "sensor.pvt_b_history_test_count");
  const score = hass.log.ws.find((m) => m.type === "input_number/create" && m.name === "PVT-B Score");
  assert.equal(score.unit_of_measurement, "points");
  const flows = hass.log.api.filter((c) => c.data && c.data.state);
  assert.equal(flows.length, 5);
  for (const f of flows) assert.equal(f.data.state_class, "measurement");
  const statMean = flows.find((f) => f.data.name === "PVT-B History mean time");
  assert.match(statMean.data.state, /input_number\.pvt_b_mean_time_2/);
  assert.equal(flows.find((f) => f.data.name === "PVT-B History test count").data.unit_of_measurement, "tests");
  assert.ok(flows.some((f) => f.data.name === "PVT-B Score today"));
});

test("create helpers: existing helpers are reused, nothing is created twice", async () => {
  const first = helperHass("en", {});
  const r1 = await api.pvtCreateHelpers(first, {}, 0);
  const states = {};
  for (const e of first.registry) states[e.entity_id] = { state: "0" };
  /* a card without links finds the helpers by name */
  const second = helperHass("en", states);
  const r2 = await api.pvtCreateHelpers(second, {}, 0);
  assert.equal(r2.created, 0);
  assert.equal(r2.reused, 13);
  assert.equal(second.log.ws.length + second.log.api.length, 0);
  for (const k of api.PVT_HELPER_KEYS) assert.equal(r2.config[k], r1.config[k]);
  /* helpers created by hand with other names stay linked */
  const third = helperHass("en", { "input_number.my_score": { state: "1" } });
  const r3 = await api.pvtCreateHelpers(third, { score_entity: "input_number.my_score" }, 0);
  assert.equal(r3.config.score_entity, "input_number.my_score");
  assert.equal(r3.created, 11, "no score today sensor for a score helper made by hand");
});

test("create helpers: a failure keeps what was already created", async () => {
  const hass = helperHass("en", {}, { failTemplate: true });
  const r = await api.pvtCreateHelpers(hass, {}, 0);
  assert.match(r.error, /invalid_template/);
  assert.equal(r.created, 8);
  assert.equal(r.config.last_entity, "input_datetime.pvt_b_last_test");
  assert.equal(r.config.stat_mean_entity, undefined);
});

test("the YAML package and full.yaml match what the button creates", () => {
  const pkg = readFileSync(new URL("../examples/packages/pvt_vigilance.yaml", import.meta.url), "utf8");
  const full = readFileSync(new URL("../examples/full.yaml", import.meta.url), "utf8");
  const ids = {};
  for (const sp of api.PVT_INPUT_HELPERS) {
    const id = api.pvtSlug(sp.name);
    ids[sp.key.replace("_entity", "")] = sp.domain + "." + id;
    assert.ok(pkg.includes("\n  " + id + ":\n    name: " + sp.name + "\n"), "package defines " + sp.domain + "." + id);
    assert.ok(full.includes(sp.key + ": " + sp.domain + "." + id + "\n"), "full.yaml links " + sp.key);
  }
  const tids = { score: ids.score, mean: ids.mean, best: ids.best, worst: ids.worst, last: ids.last, count: ids.count };
  for (const sp of api.PVT_TEMPLATE_HELPERS) {
    const block = "      - name: " + sp.name + "\n";
    const at = pkg.indexOf(block);
    assert.ok(at > 0, "package defines sensor " + sp.name);
    const state = /\n        state: "(.*)"\n/.exec(pkg.slice(at)) [1];
    assert.equal(state, api.pvtTemplateState(sp.kind, tids), "template of " + sp.name);
    assert.ok(new RegExp("name: " + sp.name + "\\n[^]*?unit_of_measurement: " + sp.unit + "\\n").test(pkg.slice(at)), "unit of " + sp.name);
    if (sp.key) assert.ok(full.includes(sp.key + ": sensor." + api.pvtSlug(sp.name) + "\n"), "full.yaml links " + sp.key);
  }
});
