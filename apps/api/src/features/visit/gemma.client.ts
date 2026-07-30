// infra/gemma.client.ts
import { GoogleGenAI, Type } from '@google/genai';
import { validate, type ReportDTO } from '@inspection/shared';
import { ENV } from '../../core/env';

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
const MODEL = 'gemma-4-31b-it';

// ---------------------------------------------------------------------------
// Transcription — one audio clip in, one caption string out.
// ---------------------------------------------------------------------------

export async function transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Transcribe this audio clip. The speaker is a field inspector describing a site defect. Return only the transcript text, cleaned up into a single sentence or two — no filler words, no "um"s, no preamble.',
          },
          {
            inlineData: {
              mimeType,
              data: buffer.toString('base64'),
            },
          },
        ],
      },
    ],
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('Gemma returned an empty transcription');
  }
  return text;
}

// ---------------------------------------------------------------------------
// Report generation — evidence (images + captions) in, structured report out.
// Uses responseSchema so Gemma is constrained to valid JSON at the API level,
// then we still run it through zod as a second, independent check.
// ---------------------------------------------------------------------------

interface EvidenceInput {
  imageBuffer: Buffer;
  mimeType: string;
  caption: string | null;
}

const GEMMA_REPORT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] },
    defects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          location: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] },
          description: { type: Type.STRING },
        },
        required: ['type', 'location', 'severity', 'description'],
      },
    },
    recommendation: { type: Type.STRING },
    needsReview: { type: Type.BOOLEAN },
  },
  required: ['summary', 'severity', 'defects', 'recommendation', 'needsReview'],
};

export async function generateReport(
  siteName: string,
  notes: string | null,
  evidence: EvidenceInput[]
): Promise<ReportDTO> {
  const prompt = buildInspectionPrompt(
    siteName,
    notes,
    evidence.map((e) => ({ caption: e.caption }))
  );

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          ...evidence.map((e) => ({
            inlineData: {
              mimeType: e.mimeType,
              data: e.imageBuffer.toString('base64'),
            },
          })),
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: GEMMA_REPORT_SCHEMA,
    },
  });

  const raw = response.text;
  if (!raw) {
    throw new Error('Gemma returned an empty report response');
  }

  const parsed = JSON.parse(raw);
  return validate.reportSchema.parse(parsed);
}


export function buildInspectionPrompt(
  siteName: string,
  notes: string | null,
  evidence: { caption: string | null }[]
) {
  return `You are a civil engineering inspection assistant. You are given
${evidence.length} photo(s) from a field site visit and optional notes.
Analyze the evidence as a qualified inspector would.

Site: ${siteName}
Inspector notes: ${notes ?? "none provided"}
Photo captions (in order): ${evidence
    .map((e, i) => `${i + 1}. ${e.caption ?? "no caption"}`)
    .join("; ")}

For each distinct defect visible across the photos, identify:
- type (e.g. crack, spalling, corrosion, drainage blockage, joint failure)
- approximate location, based on captions/notes if given
- severity: LOW, MODERATE, HIGH, or CRITICAL
- a one-sentence description

Then produce an overall site severity (the highest defect severity, unless
combined defects suggest a compounding risk) and a short recommendation
for next steps.

If evidence is ambiguous or insufficient to make a confident call on any
defect, set needsReview to true and say so in the summary rather than
guessing.

Respond ONLY with JSON matching this shape, no other text:
{
  "summary": string,
  "severity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "defects": [{ "type": string, "location": string, "severity": string, "description": string }],
  "recommendation": string,
  "needsReview": boolean
}`;
}