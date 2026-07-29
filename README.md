# Inspection AI 🔍

> AI-powered inspection report generation — built for a hackathon.

## Structure

```
├── apps/
│   ├── api/          # Backend API
│   └── web/          # Frontend (Next.js)
├── packages/
│   └── shared/       # Shared types & utilities
├── turbo.json        # Turborepo config
└── package.json      # Root workspace
```

## Getting Started

```bash
pnpm install
pnpm dev
```

- **Web** — [http://localhost:3000](http://localhost:3000)
- **API** — [http://localhost:4000](http://localhost:4000)

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Run all apps in dev mode |
| `pnpm build`   | Build all packages       |
| `pnpm lint`    | Lint all packages        |

## Stack

- **Monorepo** — Turborepo + pnpm workspaces
- **Frontend** — Next.js (TypeScript)
- **Backend** — Node.js (TypeScript)
- **Shared** — Common types & utilities