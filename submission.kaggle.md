# SiteStamp: Multimodal Field Inspection Reports, Grounded in Evidence

### A Gemma 4-powered assistant that turns photos, notes, and voice memos from a site visit into a structured, defensible inspection report — with every finding traceable back to the supporting evidence.

## The Problem

Infrastructure inspection is a judgment-heavy, paper-heavy process. A field engineer visits a site — a bridge, a culvert, a stretch of road — and has to synthesize scattered evidence (photos taken in the moment, handwritten or verbal notes, prior knowledge of the site) into a coherent assessment: what's wrong, how bad is it, what should happen next. In low-connectivity environments common across Nigerian infrastructure work, this synthesis often happens hours or days after the visit, from memory, against a blank report template.

Two things make this hard to do well and consistently:

1. **Evidence lives in fragments.** Three photos and a mumbled voice note about water damage don't assemble themselves into "this bridge has an active water-ingress problem with an expansion-joint failure downstream of it." That synthesis is manual, slow, and varies with how tired the inspector is that day.
2. **Trust requires traceability.** A report that says "critical spalling observed" is only useful if someone can verify *which* photo that claim is based on. Most digital inspection tools either skip this link entirely or make it a manual tagging chore.

SiteStamp addresses both: it collects evidence the way an inspector naturally gathers it — multiple photos, optional typed or spoken notes, free-text notes — and produces one synthesized report where every defect is clickable back to its source photo. The goal is not to replace engineers, but to reduce documentation effort while producing more consistent, traceable reports.

## Our Solution

The core interaction is a **session, not a chat**. An inspector opens a Visit, uploads evidence as they walk the site (a photo plus optionally either a text or voice note), and when the visit is done, triggers a single "Generate Report" call. That one call sends the full evidence set — every photo, every evidence note, any site notes — to Gemma 4 in a single multimodal request, and gets back a structured report: overall severity, an executive summary, individual defect findings, engineering recommendations, and the supporting evidence for each.

Each reported defect can be selected to automatically highlight and scroll to the evidence that supports it, improving transparency and making it easier for engineers to validate AI-generated conclusions.

This "batch collect, synthesize once" pattern was a deliberate choice over a chattier, multi-turn agent loop. It keeps cost and latency bounded to one call per visit, and — most importantly — it lets Gemma reason over the *whole* body of evidence at once, the way a human inspector actually would, recognizing that spalling on two different piers plus a blocked drain together indicate one systemic water-management problem, not three unrelated issues.

---

## Gemma 4 Integration

Gemma 4, specifically `gemma-4-31b-it`, is the synthesis engine the entire product exists to showcase.

**Multimodal synthesis.** `generateReport` sends every evidence photo as inline image data alongside a prompt built from the site name, inspector notes, and each photo's evidence note (typed or transcribed from voice) to `gemma-4-31b-it`. The response is constrained using the Gemini API's `responseSchema` mechanism — Gemma must return a specific JSON shape (summary, severity enum, typed defect array, recommendation, boolean review flag) rather than free text we'd have to parse heuristically. We additionally validate every response through a Zod schema on the backend as an independent check — schema-constrained generation reduces malformed output but doesn't guarantee it, and a hackathon demo is the wrong place to discover that the hard way.

**Self-reported uncertainty.** The prompt explicitly instructs Gemma to set `needsReview: true` rather than guess when evidence is ambiguous or insufficient. In testing, this worked exactly as intended — one report noted it couldn't confirm the condition of cable saddles because no photo showed them, and flagged itself for review instead of fabricating a finding. This mattered enough to become a first-class UI element: flagged reports get a visible banner, not a buried field.

**Evidence-to-defect grounding.** The most technically interesting piece: each defect includes the *indices* of the photos that support it (`evidenceIndices: number[]`), which the frontend resolves to real evidence IDs to highlight the corresponding photo on click. We initially had Gemma emit real database IDs (opaque CUID strings) directly into the defect list, and this measurably degraded JSON reliability — reproducing random-looking string identifiers correctly inside a nested array is a much harder generation target than it looks. Switching to small integer indices, resolved to real IDs in a deterministic backend step after generation, fixed this entirely while preserving full traceability. It's a good example of designing *around* a model's actual failure modes rather than fighting them with a longer prompt — a fix only found by building the feature end-to-end and watching it break first.

**Two models, two jobs.** Voice notes are transcribed via `gemini-3.6-flash`, not Gemma — because audio input on Gemma 4 is only wired up in the E2B/E4B edge-deployment variants, distributed for local/on-device inference (Hugging Face Transformers, Ollama, LiteRT) and not exposed through the hosted Gemini API this project runs on. We discovered this from a live `400 INVALID_ARGUMENT: Audio input modality is not enabled for this model` response against `gemma-4-31b-it`, confirmed against Google's own Gemma capability documentation. Rather than dropping the voice-note feature, we routed transcription to a model actually built for that input, keeping Gemma 4 responsible for 100% of the multimodal reasoning over the assembled evidence — the task it's strongest at. We see this as a more honest architecture than forcing one model to do a job it isn't built for.

---

## Architecture

```
Inspector

↓

Inspection Session

↓

Backend Orchestrator

↓

Gemma 4

↓

Structured JSON Report

↓

Interactive Report UI
```

The backend is a lightweight orchestration layer: it stores inspection metadata, manages evidence uploads, performs voice transcription, invokes Gemma for multimodal reasoning, validates the returned structured data, and persists the completed report. The frontend focuses on evidence collection and report visualization.

When the inspector selects **Generate Report**, the system sends site information, inspector notes, transcribed voice notes, and every inspection image to `gemma-4-31b-it` in one request, and receives structured JSON describing severity, summary, defects, recommendations, and review status — validated, then rendered as the final report.

SiteStamp uses hosted Gemma models for simplicity, but the same session-based architecture can target local/edge Gemma models (such as the E2B/E4B variants) for offline field inspections in low-connectivity environments.

---

## Technical Highlights

**Session-based reasoning.** Accumulating all evidence into one session, rather than calling the model per upload, lets Gemma reason across observations simultaneously and keeps cost/latency bounded to one call per visit.

**Structured outputs.** `responseSchema`-constrained JSON, re-validated with Zod, makes results deterministic and suitable for future integrations with asset management systems — rather than free-form text.

**Human-in-the-loop.** SiteStamp is designed as an assistant, not an autonomous decision-maker; the `needsReview` mechanism above is the concrete expression of this.

---

## Challenges Overcome

Beyond the audio-modality discovery detailed above, two decisions stood out as right despite adding short-term friction:

- **We chose accuracy over speed.** A side-by-side test of `gemma-4-31b-it` (55s) against the faster `gemma-4-26b-a4b-it` (32s) on identical evidence showed the smaller model hallucinating a specific bridge name it was never given, and silently dropping an uncertainty flag the larger model correctly raised. For a tool whose entire value proposition is trustworthiness, we kept the slower, more careful model everywhere it touches the actual submission.
- **We kept storage boring on purpose.** Evidence files are stored on local disk via multer, not a cloud bucket, deliberately, since this is a public hackathon repository and we didn't want judges needing a Cloudinary or S3 account just to run the project. Nothing about the Gemma integration depends on where bytes are stored; images are base64-encoded from disk into each request either way.
- **We chose humility over completeness**. Early prompt iterations rewarded Gemma for producing a fully filled-out report; every field populated, every defect assessed. That pushed it toward guessing on ambiguous evidence rather than admitting a gap. We rewrote the prompt to explicitly reward saying "I can't confirm this" over a confident wrong answer, which is what made `needsReview` actually trustworthy instead of a flag that never fires.

## Why This Matters

A report generated by SiteStamp reads like something a careful inspector wrote by hand — but it took one synchronous call instead of an evening of transcription, and every claim in it can be clicked back to the photo it came from. For infrastructure maintenance in resource-constrained environments, where inspection capacity is the real bottleneck, that combination — faster documentation, and *more*, not less, verifiability — is the actual value proposition.

---

## Track Fit

Submitted under **Multimodal Application** — the core mechanism (synthesizing multiple images, transcribed voice, and text into one grounded structured output) is a direct match for the track's criteria and reflects exactly what the system does end to end.

## Links

- [SiteStamp Github Repo](https://github.com/kataszn/sitestamp)
- [SiteStamp Live Demo](https://youtube.com/sitestamp)