# AIVCS Swarm Governance & Agent Registry
# ID: LORNU-AIVCS-2026

## 1. Pre-Push Validation (MANDATORY)

**Run `local-ci` before pushing any branch or opening a PR.** This is the canonical pre-push gate for every contributor and coding agent (such as Antigravity, Claude, Codex, Jules, etc.).

```bash
local-ci            # run all enabled stages from .local-ci.toml
local-ci --fix      # apply auto-fixes where supported
```

Install `local-ci` via:
```bash
go install github.com/stevedores-org/local-ci@latest
```

**The rule:** if `local-ci` is red, do not push. Either fix the failure or, with a documented reason, `--skip` the stage. Do not push a known-red PR with the expectation that GitHub CI will surface the same failure — that wastes reviewer time and burns CI minutes on issues you could have caught in seconds locally.

## 2. Agent Registry & Roles
- **Antigravity**: Primary agentic AI coding assistant responsible for scaffolding, implementing features, and maintaining CI/CD configurations.
- **Human-in-the-Loop Supervisor**: Responsible for approving actions, reviewing PRs, and auditing agent intents.
