---
description: Release a new version of the card (bump, changelog, tests, tag, GitHub release)
argument-hint: "X.Y.Z"
---

Release version `$ARGUMENTS` of the card. If no version was given, propose one following Semantic
Versioning from the `Unreleased` section of `CHANGELOG.md` (fix: patch, new feature: minor, breaking
change: major) and ask the maintainer to confirm it. Speak the maintainer's language and stop at the first
error to explain it.

1. Preconditions: on branch `main`, working tree clean, up to date with `origin/main` (`git fetch`), the
   placeholder `GITHUB_USER` already replaced (otherwise run `/publish` first), and the tag `v<version>`
   not existing yet (`git tag -l`, `gh release view v<version>` must fail).
2. `CHANGELOG.md`: the `Unreleased` section must describe the changes; if it is empty, draft it from
   `git log <last tag>..HEAD` and ask the maintainer to approve it. Then rename it to
   `## [<version>] - <today, YYYY-MM-DD>`, add a new empty `## [Unreleased]` above it, and update the
   links at the bottom (`[Unreleased]` compares `v<version>...HEAD`, `[<version>]` points to the tag).
3. Bump the version in `dist/pvt-vigilance-card.js` (`const PVT_VERSION = "<version>";`) and in
   `package.json`.
4. Run `npm run check`, `npm test` (with `TZ=UTC`), the ASCII check from `CLAUDE.md` and, if Playwright is
   installed, `npm run test:e2e`. If the look of the card changed since the last release, run
   `npm run screenshots` and show the new images to the maintainer.
5. Show `git diff` and ask for confirmation. Then commit `Release <version>` and push.
6. Wait for the **Validate** workflow on that commit to pass (`gh run watch <id> --exit-status`).
7. Create the release with the new changelog section as notes:

   ```bash
   awk -v v="<version>" 'index($0, "## [" v "]")==1{f=1;next} /^## \[/{f=0} /^\[/{f=0} f' CHANGELOG.md > /tmp/notes.md
   gh release create v<version> --title "<version>" --notes-file /tmp/notes.md
   ```

8. Wait for the **Release** workflow and check that `pvt-vigilance-card.js` is attached
   (`gh release view v<version> --json assets --jq '.assets[].name'`). HACS offers the update to users
   within a few hours.
