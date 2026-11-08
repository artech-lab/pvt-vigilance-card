/*
 * PVT-B Vigilance Card for Home Assistant
 * https://github.com/artech-lab/pvt-vigilance-card
 *
 * A 3-minute brief Psychomotor Vigilance Test (PVT-B, Basner et al. 2011) that
 * runs inside a Lovelace dashboard: reaction times, lapses, false starts, a
 * 0-100 score and a persistent history (last 7 days and time-of-day profile).
 *
 * Works out of the box: the history is stored by Home Assistant through the
 * frontend user-data API, so no helpers, YAML or restarts are required.
 * Helpers are optional and only needed to use the results in automations.
 *
 * Copyright (C) 2026 The pvt-vigilance-card contributors
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version. This program is distributed in the hope that it will be
 * useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
 * Public License for more details: <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * The source is plain ASCII: non-ASCII characters are written as \u escapes.
 */

const PVT_VERSION = "1.0.0";
const PVT_TAG = "pvt-vigilance-card";
const PVT_EDITOR_TAG = PVT_TAG + "-editor";
const PVT_REPO_URL = "https://github.com/artech-lab/pvt-vigilance-card";
const PVT_STORE_KEY = "pvt_vigilance_card";
const PVT_STORE_MAX = 5000;
const PVT_HOUR = 3600000;
const PVT_DOT = "\u00b7";

const PVT_DEFAULTS = {
  icon: "mdi:lightning-bolt",
  duration: 180,
  isi_min: 1,
  isi_max: 4,
  lapse_ms: 355,
  warmup: 2,
  offset_touch: 0,
  offset_mouse: 0,
  offset_keyboard: 0,
  show_history: true,
  band_start: 7,
  band_end: 21,
  band_size: 2
};

/* ------------------------------------------------------------------ */
/* Localization                                                        */
/* ------------------------------------------------------------------ */

const PVT_I18N = {
  en: {
    title: "Vigilance \u00b7 PVT-B",
    subtitle: "reaction test \u00b7 {min} min",
    done_today: "Done today",
    todo_today: "To do today",
    points: "points",
    mean: "Mean time",
    best: "Best",
    worst: "Worst",
    lapses: "Lapses",
    false_starts: "False starts",
    last_test: "Last test: {when}",
    when_today: "today at {time}",
    when_yesterday: "yesterday at {time}",
    when_date: "{date} at {time}",
    no_test: "No test yet: measure your vigilance now.",
    start: "Start test",
    retry: "Try again (beat your score)",
    stop: "Stop",
    hint: "tap as soon as the number appears",
    arena_label: "Test area: tap, click or press Space as soon as the number appears",
    warmup_n: "warm-up {i}/{n}",
    stimuli_one: "{n} stimulus",
    stimuli_other: "{n} stimuli",
    too_early: "Too early!",
    no_response: "No response",
    warmup: "Warm-up",
    lapse: "Lapse",
    fast: "Lightning!",
    great: "Great",
    good: "Good",
    v_brilliant: "Brilliant reflexes",
    v_good: "Good vigilance",
    v_drop: "Attention dropping",
    v_tired: "Very tired: consider a break",
    saving: "Saving\u2026",
    saved: "Saved to your history",
    save_failed: "Could not save the result",
    no_valid: "No valid response: the test was not added to the history",
    interrupted: "Test interrupted because the page was hidden. Run it again in the foreground.",
    close: "Close",
    repeat: "Repeat test",
    history: "History",
    h_days: "Reaction times \u00b7 last 7 days",
    h_bands: "Reaction times \u00b7 time of day {start}-{end} \u00b7 all tests",
    legend_range: "best \u00b7 worst",
    legend_mean: "mean",
    h_summary: "mean {ms} ms \u00b7 {tests}",
    tests_one: "{n} test",
    tests_other: "{n} tests",
    h_note: "{tests} since {date}",
    h_imported: "{n} imported from helpers",
    h_outside: "{n} outside {start}-{end}, not in the time-of-day chart",
    h_empty_days: "No tests in the last 7 days.",
    h_empty_bands: "No tests between {start}:00 and {end}:00.",
    h_empty: "No tests yet: your history starts with the first test.",
    h_loading: "loading history\u2026",
    h_unavailable: "History unavailable",
    today: "today",
    mode_touch: "touch",
    mode_mouse: "mouse",
    mode_keyboard: "keyboard",
    open: "Open {entity}",
    picker_name: "PVT-B Vigilance Card",
    picker_desc: "3-minute psychomotor vigilance test (PVT-B): reaction times, lapses, score and persistent history.",
    ed_g_test: "Test",
    ed_g_history: "History",
    ed_g_helpers: "Helpers (optional)",
    ed_g_import: "Statistics sensors (optional)",
    ed_title: "Title",
    ed_icon: "Icon",
    ed_duration: "Test duration",
    ed_isi_min: "Minimum wait between stimuli",
    ed_isi_max: "Maximum wait between stimuli",
    ed_lapse_ms: "Lapse threshold",
    ed_warmup: "Warm-up stimuli (not scored)",
    ed_offset_touch: "Touch input compensation",
    ed_offset_mouse: "Mouse input compensation",
    ed_offset_keyboard: "Keyboard input compensation",
    ed_show_history: "Show history",
    ed_band_start: "Time-of-day chart: first hour",
    ed_band_end: "Time-of-day chart: last hour",
    ed_band_size: "Time-of-day chart: hours per bar",
    ed_score_entity: "Score (input_number)",
    ed_mean_entity: "Mean time (input_number)",
    ed_best_entity: "Best time (input_number)",
    ed_worst_entity: "Worst time (input_number)",
    ed_lapses_entity: "Lapses (input_number)",
    ed_false_entity: "False starts (input_number)",
    ed_last_entity: "Last test date and time (input_datetime)",
    ed_count_entity: "Test counter (counter)",
    ed_stat_mean_entity: "Statistics sensor: mean time",
    ed_stat_best_entity: "Statistics sensor: best time",
    ed_stat_worst_entity: "Statistics sensor: worst time",
    ed_stat_count_entity: "Statistics sensor: number of tests",
    edh_duration: "PVT-B standard: 180 s",
    edh_isi_min: "PVT-B standard: 1 s",
    edh_isi_max: "PVT-B standard: 4 s",
    edh_lapse_ms: "PVT-B standard: 355 ms",
    edh_warmup: "The first trials are slower and are excluded from the results",
    edh_offset_touch: "Subtracted from every touch response. Touchscreens usually add 50-80 ms compared with a mouse",
    edh_offset_mouse: "Subtracted from every mouse response",
    edh_offset_keyboard: "Subtracted from every keyboard response (Space or Enter)",
    edh_score_entity: "Results are also written to these helpers, for automations or goal cards",
    edh_stat_mean_entity: "Their long-term statistics are a permanent backup: if the history of the card is empty, it is rebuilt from them",
    ed_hp_title: "Helpers for automations and backup",
    ed_hp_desc: "Creates the helpers in one click and links them to the card. Every result also becomes available to automations, goal cards and Home Assistant graphs, and is copied to the long-term statistics, from which the card can rebuild its history.",
    ed_hp_button: "Create helpers",
    ed_hp_busy: "Creating helpers...",
    ed_hp_done: "Done: {created} created, {reused} already present. Save the card to keep the links.",
    ed_hp_fail: "Could not create every helper: {error}",
    ed_hp_admin: "Only an administrator can create helpers.",
    ed_hp_linked: "{n} of {total} helpers linked"
  },
  it: {
    title: "Vigilanza \u00b7 PVT-B",
    subtitle: "test di reazione \u00b7 {min} min",
    done_today: "Fatto oggi",
    todo_today: "Da fare oggi",
    points: "punti",
    mean: "Tempo medio",
    best: "Migliore",
    worst: "Peggiore",
    lapses: "Lapse",
    false_starts: "Falsi avvii",
    last_test: "Ultimo test: {when}",
    when_today: "oggi alle {time}",
    when_yesterday: "ieri alle {time}",
    when_date: "{date} alle {time}",
    no_test: "Nessun test registrato: misura ora la tua vigilanza.",
    start: "Inizia il test",
    retry: "Riprova (batti il punteggio)",
    stop: "Interrompi",
    hint: "tocca appena appare il numero",
    arena_label: "Area del test: tocca, clicca o premi Spazio appena appare il numero",
    warmup_n: "riscaldamento {i}/{n}",
    stimuli_one: "{n} stimolo",
    stimuli_other: "{n} stimoli",
    too_early: "Troppo presto!",
    no_response: "Nessuna risposta",
    warmup: "Riscaldamento",
    lapse: "Lapse",
    fast: "Fulmineo!",
    great: "Ottimo",
    good: "Bene",
    v_brilliant: "Riflessi brillanti",
    v_good: "Vigilanza buona",
    v_drop: "Attenzione in calo",
    v_tired: "Molto affaticato: considera una pausa",
    saving: "Salvataggio\u2026",
    saved: "Salvato nel tuo storico",
    save_failed: "Impossibile salvare il risultato",
    no_valid: "Nessuna risposta valida: il test non \u00e8 stato aggiunto allo storico",
    interrupted: "Test interrotto perch\u00e9 la pagina \u00e8 stata nascosta. Ripetilo in primo piano.",
    close: "Chiudi",
    repeat: "Ripeti il test",
    history: "Storico",
    h_days: "Tempi di reazione \u00b7 ultimi 7 giorni",
    h_bands: "Tempi di reazione \u00b7 fasce orarie {start}-{end} \u00b7 tutti i test",
    legend_range: "migliore \u00b7 peggiore",
    legend_mean: "medio",
    h_summary: "medio {ms} ms \u00b7 {tests}",
    tests_one: "{n} test",
    tests_other: "{n} test",
    h_note: "{tests} dal {date}",
    h_imported: "{n} importati dagli helper",
    h_outside: "{n} fuori fascia {start}-{end}, esclusi dal grafico orario",
    h_empty_days: "Nessun test negli ultimi 7 giorni.",
    h_empty_bands: "Nessun test tra le {start}:00 e le {end}:00.",
    h_empty: "Nessun test registrato: lo storico parte dal primo test.",
    h_loading: "caricamento storico\u2026",
    h_unavailable: "Storico non disponibile",
    today: "oggi",
    mode_touch: "touch",
    mode_mouse: "mouse",
    mode_keyboard: "tastiera",
    open: "Apri {entity}",
    picker_name: "PVT-B Vigilance Card",
    picker_desc: "Test di vigilanza psicomotoria (PVT-B) da 3 minuti: tempi di reazione, lapse, punteggio e storico persistente.",
    ed_g_test: "Test",
    ed_g_history: "Storico",
    ed_g_helpers: "Helper (facoltativi)",
    ed_g_import: "Sensori statistici (facoltativi)",
    ed_title: "Titolo",
    ed_icon: "Icona",
    ed_duration: "Durata del test",
    ed_isi_min: "Attesa minima tra gli stimoli",
    ed_isi_max: "Attesa massima tra gli stimoli",
    ed_lapse_ms: "Soglia lapse",
    ed_warmup: "Stimoli di riscaldamento (esclusi dal calcolo)",
    ed_offset_touch: "Compensazione input touch",
    ed_offset_mouse: "Compensazione input mouse",
    ed_offset_keyboard: "Compensazione input tastiera",
    ed_show_history: "Mostra lo storico",
    ed_band_start: "Grafico orario: ora iniziale",
    ed_band_end: "Grafico orario: ora finale",
    ed_band_size: "Grafico orario: ore per barra",
    ed_score_entity: "Punteggio (input_number)",
    ed_mean_entity: "Tempo medio (input_number)",
    ed_best_entity: "Tempo migliore (input_number)",
    ed_worst_entity: "Tempo peggiore (input_number)",
    ed_lapses_entity: "Lapse (input_number)",
    ed_false_entity: "Falsi avvii (input_number)",
    ed_last_entity: "Data e ora dell'ultimo test (input_datetime)",
    ed_count_entity: "Contatore dei test (counter)",
    ed_stat_mean_entity: "Sensore statistico: tempo medio",
    ed_stat_best_entity: "Sensore statistico: tempo migliore",
    ed_stat_worst_entity: "Sensore statistico: tempo peggiore",
    ed_stat_count_entity: "Sensore statistico: numero di test",
    edh_duration: "Standard PVT-B: 180 s",
    edh_isi_min: "Standard PVT-B: 1 s",
    edh_isi_max: "Standard PVT-B: 4 s",
    edh_lapse_ms: "Standard PVT-B: 355 ms",
    edh_warmup: "I primi stimoli sono pi\u00f9 lenti e vengono esclusi dai risultati",
    edh_offset_touch: "Sottratta da ogni risposta touch. Un touchscreen aggiunge di solito 50-80 ms rispetto a un mouse",
    edh_offset_mouse: "Sottratta da ogni risposta con il mouse",
    edh_offset_keyboard: "Sottratta da ogni risposta da tastiera (Spazio o Invio)",
    edh_score_entity: "I risultati vengono scritti anche in questi helper, per automazioni o card degli obiettivi",
    edh_stat_mean_entity: "Le loro statistiche a lungo termine sono un backup permanente: se lo storico della card \u00e8 vuoto, viene ricostruito da qui",
    ed_hp_title: "Helper per automazioni e backup",
    ed_hp_desc: "Crea gli helper con un clic e li collega alla card. Ogni risultato diventa disponibile anche ad automazioni, card degli obiettivi e grafici di Home Assistant, e viene copiato nelle statistiche a lungo termine, da cui la card sa ricostruire lo storico.",
    ed_hp_button: "Crea helper",
    ed_hp_busy: "Creazione degli helper...",
    ed_hp_done: "Fatto: {created} creati, {reused} gi\u00e0 presenti. Salva la card per mantenere i collegamenti.",
    ed_hp_fail: "Non \u00e8 stato possibile creare tutti gli helper: {error}",
    ed_hp_admin: "Solo un amministratore pu\u00f2 creare gli helper.",
    ed_hp_linked: "{n} helper collegati su {total}"
  }
};

/* Language of the Home Assistant UI, falling back to the browser and then English. */
function pvtLang(hass) {
  let raw = "";
  if (hass && hass.locale && hass.locale.language) raw = hass.locale.language;
  else if (hass && hass.language) raw = hass.language;
  else if (typeof navigator !== "undefined" && navigator.language) raw = navigator.language;
  const l = String(raw || "en").toLowerCase().replace("_", "-");
  if (PVT_I18N[l]) return l;
  const base = l.split("-")[0];
  return PVT_I18N[base] ? base : "en";
}
function pvtHasKey(lang, key) {
  return (PVT_I18N[lang] && PVT_I18N[lang][key] !== undefined) || PVT_I18N.en[key] !== undefined;
}
function pvtT(lang, key, vars) {
  const dict = PVT_I18N[lang] || PVT_I18N.en;
  let s = dict[key];
  if (s === undefined) s = PVT_I18N.en[key];
  if (s === undefined) s = key;
  return String(s).replace(/\{(\w+)\}/g, function (m, k) {
    return vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m;
  });
}
function pvtPlural(lang, base, n) {
  return pvtT(lang, base + (n === 1 ? "_one" : "_other"), { n: n });
}

/* ------------------------------------------------------------------ */
/* Generic helpers                                                     */
/* ------------------------------------------------------------------ */

function pvtNumState(hass, id) {
  if (!id || !hass || !hass.states) return null;
  const st = hass.states[id];
  if (!st) return null;
  const s = st.state;
  if (s === null || s === undefined || s === "unknown" || s === "unavailable" || s === "") return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}
function pvtEsc(t) {
  return String(t === undefined || t === null ? "" : t).replace(/[<>&"]/g, function (c) {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
  });
}
function pvtPad(n) { return (n < 10 ? "0" : "") + n; }
function pvtClamp(v, lo, hi, def) {
  const n = Number(v);
  if (v === null || v === undefined || v === "" || !isFinite(n)) return def;
  return Math.min(hi, Math.max(lo, n));
}
/* A plausible reaction time in ms (0 means "no data" for the helpers). */
function pvtValid(v) { return typeof v === "number" && isFinite(v) && v > 0 && v <= 5000; }
function pvtMs(v) {
  if (typeof v === "number" && isFinite(v)) return v > 1e12 ? v : v * 1000;
  if (typeof v === "string") { const p = Date.parse(v); return isNaN(p) ? null : p; }
  return null;
}
/* "YYYY-MM-DD HH:MM:SS" (input_datetime state, local time) -> epoch ms */
function pvtParseLocal(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(s || ""));
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime();
}
function pvtDayKey(d) { return d.getFullYear() + "-" + pvtPad(d.getMonth() + 1) + "-" + pvtPad(d.getDate()); }
function pvtLocalStamp(d) {
  return pvtDayKey(d) + " " + pvtPad(d.getHours()) + ":" + pvtPad(d.getMinutes()) + ":" + pvtPad(d.getSeconds());
}
function pvtFmtTime(lang, d) {
  try { return d.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }); }
  catch (e) { return pvtPad(d.getHours()) + ":" + pvtPad(d.getMinutes()); }
}
function pvtFmtDate(lang, d, opts) {
  try { return d.toLocaleDateString(lang, opts); }
  catch (e) { return pvtPad(d.getDate()) + "/" + pvtPad(d.getMonth() + 1) + "/" + d.getFullYear(); }
}
function pvtScoreColor(score) {
  if (score === null || score === undefined) return "var(--secondary-text-color)";
  if (score >= 85) return "var(--success-color,#4caf50)";
  if (score >= 70) return "var(--warning-color,#ff9800)";
  return "var(--error-color,#f44336)";
}
function pvtVerdictKey(score, mean) {
  if (score === null) return null;
  if (score >= 90 && mean !== null && mean <= 320) return "v_brilliant";
  if (score >= 85) return "v_good";
  if (score >= 70) return "v_drop";
  return "v_tired";
}

/* ------------------------------------------------------------------ */
/* Pure logic (no DOM access, covered by tests/card.test.mjs)          */
/* ------------------------------------------------------------------ */

/* Result of one test.
   score = 100 * (1 - (lapses + false starts) / (scored stimuli + false starts during waits)) */
function pvtComputeResult(rts, lapses, falseStarts, scored, waitFalseStarts) {
  const n = rts.length;
  let sum = 0, best = null, worst = null;
  for (const v of rts) {
    sum += v;
    best = best === null ? v : Math.min(best, v);
    worst = worst === null ? v : Math.max(worst, v);
  }
  const denom = Math.max(1, scored + waitFalseStarts);
  return {
    mean: n ? Math.round(sum / n) : null,
    best: best === null ? null : Math.round(best),
    worst: worst === null ? null : Math.round(worst),
    score: Math.max(0, Math.min(100, Math.round(100 * (1 - (lapses + falseStarts) / denom))))
  };
}

/* Bands of the time-of-day chart, e.g. 7-21 every 2 hours. */
function pvtBands(opts) {
  const o = opts || {};
  const start = Math.round(pvtClamp(o.band_start, 0, 23, PVT_DEFAULTS.band_start));
  const end = Math.round(pvtClamp(o.band_end, start + 1, 24, Math.max(start + 1, PVT_DEFAULTS.band_end)));
  const size = Math.round(pvtClamp(o.band_size, 1, 12, PVT_DEFAULTS.band_size));
  const out = [];
  for (let f = start; f < end; f += size) out.push({ from: f, to: Math.min(end, f + size) });
  return out;
}

/* History store.
   Entry: [t, mean, best, worst, score, lapses, falseStarts, weight, mode]
   - t: epoch ms; times in ms; weight > 1 only for hourly aggregates imported from helpers */
function pvtEntryOk(e) {
  return Array.isArray(e) && typeof e[0] === "number" && isFinite(e[0]) && e[0] > 0 && pvtValid(Number(e[1]));
}
function pvtStoreMerge(list, add) {
  const byT = {};
  const all = (list || []).concat(add || []);
  for (const e of all) if (pvtEntryOk(e)) byT[e[0]] = e;
  const out = Object.keys(byT).map(function (k) { return byT[k]; }).sort(function (a, b) { return a[0] - b[0]; });
  return out.length > PVT_STORE_MAX ? out.slice(out.length - PVT_STORE_MAX) : out;
}
function pvtStoreNormalize(value) {
  const o = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    v: 1,
    migrated: !!o.migrated,
    imported: Math.max(0, Math.round(Number(o.imported) || 0)),
    tests: pvtStoreMerge(Array.isArray(o.tests) ? o.tests : [], [])
  };
}
function pvtEntryToEvent(e) {
  const m = Number(e[1]);
  const b = pvtValid(Number(e[2])) ? Number(e[2]) : m;
  const w = pvtValid(Number(e[3])) ? Number(e[3]) : m;
  return { t: e[0], mean: m, low: Math.min(b, m), high: Math.max(w, m), n: Math.max(1, Math.round(Number(e[7]) || 1)) };
}
function pvtEventToEntry(ev) {
  return [ev.t, Math.round(ev.mean), Math.round(ev.low), Math.round(ev.high), null, null, null, ev.n, ""];
}

/* Weighted mean, best = minimum, worst = maximum. */
function pvtAgg(list) {
  let sw = 0, sn = 0, lo = null, hi = null;
  for (const e of list) {
    sw += e.mean * e.n; sn += e.n;
    lo = lo === null ? e.low : Math.min(lo, e.low);
    hi = hi === null ? e.high : Math.max(hi, e.high);
  }
  return { mean: sn ? sw / sn : null, low: lo, high: hi, n: sn };
}

/* Groups events for the two charts. */
function pvtBucket(events, opts, now) {
  const bands = pvtBands(opts).map(function (b) { return { from: b.from, to: b.to, list: [] }; });
  const start = bands[0].from, end = bands[bands.length - 1].to;
  const byDay = {};
  let outside = 0;
  for (const e of events) {
    const d = new Date(e.t);
    const k = pvtDayKey(d);
    (byDay[k] || (byDay[k] = [])).push(e);
    const hr = d.getHours();
    let placed = false;
    for (const b of bands) if (hr >= b.from && hr < b.to) { b.list.push(e); placed = true; break; }
    if (!placed) outside += e.n;
  }
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ date: d, today: i === 0, agg: pvtAgg(byDay[pvtDayKey(d)] || []) });
  }
  return {
    days: days,
    bands: bands.map(function (b) { return { from: b.from, to: b.to, agg: pvtAgg(b.list) }; }),
    start: start, end: end, outside: outside,
    all: pvtAgg(events),
    first: events.length ? events[0].t : null
  };
}

/* ---- One-time import of a history already recorded in helpers ----
   Sources: long-term statistics of four template sensors that mirror the results
   (stat_*_entity, hourly rows) plus the raw recorder history of the input helpers.
   Rows on an hour boundary are discarded using the test counter (min/max per hour);
   restarts that restore the same input_datetime value do not create tests. */
function pvtRawSeries(res, ent) {
  const out = [];
  const arr = ent && res && res[ent] ? res[ent] : null;
  if (!arr) return out;
  for (const it of arr) {
    if (!it) continue;
    const s = it.s !== undefined ? it.s : it.state;
    const t = it.lu !== undefined ? pvtMs(Number(it.lu)) : pvtMs(it.last_updated);
    if (t === null || s === undefined || s === null) continue;
    out.push({ t: t, s: s });
  }
  out.sort(function (a, b) { return a.t - b.t; });
  return out;
}
function pvtValueAt(series, t) {
  let val = null;
  for (const p of series) {
    const v = Number(p.s);
    if (!pvtValid(v)) continue;
    if (p.t <= t + 2000) val = v; else break;
  }
  if (val !== null) return val;
  for (const p of series) {
    const v = Number(p.s);
    if (!pvtValid(v)) continue;
    return p.t <= t + 30000 ? v : null;
  }
  return null;
}
function pvtImportEvents(stats, raw, live, ids) {
  const rows = {};
  const take = function (id, fn) {
    const arr = id && stats && stats[id] ? stats[id] : [];
    for (const r of arr) {
      const st = pvtMs(r.start);
      if (st === null) continue;
      fn(rows[st] || (rows[st] = {}), r);
    }
  };
  const num = function (v) { const n = Number(v); return v === null || v === undefined || !isFinite(n) ? null : n; };
  take(ids.smean, function (o, r) { const v = num(r.mean); if (v !== null && pvtValid(v)) o.mean = v; });
  take(ids.sbest, function (o, r) { const v = num(r.min !== undefined ? r.min : r.mean); if (v !== null && pvtValid(v)) o.low = v; });
  take(ids.sworst, function (o, r) { const v = num(r.max !== undefined ? r.max : r.mean); if (v !== null && pvtValid(v)) o.high = v; });
  take(ids.scount, function (o, r) { const a = num(r.min), b = num(r.max); if (a !== null && b !== null) { o.cmin = a; o.cmax = b; } });
  const starts = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
  const lts = [];
  let prevMax = -Infinity;
  for (const st of starts) {
    const o = rows[st];
    let n = 1;
    if (o.cmin !== undefined) {
      n = Math.round(o.cmax - Math.max(o.cmin - 1, prevMax));
      prevMax = Math.max(prevMax, o.cmax);
    }
    if (o.mean === undefined || n <= 0) continue;
    lts.push({ t: st, hour: st, mean: o.mean,
      low: o.low !== undefined ? Math.min(o.low, o.mean) : o.mean,
      high: o.high !== undefined ? Math.max(o.high, o.mean) : o.mean, n: n });
  }
  const rawEv = [], seen = {};
  const pushRaw = function (s, mean, best, worst) {
    const T = pvtParseLocal(s);
    if (T === null || mean === null) return;
    seen[s] = true;
    rawEv.push({ t: T, hour: Math.floor(T / PVT_HOUR) * PVT_HOUR, mean: mean,
      low: best !== null ? Math.min(best, mean) : mean,
      high: worst !== null ? Math.max(worst, mean) : mean, n: 1 });
  };
  const dts = pvtRawSeries(raw, ids.last);
  const sm = pvtRawSeries(raw, ids.mean), sb = pvtRawSeries(raw, ids.best), sw = pvtRawSeries(raw, ids.worst);
  for (const p of dts) {
    const s = String(p.s);
    if (seen[s] || pvtParseLocal(s) === null) continue;
    pushRaw(s, pvtValueAt(sm, p.t), pvtValueAt(sb, p.t), pvtValueAt(sw, p.t));
  }
  if (live && live.s && !seen[live.s]) pushRaw(live.s, live.mean, live.best, live.worst);
  /* per hour, the source with more tests wins (raw data is more precise on ties) */
  const rawCnt = {};
  for (const e of rawEv) rawCnt[e.hour] = (rawCnt[e.hour] || 0) + 1;
  const ltsByHour = {};
  for (const e of lts) ltsByHour[e.hour] = e;
  const out = [];
  for (const e of lts) if (!rawCnt[e.hour] || e.n > rawCnt[e.hour]) out.push({ t: e.t, mean: e.mean, low: e.low, high: e.high, n: e.n });
  for (const e of rawEv) {
    const a = ltsByHour[e.hour];
    if (!a || a.n <= rawCnt[e.hour]) out.push({ t: e.t, mean: e.mean, low: e.low, high: e.high, n: e.n });
  }
  out.sort(function (a, b) { return a.t - b.t; });
  return out;
}

/* Chart drawn like the Home Assistant statistics graph: a translucent capsule
   from best to worst time, plus dots and a line for the mean. */
function pvtChartSvg(cats) {
  let vmin = Infinity, vmax = -Infinity, any = false;
  for (const ct of cats) {
    for (const v of [ct.mean, ct.low, ct.high]) {
      if (v !== null && v !== undefined && isFinite(v)) {
        any = true;
        if (v < vmin) vmin = v;
        if (v > vmax) vmax = v;
      }
    }
  }
  if (!any) return null;
  if (vmax - vmin < 40) { const mid = (vmax + vmin) / 2; vmin = mid - 20; vmax = mid + 20; }
  const span0 = vmax - vmin;
  vmin = Math.max(0, vmin - span0 * 0.12);
  vmax = vmax + span0 * 0.12;
  const W = 320, H = 118, L = 30, R = 6, T = 13, B = 26;
  const pw = W - L - R, ph = H - T - B;
  const Y = function (v) { return T + ph - (v - vmin) / (vmax - vmin) * ph; };
  const X = function (i) { return L + pw * (i + 0.5) / cats.length; };
  let bg = "", caps = "", fg = "", pts = "";
  for (let g = 0; g <= 2; g++) {
    const gy = (T + ph * g / 2).toFixed(1);
    bg += '<line class="cgrid" x1="' + L + '" y1="' + gy + '" x2="' + (W - R) + '" y2="' + gy + '"/>';
  }
  bg += '<text class="cylab" x="' + (L - 4) + '" y="' + (T + 3) + '" text-anchor="end">' + Math.round(vmax) + "</text>";
  bg += '<text class="cylab" x="' + (L - 4) + '" y="' + (T + ph / 2 + 3).toFixed(1) + '" text-anchor="end">ms</text>';
  bg += '<text class="cylab" x="' + (L - 4) + '" y="' + (T + ph + 3) + '" text-anchor="end">' + Math.round(vmin) + "</text>";
  for (let i = 0; i < cats.length; i++) {
    const ct = cats[i], x = X(i);
    bg += '<text class="cxlab" x="' + x.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + pvtEsc(ct.label) + "</text>";
    if (ct.sub) bg += '<text class="cclab" x="' + x.toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + pvtEsc(ct.sub) + "</text>";
    if (ct.mean === null || ct.mean === undefined) continue;
    const lo = ct.low !== null && ct.low !== undefined ? ct.low : ct.mean;
    const hi = ct.high !== null && ct.high !== undefined ? ct.high : ct.mean;
    let yT = Y(hi);
    const yB = Y(lo);
    let hgt = yB - yT;
    if (hgt < 9) { const cY = (yT + yB) / 2; yT = cY - 4.5; hgt = 9; }
    caps += '<rect class="ccaps" x="' + (x - 4.5).toFixed(1) + '" y="' + yT.toFixed(1) + '" width="9" height="' + hgt.toFixed(1) + '" rx="4.5"/>';
    pts += (pts ? " " : "") + x.toFixed(1) + "," + Y(ct.mean).toFixed(1);
    fg += '<circle class="cdot" cx="' + x.toFixed(1) + '" cy="' + Y(ct.mean).toFixed(1) + '" r="2.6"/>';
    const ly = Math.max(8, Math.min(yT, Y(ct.mean)) - 4);
    fg += '<text class="cvlab" x="' + x.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle">' + Math.round(ct.mean) + "</text>";
  }
  const line = pts.indexOf(" ") > 0 ? '<polyline class="cline" points="' + pts + '"/>' : "";
  return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet" role="img">' + bg + caps + line + fg + "</svg>";
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const PVT_CSS =
  ":host{-webkit-user-select:none;user-select:none;}" +
  "ha-card{padding:12px 16px 14px;overflow:hidden;}" +
  ".head{display:flex;align-items:center;gap:10px;padding:2px 0 10px;}" +
  ".hic{width:38px;height:38px;min-width:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
  "color:var(--amber-color,#ffc107);background:color-mix(in srgb, var(--amber-color,#ffc107) 20%, transparent);}" +
  ".hic ha-icon{--mdc-icon-size:21px;}" +
  ".htxt{flex:1;min-width:0;}" +
  ".htitle{font-size:16px;font-weight:600;color:var(--primary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
  ".hsub{font-size:11.5px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
  ".chip{font-size:12.5px;font-weight:700;border-radius:12px;padding:4px 12px;white-space:nowrap;" +
  "color:var(--primary-text-color);background:color-mix(in srgb, var(--primary-text-color) 8%, transparent);}" +
  ".chip.ok{color:#fff;background:linear-gradient(135deg,var(--success-color,#4caf50),#2e7d32);}" +
  ".idlerow{display:flex;align-items:center;gap:14px;}" +
  ".ringwrap{position:relative;width:92px;height:92px;min-width:92px;}" +
  ".ringwrap svg{width:92px;height:92px;display:block;}" +
  ".track{fill:none;stroke:color-mix(in srgb, var(--primary-text-color) 12%, transparent);stroke-width:7;}" +
  ".prog{fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dasharray .7s ease;}" +
  ".rv{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}" +
  ".rval{font-size:24px;font-weight:800;color:var(--primary-text-color);line-height:1.05;}" +
  ".runit{font-size:9.5px;color:var(--secondary-text-color);}" +
  ".stats{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:6px;min-width:0;}" +
  ".stat{border-radius:12px;padding:7px 10px;background:color-mix(in srgb, var(--primary-text-color) 5%, transparent);min-width:0;}" +
  ".stat .l{font-size:10px;color:var(--secondary-text-color);display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;}" +
  ".stat .l ha-icon{--mdc-icon-size:12px;}" +
  ".stat .v{font-size:15px;font-weight:700;color:var(--primary-text-color);white-space:nowrap;}" +
  ".stat .v span{font-size:10.5px;font-weight:500;color:var(--secondary-text-color);}" +
  ".stat.wide{grid-column:1 / -1;}" +
  ".click{cursor:pointer;}" +
  ".stat.click{transition:background .15s ease;}" +
  ".stat.click:hover{background:color-mix(in srgb, var(--primary-text-color) 10%, transparent);}" +
  ".ringwrap.click:hover .rval{color:var(--primary-color);}" +
  ".lastcap{font-size:11px;color:var(--secondary-text-color);margin:8px 2px 8px;}" +
  ".lastcap.click:hover{color:var(--primary-text-color);text-decoration:underline;}" +
  ".lastcap.warn{color:var(--warning-color,#ff9800);}" +
  ".startbtn{width:100%;border:none;cursor:pointer;border-radius:14px;padding:13px 16px;" +
  "font-size:14.5px;font-weight:700;letter-spacing:.3px;color:#1a1a1a;font-family:inherit;" +
  "background:linear-gradient(135deg,var(--amber-color,#ffc107),var(--orange-color,#ff9800));" +
  "display:flex;align-items:center;justify-content:center;gap:8px;transition:filter .15s ease, transform .1s ease;}" +
  ".startbtn:hover{filter:brightness(1.07);}" +
  ".startbtn:active{transform:scale(.985);}" +
  ".startbtn ha-icon{--mdc-icon-size:19px;}" +
  ".topbar{display:flex;align-items:center;gap:10px;margin-bottom:8px;}" +
  ".tbar{flex:1;height:8px;border-radius:4px;background:color-mix(in srgb, var(--primary-text-color) 10%, transparent);overflow:hidden;}" +
  ".tfill{height:100%;border-radius:4px;width:100%;background:linear-gradient(90deg,var(--amber-color,#ffc107),var(--orange-color,#ff9800));}" +
  ".tleft{font-size:13px;font-weight:700;color:var(--primary-text-color);font-variant-numeric:tabular-nums;min-width:42px;text-align:right;}" +
  ".abort{width:30px;height:30px;min-width:30px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
  "color:var(--secondary-text-color);background:color-mix(in srgb, var(--primary-text-color) 8%, transparent);}" +
  ".abort ha-icon{--mdc-icon-size:16px;}" +
  ".arena{position:relative;height:280px;border-radius:16px;cursor:pointer;touch-action:manipulation;outline:none;" +
  "background:#101418;border:1px solid color-mix(in srgb, var(--primary-text-color) 12%, transparent);" +
  "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;overflow:hidden;}" +
  ".arena:focus-visible{box-shadow:0 0 0 2px var(--primary-color);}" +
  ".arena.stim{background:#0d1117;box-shadow:inset 0 0 60px rgba(255,80,80,.08);}" +
  ".bigms{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:64px;font-weight:800;line-height:1;" +
  "color:#ff5252;text-shadow:0 0 24px rgba(255,82,82,.45);font-variant-numeric:tabular-nums;}" +
  ".waitdot{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.22);animation:pvtpulse 1.6s ease infinite;}" +
  "@keyframes pvtpulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.5);opacity:.15}}" +
  ".fbval{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:52px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;}" +
  ".fbval span{font-size:20px;}" +
  ".fbtag{font-size:14px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;}" +
  ".cnt3{font-size:76px;font-weight:800;color:rgba(255,255,255,.9);line-height:1;}" +
  ".trials{position:absolute;bottom:10px;right:14px;font-size:11px;color:rgba(255,255,255,.35);font-variant-numeric:tabular-nums;}" +
  ".hintb{position:absolute;bottom:10px;left:14px;font-size:11px;color:rgba(255,255,255,.35);}" +
  ".doneverd{font-size:15px;font-weight:700;color:var(--primary-text-color);margin:2px 0 2px;}" +
  ".savednote{font-size:11px;color:var(--secondary-text-color);display:flex;align-items:center;gap:5px;margin:8px 2px 10px;}" +
  ".savednote ha-icon{--mdc-icon-size:13px;color:var(--success-color,#4caf50);}" +
  ".savednote.err ha-icon{color:var(--error-color,#f44336);}" +
  ".btnrow{display:flex;gap:8px;}" +
  ".ghostbtn{flex:1;border:1px solid color-mix(in srgb, var(--primary-text-color) 18%, transparent);cursor:pointer;border-radius:14px;" +
  "padding:11px 14px;font-size:13.5px;font-weight:600;color:var(--primary-text-color);background:transparent;font-family:inherit;}" +
  ".ghostbtn:hover{background:color-mix(in srgb, var(--primary-text-color) 6%, transparent);}" +
  ".ghostbtn.accent{border:none;color:#1a1a1a;font-weight:700;" +
  "background:linear-gradient(135deg,var(--amber-color,#ffc107),var(--orange-color,#ff9800));}" +
  ".hist{margin-top:12px;border-top:1px solid color-mix(in srgb, var(--primary-text-color) 10%, transparent);padding-top:10px;}" +
  ".hhead{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--primary-text-color);cursor:pointer;}" +
  ".hhead ha-icon{--mdc-icon-size:16px;color:var(--secondary-text-color);}" +
  ".hhead .hn{font-size:11px;font-weight:400;color:var(--secondary-text-color);margin-left:auto;}" +
  ".hhead .chev{transition:transform .2s ease;}" +
  ".hhead .chev.closed{transform:rotate(180deg);}" +
  ".hsec{font-size:10.5px;font-weight:600;color:var(--secondary-text-color);margin:10px 0 4px;text-transform:uppercase;letter-spacing:.4px;}" +
  ".hchart svg{width:100%;height:auto;display:block;}" +
  ".cgrid{stroke:color-mix(in srgb, var(--primary-text-color) 10%, transparent);stroke-width:1;}" +
  ".cylab,.cxlab{fill:var(--secondary-text-color);font-size:8px;}" +
  ".cclab{fill:var(--secondary-text-color);font-size:7.5px;opacity:.8;}" +
  ".ccaps{fill:color-mix(in srgb, var(--primary-color) 22%, transparent);}" +
  ".cline{stroke:var(--primary-color);fill:none;stroke-width:1.6;opacity:.9;stroke-linejoin:round;stroke-linecap:round;}" +
  ".cdot{fill:var(--primary-color);}" +
  ".cvlab{fill:var(--primary-text-color);font-size:8.5px;font-weight:700;}" +
  ".hempty{font-size:11px;color:var(--secondary-text-color);padding:4px 0;}" +
  ".legend{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--secondary-text-color);margin-top:6px;}" +
  ".legend .lcaps{width:9px;height:16px;border-radius:4.5px;background:color-mix(in srgb, var(--primary-color) 22%, transparent);}" +
  ".legend .ldot{width:7px;height:7px;border-radius:50%;background:var(--primary-color);margin-left:10px;}" +
  ".hnote{font-size:10.5px;color:var(--secondary-text-color);margin-top:6px;}" +
  "@media (prefers-reduced-motion: reduce){.waitdot{animation:none;}.prog,.tfill,.startbtn{transition:none;}}" +
  "[hidden]{display:none !important;}";

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

class PvtVigilanceCard extends HTMLElement {
  static getConfigElement() { return document.createElement(PVT_EDITOR_TAG); }
  static getStubConfig() { return {}; }

  setConfig(config) {
    if (config && typeof config !== "object") throw new Error("Invalid configuration");
    this._c = Object.assign({}, PVT_DEFAULTS, config || {});
    this._abortSilently();
    this._built = false;
    if (this.shadowRoot) this._build();
  }
  getCardSize() { return this._c && this._c.show_history === false ? 6 : 9; }
  getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6 }; }

  connectedCallback() {
    if (!this._built && this._c) this._build();
    /* pick up tests saved from other devices while this view was not shown */
    if (this._store && this._loadedAt && Date.now() - this._loadedAt > 300000) this._storeLoad();
  }
  disconnectedCallback() { this._abortSilently(); }

  set hass(h) {
    this._h = h;
    if (!this._c) return;
    const lang = pvtLang(h);
    if (!this._built || (lang !== this._lang && this._phase === "idle")) this._build();
    if (!this._store && !this._storeLoading) this._storeLoad();
    if (this._phase === "idle") this._refreshIdle(false);
  }
  get hass() { return this._h; }

  _t(key, vars) { return pvtT(this._lang, key, vars); }
  _el(id) { return this.shadowRoot ? this.shadowRoot.getElementById(id) : null; }
  _has(ent) { return !!(ent && this._h && this._h.states && this._h.states[ent]); }

  _clearTimers() {
    if (this._t1) { clearTimeout(this._t1); this._t1 = null; }
    if (this._t2) { clearTimeout(this._t2); this._t2 = null; }
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._rafBar) { cancelAnimationFrame(this._rafBar); this._rafBar = null; }
    if (this._visHandler) { document.removeEventListener("visibilitychange", this._visHandler); this._visHandler = null; }
  }
  _testRunning() { return !!this._phase && this._phase !== "idle" && this._phase !== "done"; }
  _abortSilently() {
    this._clearTimers();
    if (this._testRunning()) { this._phase = "idle"; if (this._built) this._show("idle"); }
    if (!this._phase) this._phase = "idle";
  }

  /* ---------------- rendering ---------------- */
  _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const c = this._c;
    this._lang = pvtLang(this._h);
    this._phase = "idle";
    const t = this._t.bind(this);
    const CIRC = (2 * Math.PI * 34).toFixed(2);
    const title = c.title !== undefined && c.title !== null && c.title !== "" ? c.title : t("title");
    const minutes = Math.max(1, Math.round(pvtClamp(c.duration, 30, 600, 180) / 60));
    const stats = function (p) {
      return '<div class="stats">' +
        '<div class="stat" id="st_' + p + 'mean"><div class="l"><ha-icon icon="mdi:timer-outline"></ha-icon>' + pvtEsc(t("mean")) + '</div><div class="v" id="' + p + 'mean">--</div></div>' +
        '<div class="stat" id="st_' + p + 'best"><div class="l"><ha-icon icon="mdi:flash"></ha-icon>' + pvtEsc(t("best")) + '</div><div class="v" id="' + p + 'best">--</div></div>' +
        '<div class="stat" id="st_' + p + 'worst"><div class="l"><ha-icon icon="mdi:tortoise"></ha-icon>' + pvtEsc(t("worst")) + '</div><div class="v" id="' + p + 'worst">--</div></div>' +
        '<div class="stat" id="st_' + p + 'laps"><div class="l"><ha-icon icon="mdi:sleep"></ha-icon>' + pvtEsc(t("lapses")) + '</div><div class="v" id="' + p + 'laps">--</div></div>' +
        '<div class="stat wide" id="st_' + p + 'false"><div class="l"><ha-icon icon="mdi:gesture-tap"></ha-icon>' + pvtEsc(t("false_starts")) + '</div><div class="v" id="' + p + 'false">--</div></div>' +
        "</div>";
    };
    const ring = function (p) {
      return '<div class="ringwrap" id="rw_' + p + '"><svg viewBox="0 0 76 76"><circle class="track" cx="38" cy="38" r="34"/>' +
        '<circle class="prog" id="' + p + 'ring" cx="38" cy="38" r="34" stroke="var(--amber-color,#ffc107)" stroke-dasharray="0 ' + CIRC + '" transform="rotate(-90 38 38)"/></svg>' +
        '<div class="rv"><div class="rval" id="' + p + 'score">--</div><div class="runit">' + pvtEsc(t("points")) + "</div></div></div>";
    };
    const histHtml = c.show_history === false ? "" :
      '<div class="hist"><div class="hhead" id="hhead" role="button" tabindex="0"><ha-icon icon="mdi:history"></ha-icon><span>' + pvtEsc(t("history")) + "</span>" +
      '<span class="hn" id="hn"></span><ha-icon class="chev" id="hchev" icon="mdi:chevron-up"></ha-icon></div>' +
      '<div id="hbody">' +
      '<div class="hsec">' + pvtEsc(t("h_days")) + '</div><div class="hchart" id="hdays"></div>' +
      '<div class="hsec" id="hbandtitle"></div><div class="hchart" id="hbands"></div>' +
      '<div class="legend"><span class="lcaps"></span>' + pvtEsc(t("legend_range")) + '<span class="ldot"></span>' + pvtEsc(t("legend_mean")) + "</div>" +
      '<div class="hnote" id="hnote">' + pvtEsc(t("h_loading")) + "</div>" +
      "</div></div>";
    this.shadowRoot.innerHTML =
      "<style>" + PVT_CSS + "</style>" +
      "<ha-card>" +
      '<div class="head"><div class="hic"><ha-icon icon="' + pvtEsc(c.icon || PVT_DEFAULTS.icon) + '"></ha-icon></div>' +
      '<div class="htxt"><div class="htitle">' + pvtEsc(title) + "</div>" +
      '<div class="hsub">' + pvtEsc(t("subtitle", { min: minutes })) + "</div></div>" +
      '<div class="chip" id="hchip">--</div></div>' +
      '<div id="idle"><div class="idlerow">' + ring("i") + stats("i") + "</div>" +
      '<div class="lastcap" id="ilast">' + pvtEsc(t("no_test")) + "</div>" +
      '<button class="startbtn" id="startbtn"><ha-icon icon="mdi:play"></ha-icon><span id="startlbl">' + pvtEsc(t("start")) + "</span></button>" +
      histHtml + "</div>" +
      '<div id="stage" hidden>' +
      '<div class="topbar"><div class="tbar"><div class="tfill" id="tfill"></div></div>' +
      '<div class="tleft" id="tleft">3:00</div>' +
      '<button class="abort" id="abortbtn" title="' + pvtEsc(t("stop")) + '" aria-label="' + pvtEsc(t("stop")) + '"><ha-icon icon="mdi:close"></ha-icon></button></div>' +
      '<div class="arena" id="arena" role="button" tabindex="0" aria-label="' + pvtEsc(t("arena_label")) + '">' +
      '<div id="acontent"></div><div class="trials" id="trials"></div>' +
      '<div class="hintb" id="hintb">' + pvtEsc(t("hint")) + "</div></div></div>" +
      '<div id="done" hidden><div class="idlerow">' + ring("d") + stats("d") + "</div>" +
      '<div class="doneverd" id="dverd"></div>' +
      '<div class="savednote" id="dsaved"><ha-icon id="dsavedicon" icon="mdi:check-circle"></ha-icon><span id="dsavedtxt"></span></div>' +
      '<div class="btnrow"><button class="ghostbtn" id="closebtn">' + pvtEsc(t("close")) + "</button>" +
      '<button class="ghostbtn accent" id="againbtn">' + pvtEsc(t("repeat")) + "</button></div></div>" +
      "</ha-card>";

    const self = this;
    this._el("startbtn").addEventListener("click", function () { self._startTest(); });
    this._el("abortbtn").addEventListener("click", function (ev) { ev.stopPropagation(); self._abort(null); });
    this._el("closebtn").addEventListener("click", function () { self._show("idle"); self._refreshIdle(true); });
    this._el("againbtn").addEventListener("click", function () { self._startTest(); });
    const arena = this._el("arena");
    arena.addEventListener("pointerdown", function (ev) {
      if (ev.button !== undefined && ev.button > 0) return; /* primary button / touch only */
      ev.preventDefault();
      self._tap(ev, ev.pointerType === "mouse" ? "mouse" : "touch");
    });
    arena.addEventListener("keydown", function (ev) {
      if (ev.key === " " || ev.key === "Spacebar" || ev.key === "Enter") {
        ev.preventDefault();
        if (!ev.repeat) self._tap(ev, "keyboard");
      }
    });
    const hhead = this._el("hhead");
    if (hhead) {
      const toggle = function () {
        const b = self._el("hbody"), ch = self._el("hchev");
        if (b) b.hidden = !b.hidden;
        if (ch) ch.className = "chev" + (b && b.hidden ? " closed" : "");
      };
      hhead.addEventListener("click", toggle);
      hhead.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); toggle(); } });
    }
    /* values open the more-info dialog of the linked helper, like native cards */
    const wire = function (id, ent) {
      const el = self._el(id);
      if (!el || !ent) return;
      el.classList.add("click");
      el.setAttribute("role", "button");
      el.setAttribute("title", t("open", { entity: ent }));
      el.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!self._has(ent)) return;
        self.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: ent }, bubbles: true, composed: true }));
      });
    };
    ["i", "d"].forEach(function (p) {
      wire("rw_" + p, c.score_entity);
      wire("st_" + p + "mean", c.mean_entity);
      wire("st_" + p + "best", c.best_entity);
      wire("st_" + p + "worst", c.worst_entity);
      wire("st_" + p + "laps", c.lapses_entity);
      wire("st_" + p + "false", c.false_entity);
    });
    wire("ilast", c.last_entity);
    this._built = true;
    this._sig = null;
    this._refreshIdle(true);
    this._renderHistory();
  }

  _show(which) {
    if (which === "idle" || which === "done") this._phase = which;
    this._el("idle").hidden = which !== "idle";
    this._el("stage").hidden = which !== "stage";
    this._el("done").hidden = which !== "done";
  }

  /* values of the last test: history store first, helpers as fallback */
  _lastValues() {
    const tests = this._store ? this._store.tests : [];
    const e = tests.length ? tests[tests.length - 1] : null;
    if (e && e[4] !== null && e[4] !== undefined) {
      return { t: e[0], score: e[4], mean: e[1], best: e[2], worst: e[3], lapses: e[5], fs: e[6] };
    }
    const h = this._h, c = this._c;
    const lastEnt = c.last_entity && h && h.states && h.states[c.last_entity] ? pvtParseLocal(h.states[c.last_entity].state) : null;
    const v = {
      t: lastEnt || (e ? e[0] : null),
      score: pvtNumState(h, c.score_entity),
      mean: pvtNumState(h, c.mean_entity),
      best: pvtNumState(h, c.best_entity),
      worst: pvtNumState(h, c.worst_entity),
      lapses: pvtNumState(h, c.lapses_entity),
      fs: pvtNumState(h, c.false_entity)
    };
    if (e && (v.mean === null || !pvtValid(v.mean))) { v.mean = e[1]; v.best = e[2]; v.worst = e[3]; }
    return v;
  }

  _refreshIdle(force) {
    if (!this._built || !this._c) return;
    const v = this._lastValues();
    const sig = JSON.stringify(v) + "|" + (this._notice || "") + "|" + (this._store ? this._store.tests.length : -1);
    if (!force && sig === this._sig) return;
    this._sig = sig;
    const CIRC = 2 * Math.PI * 34;
    const ring = this._el("iring");
    const score = v.score === null || v.score === undefined ? null : v.score;
    if (ring) {
      ring.setAttribute("stroke", pvtScoreColor(score));
      ring.setAttribute("stroke-dasharray", (CIRC * Math.max(0, Math.min(1, (score || 0) / 100))).toFixed(2) + " " + CIRC.toFixed(2));
    }
    const is = this._el("iscore");
    if (is) is.textContent = score === null ? "--" : String(Math.round(score));
    const ms = function (x) { return x !== null && x !== undefined && pvtValid(Number(x)) ? Number(x) : null; };
    this._put("imean", ms(v.mean), "ms");
    this._put("ibest", ms(v.best), "ms");
    this._put("iworst", ms(v.worst), "ms");
    this._put("ilaps", v.lapses === undefined ? null : v.lapses, "");
    this._put("ifalse", v.fs === undefined ? null : v.fs, "");
    const now = new Date();
    const d = v.t ? new Date(v.t) : null;
    const isToday = !!d && pvtDayKey(d) === pvtDayKey(now);
    const cap = this._el("ilast");
    if (cap) {
      if (this._notice) {
        cap.textContent = this._notice;
        cap.classList.add("warn");
      } else {
        cap.classList.remove("warn");
        if (d) {
          const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const time = pvtFmtTime(this._lang, d);
          let when;
          if (isToday) when = this._t("when_today", { time: time });
          else if (pvtDayKey(d) === pvtDayKey(y)) when = this._t("when_yesterday", { time: time });
          else when = this._t("when_date", { date: pvtFmtDate(this._lang, d, { day: "2-digit", month: "2-digit" }), time: time });
          cap.textContent = this._t("last_test", { when: when });
        } else {
          cap.textContent = this._t("no_test");
        }
      }
    }
    const chip = this._el("hchip");
    if (chip) {
      chip.textContent = this._t(isToday ? "done_today" : "todo_today");
      chip.className = "chip" + (isToday ? " ok" : "");
    }
    const lbl = this._el("startlbl");
    if (lbl) lbl.textContent = this._t(isToday ? "retry" : "start");
  }
  _put(id, v, unit) {
    const el = this._el(id);
    if (!el) return;
    if (v === null || v === undefined || v === "") { el.textContent = "--"; return; }
    el.innerHTML = pvtEsc(Math.round(Number(v))) + (unit ? " <span>" + pvtEsc(unit) + "</span>" : "");
  }

  _renderHistory() {
    if (!this._built || !this._c || this._c.show_history === false) return;
    const nd = this._el("hdays"), nb = this._el("hbands"), note = this._el("hnote"), hn = this._el("hn"), bt = this._el("hbandtitle");
    if (!nd || !nb) return;
    const bandsCfg = pvtBands(this._c);
    const bStart = bandsCfg[0].from, bEnd = bandsCfg[bandsCfg.length - 1].to;
    if (bt) bt.textContent = this._t("h_bands", { start: bStart, end: bEnd });
    if (!this._store) {
      if (note) note.textContent = this._t(this._storeError ? "h_unavailable" : "h_loading");
      return;
    }
    const lang = this._lang, self = this;
    const events = this._store.tests.map(pvtEntryToEvent);
    const b = pvtBucket(events, this._c, new Date());
    const toCat = function (agg, label) {
      return { label: label, sub: agg.n ? pvtPlural(lang, "tests", agg.n) : "", mean: agg.mean, low: agg.low, high: agg.high };
    };
    const cats7 = b.days.map(function (d) {
      return toCat(d.agg, d.today ? self._t("today") : pvtFmtDate(lang, d.date, { weekday: "short" }));
    });
    const svg7 = pvtChartSvg(cats7);
    nd.innerHTML = svg7 || '<div class="hempty">' + pvtEsc(this._t("h_empty_days")) + "</div>";
    const svgB = pvtChartSvg(b.bands.map(function (x) { return toCat(x.agg, x.from + "-" + x.to); }));
    nb.innerHTML = svgB || '<div class="hempty">' + pvtEsc(this._t("h_empty_bands", { start: b.start, end: b.end })) + "</div>";
    if (hn) hn.textContent = b.all.n ? this._t("h_summary", { ms: Math.round(b.all.mean), tests: pvtPlural(lang, "tests", b.all.n) }) : "";
    if (note) {
      if (!b.all.n) {
        note.textContent = this._storeError ? this._t("h_unavailable") : this._t("h_empty");
      } else {
        const parts = [this._t("h_note", { tests: pvtPlural(lang, "tests", b.all.n), date: pvtFmtDate(lang, new Date(b.first)) })];
        if (this._store.imported) parts.push(this._t("h_imported", { n: this._store.imported }));
        if (b.outside > 0) parts.push(this._t("h_outside", { n: b.outside, start: b.start, end: b.end }));
        note.textContent = parts.join(" " + PVT_DOT + " ");
      }
    }
  }

  /* ---------------- history store ---------------- */
  _storeGet() {
    return this._h.callWS({ type: "frontend/get_user_data", key: PVT_STORE_KEY })
      .then(function (r) { return pvtStoreNormalize(r ? r.value : null); });
  }
  _storeSet(store) {
    return this._h.callWS({
      type: "frontend/set_user_data",
      key: PVT_STORE_KEY,
      value: { v: 1, migrated: !!store.migrated, imported: store.imported || 0, tests: store.tests }
    });
  }
  _storeLoad() {
    if (this._storeLoading || !this._h || !this._h.callWS) return;
    this._storeLoading = true;
    const self = this;
    this._storeGet().then(function (store) {
      if (self._store) store.tests = pvtStoreMerge(store.tests, self._store.tests);
      self._store = store;
      self._storeError = false;
      if (self._needsImport(store)) return self._importFromHelpers(store);
      return null;
    }).catch(function (err) {
      self._storeError = true;
      if (!self._store) self._store = pvtStoreNormalize(null);
      console.warn("PVT-VIGILANCE-CARD: cannot read the history", err);
    }).then(function () {
      self._storeLoading = false;
      self._loadedAt = Date.now();
      if (self._phase === "idle") self._refreshIdle(true);
      self._renderHistory();
    });
  }
  _needsImport(store) {
    const c = this._c;
    return !store.migrated && store.tests.length === 0 &&
      !!(c.stat_mean_entity || (c.mean_entity && c.last_entity));
  }
  _importFromHelpers(store) {
    const h = this._h, c = this._c, self = this;
    const now = new Date();
    const statIds = [c.stat_mean_entity, c.stat_best_entity, c.stat_worst_entity, c.stat_count_entity].filter(Boolean);
    const rawIds = [c.last_entity, c.mean_entity, c.best_entity, c.worst_entity].filter(Boolean);
    const pStats = statIds.length ? h.callWS({
      type: "recorder/statistics_during_period",
      start_time: new Date(now.getTime() - 5 * 365 * 86400000).toISOString(),
      end_time: now.toISOString(),
      statistic_ids: statIds,
      period: "hour",
      types: ["mean", "min", "max"]
    }).catch(function () { return null; }) : Promise.resolve(null);
    const pRaw = rawIds.length ? h.callWS({
      type: "history/history_during_period",
      start_time: new Date(now.getTime() - 10 * 86400000).toISOString(),
      end_time: now.toISOString(),
      entity_ids: rawIds,
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false,
      include_start_time_state: true
    }).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([pStats, pRaw]).then(function (r) {
      if (r[0] === null && r[1] === null) return null; /* recorder not reachable: retry on next load */
      let live = null;
      if (self._has(c.last_entity)) {
        const m = pvtNumState(h, c.mean_entity), b = pvtNumState(h, c.best_entity), w = pvtNumState(h, c.worst_entity);
        live = {
          s: h.states[c.last_entity].state,
          mean: pvtValid(m) ? m : null,
          best: pvtValid(b) ? b : null,
          worst: pvtValid(w) ? w : null
        };
      }
      const events = pvtImportEvents(r[0], r[1], live, {
        smean: c.stat_mean_entity, sbest: c.stat_best_entity, sworst: c.stat_worst_entity, scount: c.stat_count_entity,
        last: c.last_entity, mean: c.mean_entity, best: c.best_entity, worst: c.worst_entity
      });
      const entries = events.map(pvtEventToEntry);
      let imported = 0;
      for (const e of entries) imported += e[7];
      store.tests = pvtStoreMerge(store.tests, entries);
      store.migrated = true;
      store.imported = imported;
      self._store = store;
      console.info("PVT-VIGILANCE-CARD: imported " + imported + " tests from helpers");
      return self._storeSet(store);
    });
  }
  /* re-read before writing, so tests saved meanwhile from another device are kept */
  _persist(entry) {
    const self = this;
    return this._storeGet().then(function (remote) {
      const merged = {
        v: 1,
        migrated: remote.migrated || !!(self._store && self._store.migrated),
        imported: remote.imported || (self._store ? self._store.imported : 0),
        tests: pvtStoreMerge(remote.tests.concat(self._store ? self._store.tests : []), [entry])
      };
      self._store = merged;
      return self._storeSet(merged);
    });
  }

  /* ---------------- test engine ---------------- */
  _startTest() {
    this._clearTimers();
    const c = this._c;
    this._notice = null;
    this._dur = pvtClamp(c.duration, 30, 600, 180) * 1000;
    this._isiMin = pvtClamp(c.isi_min, 0.5, 10, 1) * 1000;
    this._isiMax = Math.max(this._isiMin, pvtClamp(c.isi_max, 0.5, 10, 4) * 1000);
    this._lapseMs = pvtClamp(c.lapse_ms, 150, 1000, 355);
    this._warmN = Math.round(pvtClamp(c.warmup, 0, 5, 2));
    this._offsets = {
      touch: pvtClamp(c.offset_touch, 0, 150, 0),
      mouse: pvtClamp(c.offset_mouse, 0, 150, 0),
      keyboard: pvtClamp(c.offset_keyboard, 0, 150, 0)
    };
    this._rts = []; this._lapses = 0; this._fs = 0; this._shown = 0; this._fsWait = 0;
    this._scored = 0; this._warm = false; this._mods = { touch: 0, mouse: 0, keyboard: 0 };
    this._phase = "count";
    this._show("stage");
    this._el("hintb").hidden = false;
    this._el("trials").textContent = "";
    const arena = this._el("arena");
    try { arena.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    /* a hidden page throttles timers and animation frames: the test would be invalid */
    const self = this;
    this._visHandler = function () { if (document.hidden && self._testRunning()) self._abort(self._t("interrupted")); };
    document.addEventListener("visibilitychange", this._visHandler);
    this._countdown(3);
  }
  _countdown(n) {
    const a = this._el("acontent"), arena = this._el("arena");
    if (arena) arena.className = "arena";
    if (n === 0) {
      this._t0 = performance.now();
      this._barLoop();
      this._nextTrial();
      return;
    }
    if (a) a.innerHTML = '<div class="cnt3">' + n + "</div>";
    const self = this;
    this._t1 = setTimeout(function () { self._countdown(n - 1); }, 750);
  }
  _remaining() { return this._dur - (performance.now() - this._t0); }
  _barLoop() {
    const self = this;
    const step = function () {
      if (!self._testRunning()) return;
      const rem = Math.max(0, self._remaining());
      const f = self._el("tfill"), tl = self._el("tleft");
      if (f) f.style.width = (rem / self._dur * 100).toFixed(1) + "%";
      if (tl) {
        const s = Math.ceil(rem / 1000);
        tl.textContent = Math.floor(s / 60) + ":" + pvtPad(s % 60);
      }
      self._rafBar = requestAnimationFrame(step);
    };
    this._rafBar = requestAnimationFrame(step);
  }
  _nextTrial() {
    if (this._remaining() < this._isiMin + 600) { this._finish(); return; }
    this._phase = "wait";
    const arena = this._el("arena"), a = this._el("acontent");
    if (arena) arena.className = "arena";
    if (a) a.innerHTML = '<div class="waitdot"></div>';
    let isi = this._isiMin + Math.random() * (this._isiMax - this._isiMin);
    isi = Math.min(isi, Math.max(400, this._remaining() - 500));
    const self = this;
    this._t1 = setTimeout(function () { self._showStim(); }, isi);
  }
  _showStim() {
    /* "arm" phase: the stimulus is requested, but the clock starts only on the
       frame in which it is actually painted (double requestAnimationFrame), so
       the rendering delay of the device does not enter the measurement */
    this._phase = "arm";
    this._shown += 1;
    this._warm = this._shown <= this._warmN;
    if (!this._warm) this._scored += 1;
    const arena = this._el("arena"), a = this._el("acontent");
    if (arena) arena.className = "arena stim";
    if (a) a.innerHTML = '<div class="bigms" id="bigms">0</div>';
    const tr = this._el("trials");
    if (tr) tr.textContent = this._warm
      ? this._t("warmup_n", { i: this._shown, n: this._warmN })
      : pvtPlural(this._lang, "stimuli", this._scored);
    const self = this;
    requestAnimationFrame(function () {
      requestAnimationFrame(function (ts) {
        if (self._phase !== "arm") return;
        self._phase = "stim";
        self._stimT = ts; /* timestamp of the frame that shows the stimulus */
        const ms = self._el("bigms");
        const loop = function () {
          if (self._phase !== "stim") return;
          if (ms) ms.textContent = String(Math.max(0, Math.floor(performance.now() - self._stimT)));
          self._raf = requestAnimationFrame(loop);
        };
        self._raf = requestAnimationFrame(loop);
        self._t2 = setTimeout(function () {
          if (self._phase !== "stim") return;
          if (!self._warm) self._lapses += 1;
          self._feedback(null, self._t(self._warm ? "warmup" : "no_response"),
            self._warm ? "rgba(255,255,255,.6)" : "var(--error-color,#f44336)");
        }, 3000);
      });
    });
  }
  _tap(ev, mode) {
    if (this._phase === "wait" || this._phase === "arm") {
      const wasArm = this._phase === "arm";
      const warmFs = wasArm ? this._warm : this._shown < this._warmN;
      if (wasArm) { this._shown -= 1; if (!this._warm) this._scored -= 1; }
      this._phase = "fs"; /* also stops the animation-frame chain of the arm phase */
      if (this._t1) { clearTimeout(this._t1); this._t1 = null; }
      if (!warmFs) { this._fs += 1; this._fsWait += 1; }
      this._feedback(null, this._t("too_early"), "var(--warning-color,#ff9800)");
      return;
    }
    if (this._phase !== "stim") return;
    /* hardware timestamp of the input event (same origin as performance.now),
       immune to the scheduling delay of the JavaScript handler */
    const base = ev && typeof ev.timeStamp === "number" && ev.timeStamp > 0 ? ev.timeStamp : performance.now();
    let rt = base - this._stimT;
    if (!isFinite(rt) || rt < 0 || rt > 10000) rt = performance.now() - this._stimT; /* inconsistent timeStamp */
    const m = this._mods[mode] !== undefined ? mode : "touch";
    this._mods[m] += 1;
    rt = Math.max(1, rt - this._offsets[m]);
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._t2) { clearTimeout(this._t2); this._t2 = null; }
    if (m === "touch" && navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* ignore */ } }
    if (this._warm) {
      this._feedback(Math.round(rt), this._t("warmup"), "rgba(255,255,255,.6)");
      return;
    }
    if (rt < 100) {
      this._fs += 1;
      this._feedback(null, this._t("too_early"), "var(--warning-color,#ff9800)");
      return;
    }
    this._rts.push(rt);
    if (rt >= this._lapseMs) {
      this._lapses += 1;
      this._feedback(Math.round(rt), this._t("lapse"), "var(--error-color,#f44336)");
    } else {
      this._feedback(Math.round(rt), this._t(rt < 250 ? "fast" : (rt < 320 ? "great" : "good")), "var(--success-color,#4caf50)");
    }
  }
  _feedback(rtMs, tag, color) {
    this._phase = "fb";
    const arena = this._el("arena"), a = this._el("acontent");
    if (arena) arena.className = "arena";
    if (a) a.innerHTML =
      (rtMs !== null ? '<div class="fbval" style="color:' + color + '">' + rtMs + "<span> ms</span></div>" : "") +
      '<div class="fbtag" style="color:' + color + '">' + pvtEsc(tag) + "</div>";
    const hint = this._el("hintb");
    if (hint) hint.hidden = true;
    const self = this;
    this._t1 = setTimeout(function () { self._nextTrial(); }, 700);
  }
  _abort(notice) {
    this._clearTimers();
    this._phase = "idle";
    this._notice = notice || null;
    this._show("idle");
    this._refreshIdle(true);
  }
  _finish() {
    this._clearTimers();
    const res = pvtComputeResult(this._rts, this._lapses, this._fs, this._scored, this._fsWait);
    this._phase = "done";
    this._show("done");
    const CIRC = 2 * Math.PI * 34;
    const ring = this._el("dring");
    if (ring) {
      ring.setAttribute("stroke", pvtScoreColor(res.score));
      ring.setAttribute("stroke-dasharray", (CIRC * res.score / 100).toFixed(2) + " " + CIRC.toFixed(2));
    }
    const ds = this._el("dscore");
    if (ds) ds.textContent = String(res.score);
    this._put("dmean", res.mean, "ms");
    this._put("dbest", res.best, "ms");
    this._put("dworst", res.worst, "ms");
    this._put("dlaps", this._lapses, "");
    this._put("dfalse", this._fs, "");
    let mode = "touch", top = -1;
    for (const k of ["touch", "mouse", "keyboard"]) if (this._mods[k] > top) { top = this._mods[k]; mode = k; }
    const vk = pvtVerdictKey(res.score, res.mean);
    const verd = this._el("dverd");
    if (verd) {
      verd.textContent = (vk ? this._t(vk) + " " + PVT_DOT + " " : "") + pvtPlural(this._lang, "stimuli", this._scored) +
        (top > 0 ? " " + PVT_DOT + " " + this._t("mode_" + mode) : "");
    }
    this._save(res, top > 0 ? mode : "");
  }

  _setSaveNote(key, ok) {
    const note = this._el("dsaved"), txt = this._el("dsavedtxt"), icon = this._el("dsavedicon");
    if (!note) return;
    note.className = "savednote" + (ok ? "" : " err");
    if (icon) icon.setAttribute("icon", ok ? "mdi:check-circle" : "mdi:alert-circle");
    if (txt) txt.textContent = this._t(key);
  }
  _save(res, mode) {
    const h = this._h, c = this._c, self = this;
    const now = new Date();
    /* 1) history store (needs at least one valid reaction time) */
    if (res.mean !== null && h && h.callWS) {
      const entry = [now.getTime(), res.mean, res.best, res.worst, res.score, this._lapses, this._fs, 1, mode];
      this._store = this._store || pvtStoreNormalize(null);
      this._store.tests = pvtStoreMerge(this._store.tests, [entry]);
      this._setSaveNote("saving", true);
      this._persist(entry).then(function () { self._setSaveNote("saved", true); })
        .catch(function (err) {
          console.warn("PVT-VIGILANCE-CARD: cannot save the result", err);
          self._setSaveNote("save_failed", false);
        });
      this._renderHistory();
    } else {
      this._setSaveNote(res.mean === null ? "no_valid" : "save_failed", false);
    }
    /* 2) optional helpers, in a guaranteed order: values -> counter -> date.
          Template sensors keyed on the date therefore see values that are already updated. */
    if (!h || !h.callService) return;
    const has = this._has.bind(this);
    const safe = function (p) { return Promise.resolve(p).catch(function () { return null; }); };
    const setNum = function (ent, val) {
      if (!has(ent) || val === null || val === undefined) return null;
      return safe(h.callService("input_number", "set_value", { entity_id: ent, value: val }));
    };
    Promise.all([
      setNum(c.score_entity, res.score),
      setNum(c.mean_entity, res.mean === null ? 0 : res.mean),
      setNum(c.best_entity, res.best === null ? 0 : res.best),
      setNum(c.worst_entity, res.worst === null ? 0 : res.worst),
      setNum(c.lapses_entity, this._lapses),
      setNum(c.false_entity, this._fs)
    ]).then(function () {
      return has(c.count_entity) ? safe(h.callService("counter", "increment", { entity_id: c.count_entity })) : null;
    }).then(function () {
      return has(c.last_entity)
        ? safe(h.callService("input_datetime", "set_datetime", { entity_id: c.last_entity, datetime: pvtLocalStamp(now) }))
        : null;
    });
  }
}

/* ------------------------------------------------------------------ */
/* One-click helpers (visual editor, administrators only)              */
/* ------------------------------------------------------------------ */

/* Helper names are fixed English strings, in every language: entity ids stay the same
   everywhere and match examples/packages/pvt_vigilance.yaml. */
const PVT_INPUT_HELPERS = [
  { key: "score_entity", name: "PVT-B Score", domain: "input_number", icon: "mdi:lightning-bolt",
    data: { min: 0, max: 100, step: 1, mode: "box", unit_of_measurement: "points" } },
  { key: "mean_entity", name: "PVT-B Mean time", domain: "input_number", icon: "mdi:timer-outline",
    data: { min: 0, max: 3000, step: 1, mode: "box", unit_of_measurement: "ms" } },
  { key: "best_entity", name: "PVT-B Best time", domain: "input_number", icon: "mdi:flash",
    data: { min: 0, max: 3000, step: 1, mode: "box", unit_of_measurement: "ms" } },
  { key: "worst_entity", name: "PVT-B Worst time", domain: "input_number", icon: "mdi:tortoise",
    data: { min: 0, max: 3000, step: 1, mode: "box", unit_of_measurement: "ms" } },
  { key: "lapses_entity", name: "PVT-B Lapses", domain: "input_number", icon: "mdi:sleep",
    data: { min: 0, max: 200, step: 1, mode: "box" } },
  { key: "false_entity", name: "PVT-B False starts", domain: "input_number", icon: "mdi:gesture-tap",
    data: { min: 0, max: 200, step: 1, mode: "box" } },
  { key: "last_entity", name: "PVT-B Last test", domain: "input_datetime", icon: "mdi:calendar-clock",
    data: { has_date: true, has_time: true } },
  { key: "count_entity", name: "PVT-B Tests", domain: "counter", icon: "mdi:counter",
    data: { initial: 0, step: 1, minimum: 0, restore: true } }
];
/* Template sensors with state_class "measurement": their long-term statistics keep a
   permanent copy of the results. They have a value only in the 90 s after a test and
   are "unknown" otherwise, so every statistics row corresponds to a real test. */
const PVT_TEMPLATE_HELPERS = [
  { key: "stat_mean_entity", kind: "mean", name: "PVT-B History mean time", unit: "ms" },
  { key: "stat_best_entity", kind: "best", name: "PVT-B History best time", unit: "ms" },
  { key: "stat_worst_entity", kind: "worst", name: "PVT-B History worst time", unit: "ms" },
  { key: "stat_count_entity", kind: "count", name: "PVT-B History test count", unit: "tests" },
  { key: null, kind: "today", name: "PVT-B Score today", unit: "points" }
];
const PVT_HELPER_KEYS = PVT_INPUT_HELPERS.map(function (h) { return h.key; })
  .concat(PVT_TEMPLATE_HELPERS.filter(function (h) { return h.key; }).map(function (h) { return h.key; }));

function pvtErrText(err) {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.body && err.body.message) return String(err.body.message);
  if (err.message) return String(err.message);
  if (err.error) return String(err.error);
  if (typeof err.body === "string" && err.body) return err.body;
  try { return JSON.stringify(err); } catch (e) { return String(err); }
}
/* Object id that Home Assistant derives from an (ASCII) helper name. */
function pvtSlug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
/* State template of the statistics sensors (ids: entity ids of the input helpers). */
function pvtTemplateState(kind, ids) {
  const win = "(as_timestamp(now()) - (state_attr('" + ids.last + "', 'timestamp') | float(0))) < 90";
  if (kind === "today") {
    return "{{ (states('" + ids.score + "') | float(0) | round(0) | int) if states('" + ids.last +
      "')[:10] == now().strftime('%Y-%m-%d') else none }}";
  }
  if (kind === "count") {
    return "{% set n = states('" + ids.count + "') | int(0) %}{{ n if n > 0 and " + win + " else none }}";
  }
  return "{% set v = states('" + ids[kind] + "') | float(0) | round(0) | int %}{{ v if v > 0 and " + win + " else none }}";
}
function pvtDelay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* Creates the missing helpers, reuses the existing ones and returns the updated card config.
   Inputs use the storage-collection WebSocket commands; template sensors use the
   config flow of the Template integration, like the Helpers page of Home Assistant. */
async function pvtCreateHelpers(hass, config, waitMs) {
  const cfg = Object.assign({}, config);
  const out = { config: cfg, created: 0, reused: 0, error: null };
  const wait = waitMs === undefined ? 300 : waitMs;
  const exists = function (id) { return !!(id && hass.states && hass.states[id]); };
  /* an existing helper with the expected name */
  const findByName = function (domain, spec) {
    const id = domain + "." + pvtSlug(spec.name);
    return exists(id) ? id : null;
  };
  const resolve = async function (match) {
    for (let i = 0; i < 3; i++) {
      await pvtDelay(i === 0 ? wait : wait * 3);
      const reg = await hass.callWS({ type: "config/entity_registry/list" });
      const e = (reg || []).find(match);
      if (e) return e.entity_id;
    }
    return null;
  };
  try {
    let freshScore = false;
    for (const spec of PVT_INPUT_HELPERS) {
      if (exists(cfg[spec.key])) { out.reused += 1; continue; }
      const found = findByName(spec.domain, spec);
      if (found) { cfg[spec.key] = found; out.reused += 1; continue; }
      const item = await hass.callWS(Object.assign({ type: spec.domain + "/create", name: spec.name, icon: spec.icon }, spec.data));
      out.created += 1;
      if (spec.key === "score_entity") freshScore = true;
      cfg[spec.key] = (await resolve(function (e) { return e.platform === spec.domain && e.unique_id === item.id; })) ||
        spec.domain + "." + item.id;
    }
    const ids = { score: cfg.score_entity, mean: cfg.mean_entity, best: cfg.best_entity,
      worst: cfg.worst_entity, last: cfg.last_entity, count: cfg.count_entity };
    for (const spec of PVT_TEMPLATE_HELPERS) {
      if (spec.key && exists(cfg[spec.key])) { out.reused += 1; continue; }
      const found = findByName("sensor", spec);
      if (found) { if (spec.key) cfg[spec.key] = found; out.reused += 1; continue; }
      const guess = "sensor." + pvtSlug(spec.name);
      if (!spec.key && !freshScore) continue; /* "score today" only with a fresh score helper */
      if (!hass.callApi) throw new Error("callApi not available");
      let step = await hass.callApi("POST", "config/config_entries/flow", { handler: "template", show_advanced_options: false });
      if (step.type === "menu") step = await hass.callApi("POST", "config/config_entries/flow/" + step.flow_id, { next_step_id: "sensor" });
      if (step.type !== "form") throw new Error("template: unexpected step " + step.type);
      const res = await hass.callApi("POST", "config/config_entries/flow/" + step.flow_id, {
        name: spec.name, state: pvtTemplateState(spec.kind, ids),
        unit_of_measurement: spec.unit, state_class: "measurement"
      });
      if (res.type !== "create_entry") throw new Error("template: " + (res.errors ? JSON.stringify(res.errors) : res.type));
      out.created += 1;
      if (spec.key) {
        const entryId = res.result && typeof res.result === "object" ? res.result.entry_id : res.result;
        cfg[spec.key] = (entryId && (await resolve(function (e) {
          return e.config_entry_id === entryId && e.entity_id.indexOf("sensor.") === 0;
        }))) || guess;
      }
    }
  } catch (err) {
    out.error = pvtErrText(err);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Visual editor                                                       */
/* ------------------------------------------------------------------ */

function pvtEditorSchema(lang) {
  const t = function (k) { return pvtT(lang, "ed_" + k); };
  const num = function (name, min, max, step, unit) {
    return { name: name, selector: { number: { min: min, max: max, step: step, mode: "box", unit_of_measurement: unit } } };
  };
  const ent = function (name, domain) { return { name: name, selector: { entity: { domain: domain } } }; };
  return [
    { name: "title", selector: { text: {} } },
    { name: "icon", selector: { icon: {} } },
    { type: "expandable", name: "g_test", flatten: true, title: t("g_test"), icon: "mdi:timer-cog-outline", schema: [
      num("duration", 30, 600, 10, "s"),
      num("isi_min", 0.5, 10, 0.5, "s"),
      num("isi_max", 0.5, 10, 0.5, "s"),
      num("lapse_ms", 150, 1000, 5, "ms"),
      num("warmup", 0, 5, 1, ""),
      num("offset_touch", 0, 150, 5, "ms"),
      num("offset_mouse", 0, 150, 5, "ms"),
      num("offset_keyboard", 0, 150, 5, "ms")
    ] },
    { type: "expandable", name: "g_history", flatten: true, title: t("g_history"), icon: "mdi:history", schema: [
      { name: "show_history", selector: { boolean: {} } },
      num("band_start", 0, 23, 1, "h"),
      num("band_end", 1, 24, 1, "h"),
      num("band_size", 1, 12, 1, "h")
    ] },
    { type: "expandable", name: "g_helpers", flatten: true, title: t("g_helpers"), icon: "mdi:link-variant", schema: [
      ent("score_entity", "input_number"),
      ent("mean_entity", "input_number"),
      ent("best_entity", "input_number"),
      ent("worst_entity", "input_number"),
      ent("lapses_entity", "input_number"),
      ent("false_entity", "input_number"),
      ent("last_entity", "input_datetime"),
      ent("count_entity", "counter")
    ] },
    { type: "expandable", name: "g_import", flatten: true, title: t("g_import"), icon: "mdi:database-import-outline", schema: [
      ent("stat_mean_entity", "sensor"),
      ent("stat_best_entity", "sensor"),
      ent("stat_worst_entity", "sensor"),
      ent("stat_count_entity", "sensor")
    ] }
  ];
}

/* ha-form is lazy-loaded by Home Assistant: load it through a built-in card editor. */
async function pvtEnsureHaForm() {
  if (customElements.get("ha-form")) return;
  try {
    const helpers = await window.loadCardHelpers();
    const card = await helpers.createCardElement({ type: "entities", entities: [] });
    if (card && card.constructor && card.constructor.getConfigElement) await card.constructor.getConfigElement();
  } catch (e) { /* ignore */ }
  await Promise.race([customElements.whenDefined("ha-form"), new Promise(function (r) { setTimeout(r, 2000); })]);
}

class PvtVigilanceCardEditor extends HTMLElement {
  setConfig(config) { this._config = Object.assign({}, config); this._render(); }
  set hass(h) {
    const changed = !this._hass || pvtLang(h) !== pvtLang(this._hass);
    this._hass = h;
    if (this._form) {
      this._form.hass = h;
      if (changed) this._form.schema = pvtEditorSchema(pvtLang(h));
      this._renderHelpersPanel();
    }
  }
  connectedCallback() { this._render(); }
  async _render() {
    if (!this._config) return;
    if (!this._form) {
      await pvtEnsureHaForm();
      if (this._form) return;
      const form = document.createElement("ha-form");
      const self = this;
      form.computeLabel = function (s) { return s.title || pvtT(pvtLang(self._hass), "ed_" + s.name); };
      form.computeHelper = function (s) {
        const lang = pvtLang(self._hass);
        return pvtHasKey(lang, "edh_" + s.name) ? pvtT(lang, "edh_" + s.name) : undefined;
      };
      form.addEventListener("value-changed", function (ev) {
        const cfg = Object.assign({}, self._config, ev.detail.value);
        for (const k of Object.keys(cfg)) {
          /* keep the YAML minimal: drop empty values and values equal to the defaults */
          if (cfg[k] === "" || cfg[k] === undefined || cfg[k] === null || cfg[k] === PVT_DEFAULTS[k]) delete cfg[k];
        }
        self._config = cfg;
        self.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
      });
      this._form = form;
      this.appendChild(form);
    }
    this._form.hass = this._hass;
    this._form.schema = pvtEditorSchema(pvtLang(this._hass));
    this._form.data = Object.assign({}, PVT_DEFAULTS, this._config);
    this._renderHelpersPanel();
  }

  /* panel with the one-click "Create helpers" button */
  _renderHelpersPanel() {
    if (!this._form) return;
    const self = this;
    if (!this._hp) {
      const box = document.createElement("div");
      box.className = "pvt-hp";
      box.innerHTML = "<style>" +
        ".pvt-hp{margin-top:16px;padding:12px 14px;border:1px solid var(--divider-color);border-radius:12px;}" +
        ".pvt-hp-t{font-weight:500;margin-bottom:4px;color:var(--primary-text-color);}" +
        ".pvt-hp-d{font-size:13px;line-height:1.45;color:var(--secondary-text-color);margin-bottom:10px;}" +
        ".pvt-hp-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}" +
        ".pvt-hp button{border:none;border-radius:18px;padding:8px 16px;font:inherit;font-weight:500;cursor:pointer;" +
        "color:var(--text-primary-color,#fff);background:var(--primary-color);}" +
        ".pvt-hp button[hidden]{display:none;}" +
        ".pvt-hp button[disabled]{opacity:.55;cursor:default;}" +
        ".pvt-hp-s{font-size:13px;color:var(--secondary-text-color);}" +
        ".pvt-hp-s.err{color:var(--error-color,#db4437);}" +
        "</style>" +
        '<div class="pvt-hp-t"></div><div class="pvt-hp-d"></div>' +
        '<div class="pvt-hp-row"><button type="button"></button><span class="pvt-hp-s"></span></div>';
      box.querySelector("button").addEventListener("click", function () { self._createHelpers(); });
      this._hp = box;
      this.appendChild(box);
    }
    const lang = pvtLang(this._hass);
    const h = this._hass, c = this._config || {};
    const admin = !!(h && h.user && h.user.is_admin);
    this._hp.querySelector(".pvt-hp-t").textContent = pvtT(lang, "ed_hp_title");
    this._hp.querySelector(".pvt-hp-d").textContent = pvtT(lang, "ed_hp_desc");
    const btn = this._hp.querySelector("button"), st = this._hp.querySelector(".pvt-hp-s");
    btn.textContent = pvtT(lang, this._hpBusy ? "ed_hp_busy" : "ed_hp_button");
    btn.hidden = !admin;
    btn.disabled = !!this._hpBusy;
    if (this._hpMsg) {
      st.textContent = this._hpMsg.text;
      st.className = "pvt-hp-s" + (this._hpMsg.err ? " err" : "");
    } else {
      let n = 0;
      for (const k of PVT_HELPER_KEYS) if (c[k] && h && h.states && h.states[c[k]]) n += 1;
      st.textContent = admin ? pvtT(lang, "ed_hp_linked", { n: n, total: PVT_HELPER_KEYS.length }) : pvtT(lang, "ed_hp_admin");
      st.className = "pvt-hp-s";
    }
  }

  async _createHelpers() {
    if (this._hpBusy || !this._hass || !this._config) return;
    const lang = pvtLang(this._hass);
    this._hpBusy = true;
    this._hpMsg = null;
    this._renderHelpersPanel();
    const r = await pvtCreateHelpers(this._hass, this._config, this._hpWait);
    this._hpBusy = false;
    this._config = r.config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: r.config }, bubbles: true, composed: true }));
    if (this._form) this._form.data = Object.assign({}, PVT_DEFAULTS, this._config);
    this._hpMsg = r.error
      ? { text: pvtT(lang, "ed_hp_fail", { error: r.error }), err: true }
      : { text: pvtT(lang, "ed_hp_done", { created: r.created, reused: r.reused }), err: false };
    this._renderHelpersPanel();
  }
}

/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

if (customElements.get(PVT_TAG)) {
  console.warn("PVT-VIGILANCE-CARD: another copy of the card is already loaded. Remove duplicate dashboard resources (for example an old inline copy) so that only the HACS one remains.");
} else {
  customElements.define(PVT_TAG, PvtVigilanceCard);
}
if (!customElements.get(PVT_EDITOR_TAG)) customElements.define(PVT_EDITOR_TAG, PvtVigilanceCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(function (c) { return c.type === PVT_TAG; })) {
  const navLang = pvtLang(null);
  window.customCards.push({
    type: PVT_TAG,
    name: pvtT(navLang, "picker_name"),
    description: pvtT(navLang, "picker_desc"),
    preview: true,
    documentationURL: PVT_REPO_URL
  });
}
console.info("%c PVT-VIGILANCE-CARD %c v" + PVT_VERSION + " ",
  "background:#ffb300;color:#000;padding:2px 6px;border-radius:3px 0 0 3px;",
  "background:#424242;color:#fff;padding:2px 6px;border-radius:0 3px 3px 0;");
