# InspectAI 🔍

> AI-powered infrastructure inspection platform that transforms field evidence into professional engineering reports using Google's Gemma models.

Built for the **Build with Gemma: AI for Africa Hackathon – Minna 2026**.

---

## Features

- 📷 Capture inspection evidence with photos
- 🎤 Record voice notes (automatically transcribed)
- 🧠 AI-powered multimodal inspection report generation
- 📋 Structured engineering reports with severity assessment
- 🔄 Regenerate reports from existing inspection data
- 📂 Browse completed inspection visits
- 🔍 Click defects to highlight supporting evidence

---

## Project Structure

```text
.
├── apps/
│   ├── api/          # Node.js + Prisma backend
│   └── web/          # React + Vite frontend
├── packages/
│   └── shared/       # Shared types & utilities
├── turbo.json
└── package.json

---

## Tech Stack

* **AI** — Google Gemma 4 + Gemini Flash (voice transcription)
* **Frontend** — React + Vite + TypeScript
* **Backend** — Node.js + Express + Prisma
* **Database** — SQLite
* **Monorepo** — Turborepo + pnpm Workspaces

---

## Getting Started

### Prerequisites

* Node.js 22+
* pnpm

### Installation

```bash
git clone <repository-url>

cd inspectai

pnpm install
```

Copy the example environment file in apps/api/ and apps/web:

```bash
cp .env.example .env
```

Update the following environment variable:

```text
GOOGLE_API_KEY=your_api_key_here
```

Then start the development servers (project root):

```bash
pnpm dev
```

---

## Development URLs

| Service | URL                                            |
| ------- | ---------------------------------------------- |
| Web     | [http://localhost:3000](http://localhost:3000) |
| API     | [http://localhost:4000](http://localhost:4000) |

---

## Available Scripts

| Command      | Description                                |
| ------------ | ------------------------------------------ |
| `pnpm dev`   | Start all applications in development mode |
| `pnpm build` | Build all packages                         |
| `pnpm lint`  | Lint the entire workspace                  |

---

## Repository

This project uses a Turborepo monorepo with shared packages between the frontend and backend.

````
