# Pubblicazione su GitHub e HACS

Note per il manutentore: i passaggi per pubblicare la card e farla entrare nello store di HACS.

## Il modo più semplice: VS Code + Claude Code

1. Apri questa cartella in VS Code e installa le estensioni consigliate (VS Code le propone da sola:
   tra queste c'è **Claude Code**).
2. Installa [GitHub CLI](https://cli.github.com/) e accedi una volta con `gh auth login`.
3. Apri Claude Code e scrivi `/publish` (oppure `/publish tuo-username`).

Claude Code esegue i passaggi 1-4 di questa guida (segnaposto, test, repository, release), controlla che la
validazione HACS sia verde e ti chiede conferma prima di aprire la richiesta per lo store di HACS
(passaggio 6). Per le versioni successive usa `/release X.Y.Z`. Le regole del progetto che Claude Code segue
sono in [`CLAUDE.md`](CLAUDE.md).

Se preferisci fare tutto a mano, segui i passaggi qui sotto.

## 1. Inserire il tuo username GitHub

Nei file il proprietario del repository è il segnaposto `GITHUB_USER`. Sostituiscilo con il tuo
username (o con l'organizzazione) dalla cartella del progetto.

Git Bash (incluso in Git per Windows), Linux o macOS:

```bash
grep -rl GITHUB_USER . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.claude \
  --exclude=PUBLISHING.md --exclude=CLAUDE.md | xargs sed -i 's/GITHUB_USER/tuo-username/g'
```

PowerShell 7:

```powershell
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\(\.git|\.claude|node_modules)\\' -and
    $_.Name -notin 'PUBLISHING.md', 'CLAUDE.md' } |
  Select-String -Pattern GITHUB_USER -List | ForEach-Object {
    (Get-Content $_.Path -Raw) -replace 'GITHUB_USER', 'tuo-username' |
      Set-Content $_.Path -NoNewline -Encoding utf8NoBOM }
```

Controllo: lo stesso `grep -rn GITHUB_USER` con le stesse esclusioni non deve trovare più nulla (questo
file, `CLAUDE.md` e i comandi in `.claude/` mantengono il segnaposto solo nelle istruzioni).

## 2. Creare il repository

1. Su GitHub crea un repository **pubblico** chiamato `pvt-vigilance-card` (senza README, licenza o
   .gitignore: sono già qui).
2. Carica i file:

   ```bash
   git init -b main
   git add .
   git commit -m "PVT-B Vigilance Card 1.0.0"
   git remote add origin https://github.com/tuo-username/pvt-vigilance-card.git
   git push -u origin main
   ```

3. Nella pagina del repository, ingranaggio accanto ad **About**:
   - descrizione: `Home Assistant card for the 3-minute brief Psychomotor Vigilance Test (PVT-B) with persistent reaction-time history`
   - topics: `home-assistant`, `hacs`, `lovelace`, `lovelace-card`, `custom-card`, `dashboard`,
     `psychomotor-vigilance-test`, `reaction-time`, `health`
4. In **Settings > General > Features** lascia attive le **Issues** (HACS lo richiede).

## 3. Verificare la validazione

Nella scheda **Actions** il workflow **Validate** deve essere verde: contiene la validazione ufficiale di
HACS e i test unitari. Se la validazione HACS segnala la descrizione o i topics, completali e rilancia il
workflow (Run workflow).

## 4. Creare la prima release

**Releases > Draft a new release**: tag `v1.0.0` (creato al momento), titolo `1.0.0`, come note la
sezione 1.0.0 di `CHANGELOG.md`, poi **Publish release** (serve una release completa, non basta il tag). Il workflow **Release** controlla che il tag
coincida con la versione della card e allega `pvt-vigilance-card.js` alla release.

## 5. Provarla su un'istanza di Home Assistant

1. HACS > ⋮ > Repository personalizzati > aggiungi l'URL del repository con tipo **Dashboard**, poi scarica
   la card.
2. Se in quell'istanza la card era già installata a mano (file in `/local/` o risorsa inline), elimina
   quella risorsa da Impostazioni > Plance > Risorse: deve restare solo
   `/hacsfiles/pvt-vigilance-card/pvt-vigilance-card.js`.
3. Ricarica il browser svuotando la cache e aggiungi la card (`type: custom:pvt-vigilance-card`). Se nella
   configurazione ci sono gli helper `stat_*` o `mean_entity` + `last_entity`, al primo avvio lo storico
   esistente viene importato da solo.
4. Nella console del browser (F12) devi vedere `PVT-VIGILANCE-CARD v1.0.0` e nessun avviso di copie
   duplicate (con l'importazione compare anche `imported N tests from helpers`).
5. Con un utente amministratore apri l'editor della card e premi **Crea helper**: devono comparire 8 helper
   e 5 sensori template in Impostazioni > Dispositivi e servizi > Aiutanti, già collegati alla card.
   Gli helper hanno nomi in inglese (*PVT-B Score*, *PVT-B Mean time*, ...) anche con l'interfaccia in
   italiano. Salva la card, fai un test e controlla che i sensori *PVT-B History ...* mostrino i valori
   per circa 90 secondi. Premendo di nuovo il pulsante non deve creare nulla (`0 creati`).

## 6. Entrare nello store predefinito di HACS

Finché non viene accettata, la card si installa come repository personalizzato. Lo store predefinito è
lo stesso che da Home Assistant 2026.11 è integrato come **Marketplace**. Requisiti per l'inclusione
(documentazione HACS, *Publish > Include default repositories*):

- repository pubblico, non archiviato, con descrizione, topics e issues attive;
- `hacs.json` e README presenti, almeno una release pubblicata;
- l'action **Validate** di HACS che passa senza esclusioni;
- licenza riconosciuta da GitHub e approvata OSI (GPL-3.0 lo è);
- immagini nel README (controllo *images*, obbligatorio per le card);
- la richiesta deve arrivare dal proprietario o da un contributore principale, non da un account di
  organizzazione.

Poi:

1. fai un fork di [hacs/default](https://github.com/hacs/default) e crea un nuovo branch da `master`;
2. nel file `plugin` aggiungi la riga `tuo-username/pvt-vigilance-card` rispettando l'ordine alfabetico;
3. apri la pull request compilando il modello proposto e attendi la revisione (e i controlli automatici).

## 7. Rilasci successivi

Con Claude Code: `/release X.Y.Z`. A mano:

1. Aggiorna `PVT_VERSION` in `dist/pvt-vigilance-card.js`, `version` in `package.json` e `CHANGELOG.md`
   (la sezione `Unreleased` diventa la nuova versione).
2. `npm test` (e, se hai Playwright, `npm run test:e2e`; `npm run screenshots` se l'aspetto è cambiato).
3. Commit, push e nuova release con tag `vX.Y.Z`: HACS proporrà l'aggiornamento agli utenti.
