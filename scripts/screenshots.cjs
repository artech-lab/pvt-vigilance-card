// Regenerates the README images with demo data (no real measurements).
// Needs the dev dependencies:  npm install && npx playwright install chromium
// Run with:  npm run screenshots
const { chromium } = require("playwright");
const mdi = require("@mdi/js");
const path = require("path");
const fs = require("fs"), os = require("os");
const ROOT = path.join(__dirname, "..");
const CARD = path.join(ROOT, "dist", "pvt-vigilance-card.js");
const OUT = path.join(ROOT, "images");
const names = ["mdiLightningBolt","mdiTimerOutline","mdiFlash","mdiTortoise","mdiSleep","mdiGestureTap","mdiPlay",
  "mdiHistory","mdiChevronUp","mdiClose","mdiCheckCircle","mdiAlertCircle"];
const icons = {};
for (const n of names) icons["mdi:" + n.slice(3).replace(/[A-Z]/g, (c, i) => (i ? "-" : "") + c.toLowerCase())] = mdi[n];

const THEMES = {
  dark: "--primary-color:#03a9f4;--primary-text-color:#e1e1e1;--secondary-text-color:#9b9b9b;--card-background-color:#1c1c1c;--divider-color:rgba(225,225,225,.12);--success-color:#43a047;--warning-color:#ffa600;--error-color:#db4437;--amber-color:#ffc107;--orange-color:#ff9800;background:#111111;",
  light: "--primary-color:#03a9f4;--primary-text-color:#212121;--secondary-text-color:#727272;--card-background-color:#ffffff;--divider-color:rgba(0,0,0,.12);--success-color:#43a047;--warning-color:#ffa600;--error-color:#db4437;--amber-color:#ffc107;--orange-color:#ff9800;background:#fafafa;"
};
const html = (theme) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:20px;font-family:Inter,Roboto,"DejaVu Sans",sans-serif;-webkit-font-smoothing:antialiased;${THEMES[theme]}}
#host{width:430px}</style></head><body><div id="host"></div><script>
const ICONS = ${JSON.stringify(icons)};
customElements.define("ha-card", class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:"open"}).innerHTML =
 '<style>:host{display:block;background:var(--card-background-color);border-radius:12px;border:1px solid var(--divider-color);color:var(--primary-text-color);box-sizing:border-box}</style><slot></slot>'; } });
customElements.define("ha-icon", class extends HTMLElement {
  static get observedAttributes(){ return ["icon"]; }
  connectedCallback(){ this.render(); } attributeChangedCallback(){ this.render(); }
  render(){ if(!this.shadowRoot) this.attachShadow({mode:"open"}); const p = ICONS[this.getAttribute("icon")] || "";
    this.shadowRoot.innerHTML = '<style>:host{display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)}svg{width:100%;height:100%;fill:currentColor}</style><svg viewBox="0 0 24 24"><path d="'+p+'"/></svg>'; }
});
</script></body></html>`;

/* deterministic demo history (fake data): 5 weeks, better late morning, post-lunch dip */
function demoStore() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const now = new Date(); const tests = [];
  const profile = { 7: 318, 8: 305, 9: 289, 10: 280, 11: 283, 12: 296, 13: 314, 14: 321, 15: 304, 16: 296, 17: 293, 18: 299, 19: 307, 20: 316, 22: 335 };
  const hours = Object.keys(profile).map(Number);
  for (let d = 34; d >= 0; d--) {
    const k = d < 7 ? 2 : (rnd() < 0.55 ? 1 : 2);
    for (let j = 0; j < k; j++) {
      if (d === 0 && j > 0) break;
      const h = hours[Math.floor(rnd() * hours.length)];
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d, d === 0 ? Math.min(h, Math.max(7, now.getHours() - 1)) : h, Math.floor(rnd() * 60)).getTime();
      const mean = Math.round(profile[h] + (rnd() - 0.5) * 26 + (d < 4 ? -6 : 0));
      const best = Math.round(mean - 35 - rnd() * 25), worst = Math.round(mean + 60 + rnd() * 90);
      const lapses = worst > 400 ? 1 + Math.floor(rnd() * 2) : 0, fs = rnd() < 0.3 ? 1 : 0;
      tests.push([t, mean, best, worst, Math.round(100 * (1 - (lapses + fs) / 40)), lapses, fs, 1, "touch"]);
    }
  }
  tests.sort((a, b) => a[0] - b[0]);
  return { v: 1, migrated: false, imported: 0, tests };
}

(async () => {
  const browser = await chromium.launch();
  const shotTo = async (dir, theme, lang, file, after) => {
    const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 470, height: 1000 } });
    page.on("pageerror", (e) => console.error("PAGE ERROR", e.message));
    await page.setContent(html(theme));
    await page.addScriptTag({ path: CARD });
    await page.evaluate(([lang, store]) => {
      window.__store = store;
      const hass = { language: lang, locale: { language: lang }, states: {}, user: { is_admin: true },
        callWS: async (m) => m.type === "frontend/get_user_data" ? { value: window.__store } : (m.type === "frontend/set_user_data" ? (window.__store = m.value, null) : {}),
        callService: async () => {} };
      const card = document.createElement("pvt-vigilance-card");
      card.setConfig({ type: "custom:pvt-vigilance-card" });
      document.getElementById("host").appendChild(card);
      card.hass = hass; window.card = card;
    }, [lang, demoStore()]);
    await page.waitForFunction(() => window.card._store && window.card.shadowRoot.querySelector("#hdays svg"));
    if (after) await page.evaluate(after);
    await page.waitForTimeout(900);
    await page.locator("#host").screenshot({ path: path.join(dir, file) });
    await page.close();
    console.log("wrote", file);
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pvt-shots-"));
  const shot = (theme, lang, file, after) => shotTo(file === "result-light-it.png" ? OUT : tmp, theme, lang, file, after);
  await shot("dark", "en", "history-dark.png");
  await shot("dark", "en", "test-running.png", () => {
    const c = window.card, r = c.shadowRoot;
    c._show("stage"); c._phase = "preview";
    r.getElementById("arena").className = "arena stim";
    r.getElementById("acontent").innerHTML = '<div class="bigms">287</div>';
    r.getElementById("trials").textContent = "23 stimuli";
    r.getElementById("tleft").textContent = "1:12";
    r.getElementById("tfill").style.width = "40%";
  });
  await shot("light", "it", "result-light-it.png", () => {
    const c = window.card;
    c._c.duration = 180; c._lapses = 1; c._fs = 0; c._scored = 41; c._fsWait = 0;
    c._mods = { touch: 41, mouse: 0, keyboard: 0 };
    c._rts = [256, 271, 279, 284, 288, 291, 295, 297, 301, 306, 312, 318, 326, 338, 367, 262, 276, 281, 290, 299, 303, 309, 315, 274, 287];
    c._finish();
  });
  const result = () => {
    const c = window.card;
    c._c.duration = 180; c._lapses = 1; c._fs = 0; c._scored = 41; c._fsWait = 0;
    c._mods = { touch: 41, mouse: 0, keyboard: 0 };
    c._rts = [256, 271, 279, 284, 288, 291, 295, 297, 301, 306, 312, 318, 326, 338, 367, 262, 276, 281, 290, 299, 303, 309, 315, 274, 287];
    c._finish();
  };
  const keep = OUT;
  await shotTo(tmp, "dark", "en", "result-dark.png", result);
  /* composite preview: the three states of the card side by side */
  const b64 = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
  const items = [
    [path.join(tmp, "history-dark.png"), "Results and history"],
    [path.join(tmp, "test-running.png"), "Test in progress"],
    [path.join(tmp, "result-dark.png"), "Result"]
  ];
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1100, height: 1000 } });
  const fig = ([f, t]) => `<figure><img src="${b64(f)}"><figcaption>${t}</figcaption></figure>`;
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;font-family:Inter,Roboto,"DejaVu Sans",sans-serif;-webkit-font-smoothing:antialiased}
    #c{display:inline-flex;gap:28px;align-items:flex-start;padding:30px 32px 26px;background:#111111;}
    .col{display:flex;flex-direction:column;gap:22px}
    figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px}
    img{width:430px;display:block}
    figcaption{color:#9b9b9b;font-size:15px;letter-spacing:.2px}
  </style></head><body><div id="c"><div class="col">${fig(items[0])}</div><div class="col">${fig(items[1])}${fig(items[2])}</div></div></body></html>`);
  await page.waitForTimeout(300);
  await page.locator("#c").screenshot({ path: path.join(keep, "preview.png") });
  await page.close();
  console.log("wrote preview.png");
  fs.rmSync(tmp, { recursive: true, force: true });
  await browser.close();
})();
