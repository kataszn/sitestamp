# SiteStamp 🔍

![Gemma 4](https://img.shields.io/badge/AI-Gemma%204-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6)
![License](https://img.shields.io/badge/License-MIT-green)

[![SiteStamp demo video](https://img.youtube.com/vi/QdnxiwtwRCw/maxresdefault.jpg)](https://www.youtube.com/watch?v=QdnxiwtwRCw)

> AI-powered infrastructure inspection platform that transforms multimodal field evidence into trustworthy engineering reports with evidence-backed findings and historical asset intelligence.

Built for the **Build with Gemma Hackathon Series (2026)** using **Gemma 4**.

---

## Features

- 📷 Capture inspection evidence with photos
- 🎤 Record voice observations with automatic transcription
- 🧠 Generate multimodal engineering inspection reports using Gemma 4
- 📋 Structured reports with severity assessment and repair recommendations
- 🔍 Click defects to highlight supporting inspection evidence
- 📈 Historical asset assessment with inspection trend visualization
- 🏷️ Asset codes for tracking infrastructure across multiple inspections
- 🔄 Regenerate reports from existing inspection data
- 🔗 Share reports through view-only links
- 📄 Export clean, printable inspection reports
- ☁️ Pluggable evidence storage (Local or Cloudinary)

---

## Project Structure

```text
.
├── apps/
│   ├── api/          # Express API, AI orchestration & persistence
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared schemas, types & utilities
├── turbo.json
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|------|------------|
| AI | Gemma 4 (`gemma-4-31b-it`) + Gemini Flash (voice transcription) |
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, Prisma |
| Database | PostgreSQL |
| Storage | Local filesystem or Cloudinary |
| Validation | Zod + structured JSON generation (`responseSchema`) |
| Monorepo | Turborepo + pnpm Workspaces |
| Deployment | Vercel, Render, Neon |

---

## Highlights

SiteStamp is built around a simple principle:

> **For public infrastructure, trustworthiness matters more than AI capability.**

Rather than producing free-form AI responses, SiteStamp generates structured engineering reports where:

- Every defect is linked back to the supporting inspection evidence.
- Reports can explicitly flag uncertainty instead of guessing.
- Historical inspections are summarized into asset-level trends.
- Deterministic backend validation ensures reports conform to a strict schema before being stored.

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm

### Installation

```bash
git clone <repository-url>

cd sitestamp

pnpm install
```

Copy the environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Configure your API credentials:

```text
GOOGLE_API_KEY=your_api_key_here

# Optional
CLOUDINARY_URL=...
```

Start the development servers:

```bash
pnpm dev
```

---

## Development URLs

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:4000 |
| Swagger | http://localhost:4000/docs |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all applications |
| `pnpm build` | Build the workspace |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run tests |

---

## Architecture

```text
Inspector
    │
    ▼
Inspection Session
    │
    ├── Photos
    ├── Voice Notes
    └── Text Notes
            │
            ▼
     Backend Orchestrator
            │
            ├── Voice Transcription
            ├── Prompt Assembly
            ├── Gemma 4
            ├── Schema Validation
            └── Historical Asset Lookup
                    │
                    ▼
        Structured Engineering Report
                    │
                    ▼
Interactive Evidence-backed Report
```

---

## Repository

This project uses a Turborepo monorepo with shared packages between the frontend and backend.

```
apps/
  api/        Express API, AI orchestration & persistence
  web/        React application
packages/
  shared/     Shared types, schemas and utilities
```

---

## Acknowledgments

Sample inspection imagery used for demo and screenshot purposes is sourced from the
**dacl10k** dataset (Flotzinger, J., Rösch, P. J., & Braml, T. (2023). *dacl10k: Benchmark
for Semantic Bridge Damage Segmentation*. [arXiv:2309.00460](https://arxiv.org/abs/2309.00460)),
used under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). These images are
not redistributed in this repository.

Built for [Build with Gemma: TFUG Prayagraj [AI Prayagraj]](https://www.kaggle.com/competitions/build-with-gemma-tfug-prayagraj-ai-prayagraj), using Gemma 4 and the Gemini API.

---

## License

MIT
