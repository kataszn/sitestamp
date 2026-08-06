# SiteStamp - Trustworthy AI for Public Infrastructure Inspection
**Team**: kataszn
**Track:** GenAI for Good
**Repository:** https://github.com/kataszn/sitestamp
**Live demo:** https://sitestamp-web.vercel.app/
**Models:** Gemma 4 31B (`gemma-4-31b-it`) + Gemini 3.6 Flash (voice transcription)

---
## What is SiteStamp?

SiteStamp is an AI inspection assistant for civil engineers and public works inspectors. It transforms a complete inspection site visit into a structured engineering report with traceable findings, severity assessment, and repair recommendations. Every defect is linked back to the evidence that supports it, allowing engineers to verify AI-generated conclusions instead of simply trusting them.

## The Problem

Public infrastructure, including bridges, culverts, and roads, depends on inspection to stay safe, and inspection capacity is the real bottleneck. A field engineer visits a site and has to synthesize scattered evidence, including photos taken in the moment, handwritten or verbal notes, and prior knowledge of the site, into a coherent assessment: what's wrong, how bad is it, and what should happen next. In low connectivity environments common across infrastructure inspection work, this synthesis often happens hours or days after the visit, from memory, against a blank report template, turning civic maintenance into a process that runs on inconsistent, hard to verify paperwork.

The core interaction is a session, not a chat. An inspector opens a Visit, uploads evidence as they walk the site, a photo plus optionally either a text or voice note, and when the visit is done, triggers a single "Generate Report" call. That one call sends the full evidence set to Gemma 4 in a single multimodal request and returns a structured report: overall severity, an executive summary, individual defect findings, engineering recommendations, and the supporting evidence for each. This single batched call is deliberate, not a chattier multi-turn loop: it keeps cost and latency bounded to one synthesis call per visit, and it lets Gemma reason over the whole body of evidence at once, the way a human inspector actually would, recognizing that spalling on two piers plus a blocked drain together point to one systemic water-management problem rather than three unrelated issues.

## Why Gemma 4?

The decisive question: why not just paste photos into a general chatbot?

Because a maintenance authority isn't going to allocate emergency budget off a chat transcript. They need something closer to a report: structured, consistent, and checkable. That means the model output has to be constrained and validated, not free text, and every claim needs a traceable source. That's a synthesis and reliability problem, not a conversation, and it's what SiteStamp is built around.

We chose Gemma 4 31B specifically because:

- **It reasons over the whole evidence set at once**, recognizing systemic problems across photos rather than captioning them in isolation.
- **It supports schema-constrained generation.** Gemma can be required to return a specific JSON shape, not prose we'd have to parse heuristically.
- **It's honest under the right prompt.** With the right instruction, it sets a review flag instead of guessing when evidence is ambiguous, rather than fabricating a confident answer.

## Architecture: The Split of Responsibility

The core design decision: **deterministic code owns storage, files, and traceability; Gemma owns synthesis and judgment.**

What deterministic code does (never the model):
- Store evidence, visit metadata, and completed reports
- Resolve Gemma's photo-index references back to real evidence records for the UI
- Validate every model response against a Zod schema before it's ever persisted
- Enforce the "one synthesis call per inspection session" pattern, with no chattier multi-turn loop
- Render the report and drive the click-to-evidence interaction

What Gemma does (only the model can):
- Synthesize multiple photos, notes, and voice transcripts into one coherent assessment
- Assign defect type, location, severity, and a recommendation
- Decide, per finding, which submitted photos support it
- Flag its own uncertainty when evidence is insufficient

This split means the UI is never raw model text, and evidence citations are never left to the model's memory of an opaque ID, as explained below.

## Technical Implementation

**Multimodal synthesis.** Every evidence photo goes to `gemma-4-31b-it` as inline image data, alongside a prompt built from the site name, inspector notes, and each photo's note (typed or transcribed from voice). The response is constrained via the Gemini API's `responseSchema` mechanism and independently re-validated with Zod on the backend. Schema-constrained generation reduces malformed output but doesn't guarantee it, and a live demo is the wrong place to find that out.

**Evidence-to-defect grounding.** Each defect includes the *indices* of the photos supporting it, resolved by the backend to real evidence IDs for the click-to-highlight interaction. The first version had Gemma emit real database IDs (opaque CUID strings) directly, and this measurably degraded JSON reliability, since reproducing random-looking string identifiers correctly inside a nested array is a much harder generation target than it looks. Switching to small integer indices, resolved server-side, fixed this entirely while preserving full traceability.

**Self-reported uncertainty.** The prompt explicitly instructs Gemma to set `needsReview: true` rather than guess when evidence is ambiguous. In testing, this fired correctly. One report flagged that it couldn't confirm the condition of cable saddles because no photo showed them, rather than fabricating a finding.

**Two models, two jobs.** Voice notes are transcribed with `gemini-3.6-flash`, not Gemma. Gemma 4's audio input is only enabled on its E2B/E4B edge-deployment variants, which are not exposed through the hosted Gemini API this project uses. We discovered this after receiving a live `400 INVALID_ARGUMENT: Audio input modality is not enabled for this model` response from `gemma-4-31b-it`, confirmed it against Google's capability documentation, and routed transcription to a model built for audio input rather than dropping the feature.

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
- **Structure is enforced twice.** Schema-constrained generation on the API side, then independently re-validated with Zod: belt and suspenders on the one call the whole product depends on.
- **We chose the slower model on purpose.** A side-by-side test of `gemma-4-31b-it` (55s) against the faster `gemma-4-26b-a4b-it` (32s) on identical evidence showed the smaller model hallucinating a specific bridge name it was never given, and silently dropping an uncertainty flag the larger model correctly raised. Speed lost.

## Challenges & Solutions

**Evidence IDs broke JSON reliability.** Opaque CUID strings inside a nested array were a harder generation target than expected. Solved with integer photo indices resolved server-side, see Technical Implementation.

**Gemma 4's audio input wasn't where we assumed.** A live `400` error revealed audio support only exists on E2B/E4B, not the hosted models. Solved by routing transcription to Gemini Flash while keeping Gemma responsible for all multimodal reasoning.

**We chose humility over completeness.** Early prompt iterations rewarded Gemma for producing a fully filled-out report; every field populated, every defect assessed. That pushed it toward guessing on ambiguous evidence rather than admitting a gap. We rewrote the prompt to explicitly reward saying "I can't confirm this" over a confident wrong answer, which is what made `needsReview` actually trustworthy instead of a flag that never fires.

## Why This Matters

Public infrastructure is only as safe as it is inspected, and inspection capacity, not willingness, is usually the bottleneck. Every hour an engineer spends turning scattered photos and notes into a formal report is an hour not spent on the next site. In resource-constrained environments, that tradeoff compounds: fewer assets get inspected, and the reports that do get written are harder to verify. SiteStamp doesn't replace engineering judgment; it gives a maintenance authority a faster, more consistent, more traceable basis to act on.

## What Makes SiteStamp Different

Most AI inspection concepts stop at "photo in, caption out." SiteStamp treats the harder problem as the actual product: synthesizing a *session's* worth of fragmented evidence into one coherent, checkable assessment. The guidance isn't a chatbot; it's a structured document a maintenance authority could act on, with every claim traceable to its source and every gap in the evidence honestly flagged rather than papered over.

For a field engineer documenting a bridge after a long site visit, SiteStamp reduces hours of manual report writing to a single evidence-backed synthesis step while preserving the engineer's ability to verify every conclusion.

---
*Built for Build with Gemma: TFUG Prayagraj [AI Prayagraj], 2026.*
