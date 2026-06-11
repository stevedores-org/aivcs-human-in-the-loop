# Post-Drop Checklist

Run through this list after the Figma ZIP has been extracted into the repo root per [`figma-drop-instructions.md`](./figma-drop-instructions.md). Each item maps to an acceptance criterion on [#4](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/4).

## 1. Rename the package

Edit `package.json` and set:

```json
"name": "@lornu-ai/aivcs-human-in-the-loop"
```

## 2. Strip pnpm

- Delete `pnpm-workspace.yaml`.
- Remove the `pnpm.overrides` block from `package.json`.
- Remove `pnpm-lock.yaml` if Figma included one.

## 3. Pin Bun

Add `engines` to `package.json` (use the Bun version currently on the Lornu standard stack):

```json
"engines": {
  "bun": ">=1.2.0"
}
```

## 4. Install with Bun

```sh
bun install
```

Confirm `bun.lockb` is created and commit it.

## 5. Relocate the design reference

```sh
git mv src/imports/image.png docs/design/aivcs-mockup.png
```

Then update any `import` statements that referenced the old path. (`docs/design/` already exists in this repo, courtesy of the runway PR.)

## 6. Rewrite `index.html` head

- Replace the Figma-generated `<title>` with aivcs-specific copy, e.g.
  `aivcs — human-in-the-loop for agent-driven VCS`.
- Replace the `<meta name="description">` with a one-line product description.
- Change `<meta name="robots" content="noindex, nofollow">` to
  `<meta name="robots" content="index, follow">`.

## 7. Verify

```sh
bun run dev    # mockup should render at the printed URL
bun run build  # must succeed with zero TS errors
```

## 8. Open the PR

Base on `develop`. Title: `feat(scaffold): drop Figma export`. Body should reference `Closes #4`.
