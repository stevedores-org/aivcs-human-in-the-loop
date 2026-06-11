# Figma ZIP Drop Instructions

Walk-through for whoever has Figma access to land the `Generate TypeScript for Design.zip` export into this repo. Resolves [#4](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/4).

## Steps

1. Open the Figma Make URL from [#1](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/1):
   `https://www.figma.com/make/wFWSLRb1vEwFqYLTf9W2Sc/Generate-TypeScript-for-Design`
2. Click **Export -> TypeScript** in the Figma Make UI.
3. Save the resulting `Generate TypeScript for Design.zip` to a known path, e.g. `~/Downloads/figma-export.zip`.
4. Clone this repo, branch from `develop`, and drop the contents into the repo root with one command:

   ```sh
   gh repo clone stevedores-org/aivcs-human-in-the-loop && \
     cd aivcs-human-in-the-loop && \
     git checkout -b feat/scaffold-figma-drop develop && \
     unzip -o ~/Downloads/figma-export.zip -d . && \
     git add -A && \
     git commit -m "feat(scaffold): drop figma export (closes #4)" && \
     git push -u origin feat/scaffold-figma-drop
   ```

5. Open a PR against `develop`, then follow [`post-drop-checklist.md`](./post-drop-checklist.md) before requesting review.

## Acceptance criteria (from [#4](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/4))

- [ ] Extract `Generate TypeScript for Design.zip` (#1) into repo root
- [ ] `package.json.name` -> `@lornu-ai/aivcs-human-in-the-loop`
- [ ] Delete `pnpm-workspace.yaml` and `pnpm.overrides` block in `package.json`
- [ ] Pin Bun version in `package.json` `engines`
- [ ] `bun install` produces `bun.lockb`
- [ ] Move `src/imports/image.png` -> `docs/design/aivcs-mockup.png` and update imports
- [ ] Confirm `figmaAssetResolver()` in `vite.config.ts` is wired to `src/assets/` (or remove if unused)
- [ ] Replace `index.html` `<title>` and `<meta description>` with aivcs-specific copy
- [ ] Set `<meta name="robots">` to `index, follow` (Figma exported `noindex, nofollow`)
- [ ] `bun run dev` renders the mockup
- [ ] `bun run build` succeeds with no type errors
