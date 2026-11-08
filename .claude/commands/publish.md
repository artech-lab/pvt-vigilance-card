---
description: Publish the card on GitHub, create the first release and prepare the HACS default-store request
argument-hint: "[github-username]"
---

Publish this repository for the first time. Work step by step, show the maintainer what you are about to do
before every step that changes something outside this folder, and stop at the first error to explain it.
Speak the maintainer's language. Read `CLAUDE.md` and `PUBLISHING.md` first.

## 1. Preflight

- `gh auth status`. If not logged in, ask the maintainer to run `! gh auth login` (interactive) and wait.
- Owner: use `$ARGUMENTS` if given, otherwise `gh api user --jq .login`. Ask the maintainer to confirm it.
  It must be a personal account: HACS does not accept default-store requests from organization accounts.
- `gh repo view <owner>/pvt-vigilance-card` must fail (the repository must not exist yet). If it exists,
  stop and ask what to do.
- `git config user.name` and `git config user.email` must be set. If not, ask the maintainer for the values
  to use (suggest the GitHub no-reply address `<id>+<login>@users.noreply.github.com`, shown by
  `gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"'`) and set them for this repository only.
  Never invent them.

## 2. Replace the placeholder

```bash
grep -rl GITHUB_USER . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.claude \
  --exclude=PUBLISHING.md --exclude=CLAUDE.md | xargs sed -i 's/GITHUB_USER/<owner>/g'
```

Then the same `grep -rn` with the same exclusions must print nothing. Show `git diff --stat` if the folder
is already a git repository.

## 3. Checks

- `npm run check`, `npm test` (with `TZ=UTC`), and the ASCII check from `CLAUDE.md`.
- If Playwright is installed (`npm install` done), also `npm run test:e2e`; otherwise say it was skipped.
- Personal-data scan: search the repository for e-mail addresses, real names, places, time zones and
  instance-specific entity ids (`grep -rnE "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}"` and a read of the
  diff). Report anything suspicious and do not continue until the maintainer decides.

## 4. Repository

```bash
git init -b main            # only if this is not a git repository yet
git add -A
git commit -m "PVT-B Vigilance Card 1.0.0"
gh repo create <owner>/pvt-vigilance-card --public --source . --remote origin --push \
  --description "Home Assistant card for the 3-minute brief Psychomotor Vigilance Test (PVT-B) with persistent reaction-time history"
gh repo edit <owner>/pvt-vigilance-card --enable-issues \
  --add-topic home-assistant,hacs,lovelace,lovelace-card,custom-card,dashboard,psychomotor-vigilance-test,reaction-time,health
```

## 5. Validation

Wait for the **Validate** workflow of the pushed commit (`gh run list --workflow validate.yml`, then
`gh run watch <id> --exit-status`). If it fails, read `gh run view <id> --log-failed`, fix the cause, commit,
push and wait again. HACS checks usually reported at this stage: description, topics, issues, `hacs.json`,
images in the README.

## 6. First release

Create the release with the 1.0.0 section of `CHANGELOG.md` as notes (without the heading line):

```bash
awk '/^## \[1\.0\.0\]/{f=1;next} /^## \[/{f=0} /^\[/{f=0} f' CHANGELOG.md > /tmp/notes-1.0.0.md
gh release create v1.0.0 --title "1.0.0" --notes-file /tmp/notes-1.0.0.md
```

Wait for the **Release** workflow and check that `pvt-vigilance-card.js` is attached:
`gh release view v1.0.0 --json assets --jq '.assets[].name'`.

## 7. Report and HACS default store

Give the maintainer:

- the repository URL and the HACS custom-repository link
  `https://my.home-assistant.io/redirect/hacs_repository/?owner=<owner>&repository=pvt-vigilance-card&category=plugin`;
- a short test plan for their Home Assistant (step 5 of `PUBLISHING.md`, including the **Create helpers**
  button).

Then **ask** whether to open the request for the HACS default store (step 6 of `PUBLISHING.md`). Only after an
explicit yes:

1. `gh repo fork hacs/default --clone=false`, then clone the fork into a temporary folder **outside** this
   project and create a branch from `master` (e.g. `add-pvt-vigilance-card`).
2. The `plugin` file is a JSON array: add `"<owner>/pvt-vigilance-card"` keeping the alphabetical order
   (case-insensitive) and the existing formatting; check that the JSON is still valid.
3. Commit, push to the fork and open the pull request against `hacs/default` `master` with
   `gh pr create`, filling the repository's pull request template honestly: tick only what is actually
   true and verified, and include the links to the repository, the latest release and a passing
   Validate run.
4. Give the maintainer the pull request link. Reviews can take weeks; until then the card installs as a
   custom repository.
