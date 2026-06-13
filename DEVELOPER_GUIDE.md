# Developer Guide — `aivcs-human-in-the-loop`

This guide provides a comprehensive manual for developers and coding agents working on the `aivcs-human-in-the-loop` repository. It covers local environment setup, architecture, coding guidelines, local validation gates, and delivery patterns.

---

## 1. Overview & Architecture

The `aivcs-human-in-the-loop` application is a single-page web app built with **React**, **TypeScript**, and **Vite**. It provides a visual frontend for human supervisors to monitor and direct autonomous Git operations, PR reviews, CI pipelines, and audit trails.

### Tech Stack
* **Language:** TypeScript (configured in strict mode, `verbatimModuleSyntax: true`)
* **Runtime / Bundler:** Bun (version `>= 1.1.0`) + Vite (v6)
* **Styling:** Tailwind CSS (v4) + Vanilla CSS (`src/styles/theme.css`)
* **UI Components:** Radix UI primitives + shadcn/ui custom components
* **API Integration:** Dynamic client hooks in `src/lib/api` fronting the `aivcs-api` facade

### Directory Layout
```
.
├── .github/                # GitHub Action workflows (CI, OCI build, semantic PRs)
├── docs/                   # Documentation and designs
├── k8s/                    # Kubernetes manifests
│   ├── base/               # Base deployment, service, HTTPRoute
│   └── overlays/           # Env overlays (dev, prod) with patches
├── src/
│   ├── app/
│   │   ├── App.tsx         # Main application container
│   │   └── components/     # UI Components
│   │       ├── ui/         # Reusable shadcn/ui components
│   │       └── *.tsx       # Product-specific panels (PRDiffPanel, AuditTrail, etc.)
│   ├── lib/
│   │   └── api/            # API client hooks, types, mocks, and schema
│   ├── styles/             # Stylesheets (index.css, theme.css, tailwind.css)
│   └── main.tsx            # Application entrypoint
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Local Environment Setup

Since the repository uses **Bun** exclusively, you must use Bun command-line utility for all package management and scripting.

### Prerequisite
Install Bun locally (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation
Clone the repository and install all dependencies:
```bash
bun install
```

### Script Shorthands

| Command | Action |
|---------|--------|
| `bun run dev` | Starts the Vite development server (usually at http://localhost:5173) |
| `bun run build` | Compiles TypeScript and bundles assets for production into `dist/` |
| `bun run preview` | Serves the production build locally to test/preview |
| `bun run typecheck` | Runs the TypeScript compiler in dry-run mode (`tsc --noEmit`) |

---

## 3. Style & Code Conventions

Every modification must align with the code styling standards to ensure clean compilation under strict compiler rules.

### TypeScript Strict Purity
We run with `"verbatimModuleSyntax": true` in `tsconfig.json`. This means:
* Imports that are only used at type-level **must** be explicitly marked as `import type`.
* Failing to do so causes the bundler to retain unused imports in the runtime bundle, triggering lint errors or dead code compilation.

**Correct:**
```typescript
import type * as React from "react";
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  // ...
}
```

**Incorrect:**
```typescript
import * as React from "react"; // Error: React is only used in type position
```

### Stable React Keys
When mapping lists of items (comments, activities, checks, or files), **never use the array index (`i`) as the React key**. Using index keys is a latent bug that breaks DOM updates and state preservation when items are updated, reordered, or deleted.
* For comments/messages: Use `${comment.role}-${comment.at}-${index}` or a unique ID.
* For activity logs: Use `${activity.id}`.
* For diff lines: Use `${index}-${line.lineOld}-${line.lineNew}`.

### Accessibility (a11y)
* Ensure all interactive icon-only elements (e.g. buttons with SVG icons and no visible text) have explicit descriptive labels via `aria-label` or screen-reader text.
* Example:
```html
<button type="button" aria-label="Notifications">
  <Bell size={12} />
</button>
```

---

## 4. Local Validation Gates (Mandatory)

Before pushing any commit to remote, contributors and automated agents must run local checks to ensure the build remains green.

### Recommended Tool: `local-ci`
The repository is pre-configured with the [`local-ci`](https://github.com/stevedores-org/local-ci) tool. Run it at the root of the project:
```bash
local-ci
```

### Manual Validation Fallback
If `local-ci` is not installed or available, manually run:
```bash
# Typecheck
bun run typecheck

# Build
bun run build
```

### Commits & Pull Requests
* **Target Base:** All PRs must target the `develop` branch.
* **Commit Message Standard:** We follow Conventional Commits (`type(scope?): description`). Avoid using emojis in commit messages or manifests.

---

## 5. Deployment & OCI Images

### Strictly No `Dockerfile`
As per organizational standards, container images are produced using [dockworker.ai](https://dockworker.ai) via the [`dockworker.toml`](./dockworker.toml) configuration.
* **Never** add or introduce a `Dockerfile` to the repository.
* The OCI build is driven by Nix (`flake.nix`) and serves the SPA bundle via Caddy in a lightweight, secure container.

### Kubernetes Layout (`k8s/`)
Deployment manifests are managed via Kustomize:
* `k8s/base/`: Base configurations containing the Deployment, ClusterIP Service, and HTTPRoute.
* `k8s/overlays/dev/`: Developer overlay targeting the `aivcs-hitl-dev` namespace with the `develop` image tag.
* `k8s/overlays/prod/`: Production overlay targeting `aivcs-hitl-prod` with the `latest` tag and resource overrides.
