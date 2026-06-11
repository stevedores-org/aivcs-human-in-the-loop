# CLAUDE.md — AIVCS Developer Guidelines

## Build & Test Commands
- **Install dependencies**: `bun install`
- **Start development server**: `bun run dev`
- **Build production bundle**: `bun run build`
- **Run typecheck**: `bun run typecheck`
- **Run linter**: `bun run lint`
- **Run tests**: `bun run test`

## Code Style & Guidelines
- **Language**: TypeScript (`.ts`, `.tsx`) for all logic and components.
- **Styling**: Vanilla CSS for layouts and styling (themes are defined in `src/styles/theme.css`).
- **Imports**: Clean import organization. No unused imports.
- **Git Protocol**: No emojis in commit messages. Follow Conventional Commits format (e.g. `feat: add support for audit logs`).
- **Verification**: Run `local-ci` locally before proposing any commit or push.
