# SiteStamp - Trustworthy AI for Public Infrastructure Inspection

**Track:** GenAI for Good
**Repository:** https://github.com/kataszn/sitestamp
**Models:** Gemma 4 31B (`gemma-4-31b-it`) + Gemini 3.6 Flash

---
## What is SiteStamp?

**SiteStamp** is an AI-powered infrastructure inspection platform for civil engineers and public works inspectors, combining multimodal evidence, grounded reporting, and historical asset intelligence into a single inspection workflow. It turns field visits into evidence-backed engineering reports with traceable defects, severity assessments, repair recommendations, and historical asset context.

## The Problem

Public infrastructure, including bridges, culverts, and roads, depends on regular inspection to remain safe, but inspection capacity is the real bottleneck. Field engineers must synthesize scattered evidence including photos, handwritten or voice notes, and prior knowledge into a single assessment: what is wrong, how severe it is, and what should happen next. In the low-connectivity environments where inspections are common, that synthesis often happens hours or days later from memory and a blank report template, resulting in inconsistent, difficult-to-verify documentation.

SiteStamp is built around an inspection session, not a chat. An inspector creates a Visit, uploads evidence while walking the site, typically a photo with optional text or voice notes, then triggers a single **Generate Report** action. That request sends the complete evidence set to Gemma 4 as one multimodal prompt and returns a structured engineering report with severity assessments, summaries, defect findings, repair recommendations, and traceable supporting evidence.

The workflow is intentionally bounded. Aside from one optional follow-up if Gemma requests prior inspection history, the model reasons over the complete evidence set in a single pass, mirroring how an engineer inspects a site. It can recognize that spalling on multiple piers and a blocked drain indicate one systemic issue rather than three unrelated defects.


## Why Gemma 4?

The key question is why not use a general chatbot? Because maintenance authorities do not allocate repair budgets from chat transcripts. They need reports that are structured, consistent, and auditable. Every finding must be traceable to supporting evidence, with outputs that are constrained and validated rather than free-form text. This is a reliability and synthesis problem, not a conversational one, and SiteStamp is designed accordingly.

We chose **Gemma 4 31B** because it:

- **Reasons over the complete evidence set** instead of evaluating one photo at a time.
- **Supports schema-constrained output**, producing structured JSON instead of free-form text that requires heuristic parsing.
- **Handles uncertainty appropriately**, flagging findings for review when evidence is ambiguous instead of fabricating confident conclusions.
- **Requests additional context only when needed**, using a single tool to retrieve prior inspection history only when it improves the assessment.


## Architecture: The Split of Responsibility

The core design decision: **deterministic code owns storage, files, and traceability; Gemma owns synthesis and judgment.**

What deterministic code does (never the model):
- Store evidence, visit metadata, and completed reports, and resolve Gemma's photo indices back to real records for the UI
- Validate every model response against a Zod schema before it's ever persisted
- Decide which tool, if any, Gemma is offered, capped at one round trip
- Render the report and drive the click-to-evidence interaction

What Gemma does (only the model can):
- Synthesize multiple photos, notes, and voice transcripts into one coherent assessment
- Assign each defect's type, location, severity, description, and which photos support it
- Flag its own uncertainty when evidence is insufficient
- Decide whether prior inspection history would improve its assessment

This split means the UI is never raw model text, and evidence citations are never left to the model's memory of an opaque ID, as explained below.

## Technical Implementation

**Multimodal synthesis.** Every evidence photo is sent to `gemma-4-31b-it` as inline image data alongside the site name, inspector notes, and each photo's note, whether typed or transcribed. Responses are constrained using the Gemini API's `responseSchema` and independently validated with Zod on the backend. Schema-constrained generation greatly reduces malformed output, but does not eliminate it, so server-side validation remains essential.

**Evidence-to-defect grounding.** Each defect references the indices of its supporting photos, which the backend resolves to evidence IDs for click-to-highlight interactions. An earlier version had Gemma emit database IDs directly as opaque CUID strings. That significantly reduced JSON reliability because reproducing arbitrary identifiers inside nested structures is a surprisingly difficult generation task. Replacing them with small integer indices and resolving them server-side preserved full traceability while improving output reliability.

**Agentic history lookup.** When an asset code is available, Gemma is given a single tool, `get_site_history`, and decides whether prior inspections would improve its assessment. If invoked, the backend returns lightweight summaries containing only the inspection date, severity, and a one-line summary. Results are strictly limited to inspections that occurred before the current visit date, preventing later repairs from leaking into earlier reports. When history is used, the report includes a `historicalAssessment` with trend analysis, a narrative summary, prior inspection count, and a severity-over-time chart.

**Self-reported uncertainty.** The prompt instructs Gemma to set `needsReview: true` instead of guessing when evidence is insufficient. During testing, the model correctly flagged that cable saddle condition could not be confirmed because no supporting photos were available, rather than inventing a finding.

**Two models, two roles.** Voice notes are transcribed with `gemini-3.6-flash`, while Gemma performs multimodal reasoning. Audio input is currently supported only on Gemma 4's E2B and E4B edge variants, which are unavailable through the hosted API used by this project. Separating transcription from reasoning provides the required functionality without changing the inspection workflow.

### Stack
| Layer | Technology |
| --- | --- |
| Reasoning | Gemma 4 (`gemma-4-31b-it`) |
| Transcription | Gemini 3.6 Flash (`gemini-3.6-flash`) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Frontend | React + Vite + TypeScript |
| Storage | Local filesystem / Cloudinary (environment-selected) |
| Validation | Gemini `responseSchema` + independent Zod re-validation |
| Monorepo | Turborepo + pnpm |
| Deployment | Render, Vercel, Neon (DB) |

## Trust by Design

SiteStamp's core bet is that for civic infrastructure, trustworthiness beats novelty, and that has to be demonstrable, not just claimed:

- **Every finding is clickable.** Click a defect, its supporting photo highlights and scrolls into view. Not "AI said so." Verify it yourself.
- **Uncertainty is visible, not buried.** A `needsReview` report surfaces a banner, not a quiet field a user has to know to look for.
- **Structure is enforced twice.** Schema-constrained generation on the API side, then independently re-validated with Zod, belt and suspenders on every synthesis call.
- **We chose the slower model on purpose.** A side-by-side test of `gemma-4-31b-it` (55s) vs `gemma-4-26b-a4b-it` (32s) showed the smaller model hallucinating a bridge name it was never given, and dropping an uncertainty flag the larger model raised correctly. Speed lost.
- **Sharing is honest about its own limits.** Report links are shareable but unauthenticated in this prototype: anyone with a link can view, not regenerate or edit. Production use would add expiring or signed links.

## Challenges & Solutions

* **Reliable structured output.** Having Gemma emit opaque CUID evidence IDs directly reduced JSON reliability because arbitrary identifiers are difficult generation targets. We replaced them with integer photo indices resolved server-side, preserving full traceability while improving output reliability.

* **Audio support wasn't where we expected.** A live `400` error revealed audio support only exists on E2B/E4B, not the hosted models. We routed voice transcription to Gemini Flash while keeping Gemma responsible for multimodal reasoning.

* **We chose humility over completeness.** Early prompts rewarded Gemma for producing complete reports, which encouraged guesses when evidence was ambiguous. We rewrote the prompt to prefer "I can't confirm this" over a confident wrong answer, making `needsReview` a reliable engineering signal instead of just a UI flag.

## Why This Matters

Public infrastructure is only as safe as it is inspected, and inspection capacity, not intent, is the real bottleneck. Every hour spent turning scattered evidence into a report is an hour not spent inspecting the next asset. In resource-constrained environments, that means fewer inspections, inconsistent documentation, and slower maintenance decisions.

SiteStamp does not replace engineering judgment. It gives engineers and maintenance authorities a faster, more consistent, and fully traceable basis for inspection decisions, with every finding linked to the evidence that supports it.

## What Makes SiteStamp Different

Most AI inspection tools stop at "photo in, caption out." SiteStamp tackles the harder problem: synthesizing an entire inspection session into a single, structured assessment. Instead of analyzing images in isolation, it reasons across photos, notes, and, when available, prior inspections to identify systemic issues, assess severity, and track deterioration over time.

The result is not a chatbot response, but a report a maintenance authority can act on. Every finding is linked to supporting evidence, and every uncertainty is explicitly flagged rather than guessed.

For field engineers, SiteStamp turns hours of manual report writing into a single evidence-backed synthesis step without sacrificing traceability or engineering oversight.

---
*Built for Build with Gemma, TFUG Prayagraj (AI Prayagraj), 2026.*
