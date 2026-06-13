# aivcs-human-in-the-loop

Human-in-the-loop UI for [aivcs](https://github.com/stevedores-org/aivcs) — the AI Agent Version Control System.

Surfaces agent branches, PR diffs, agent intent threads, CI checks, and the append-only audit trail to humans who review agent PRs.

## Architecture

```
┌────────────────────────────────────┐
│ aivcs-human-in-the-loop  (this)    │   Vite + React + TS + shadcn/ui
│   bun build → OCI (dockworker)     │
└────────────────┬───────────────────┘
                 │ HTTPS, Lornu SSO JWT
                 ▼
┌────────────────────────────────────┐
│ stevedores-org/aivcs-api           │   TS + Bun + Hono
│   facade, auth, rate limiting      │
└────────────────┬───────────────────┘
                 │ service-binding token
                 ▼
┌────────────────────────────────────┐
│ lornu-ai/lornu-ai-data-fabric      │   Cloudflare Worker + D1
│   commits, branches, events        │
└────────────────────────────────────┘
```

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind 4 + shadcn/ui (Radix primitives)
- **Runtime:** Bun (>= 1.1)
- **Build:** Vite → OCI image via `dockworker` (no Dockerfile)
- **Deploy:** Kubernetes via Crossplane + Flux + ESO + OIDC (Lornu standard)

## Local dev

```bash
bun install
bun run dev          # http://localhost:5173
bun run build
bun run typecheck
```

## Status

This scaffold landed from a Figma-Make export. The design source-of-truth — Figma mockup + a screenshot — lives in [#1](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/1); intentionally not committed to keep clone size small. All components render with mock data. The mock-to-API wiring lands in [#8](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/8). See [#2](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/2) for the full plan.

## Branching

PRs base on `develop`. `develop → staging → main`. `AGENTS.md` lands in [#5](https://github.com/stevedores-org/aivcs-human-in-the-loop/issues/5).
