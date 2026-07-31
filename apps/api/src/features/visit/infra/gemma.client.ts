import { GoogleGenAI, Type, ApiError } from '@google/genai';
import { schema, type ReportDTO } from '@inspectai/shared';
import { ENV } from '../../../core/env';
import { AppError, Errors } from '../../../core/errors';

const ai = new GoogleGenAI({ apiKey: ENV.GOOGLE_API_KEY });

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: ENV.TRANSCRIBE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: 'Transcribe this audio clip. The speaker is a field inspector describing a site defect. Return only the transcript text, cleaned up into a single sentence or two — no filler words, no "um"s, no preamble.',
            },
            {
              inlineData: {
                mimeType,
                data: buffer.toString("base64"),
              },
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    if (!text) {
      throw new AppError(Errors.EMPTY_MODEL_RESPONSE);
    }
    return text;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err instanceof ApiError) {
      throw new AppError(Errors.TRANSCRIPTION_FAILED, { message: err.message });
    }
    throw new AppError(Errors.TRANSCRIPTION_FAILED);
  }
}

export async function generateReport(
  siteName: string,
  notes: string | null,
  evidence: EvidenceInput[],
  onChunk?: (chunk: string) => void
): Promise<{ report: ReportDTO; raw: string }> {
  const prompt = buildInspectionPrompt(
    siteName,
    notes,
    evidence.map((e) => ({ caption: e.caption }))
  );

  const responseStream = await ai.models.generateContentStream({
    model: ENV.GENERATE_MODEL,
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

  let raw = '';
  for await (const chunk of responseStream) {
    if (chunk.text) {
      raw += chunk.text;
      onChunk?.(chunk.text);
    }
  }

  if (!raw) {
    throw new AppError(Errors.EMPTY_MODEL_RESPONSE);
  }

  const parsed = JSON.parse(raw);
  return { report: schema.report.parse(parsed), raw };
}

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
          evidenceIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
        },
        required: ['type', 'location', 'severity', 'description', 'evidenceIndices'],
      },
    },
    recommendation: { type: Type.STRING },
    needsReview: { type: Type.BOOLEAN },
  },
  required: ['summary', 'severity', 'defects', 'recommendation', 'needsReview'],
};

export function buildInspectionPrompt(
  siteName: string,
  notes: string | null,
  evidence: { caption: string | null }[]
) {
  return `You are an experienced civil and structural engineering inspection assistant.
  
You are given
${evidence.length} photo(s) from a field site visit and optional notes.
Analyze the supplied inspection evidence and prepare a professional infrastructure inspection report.

Site: ${siteName}
Inspector notes: ${notes ?? "none provided"}
Inspection evidence: Photos are provided in this order, numbered from 0: ${evidence.map((_, i) => i).join(', ')}.
For each defect, include evidenceIndices: an array of the photo number(s) that show this defect.

Instructions:

- Consider all inspection evidence together before reaching conclusions.
- Base conclusions only on the supplied images, captions and inspector notes.
- Do not speculate about defects that are not reasonably supported by the evidence.
- Use professional civil engineering terminology.
- Merge observations that clearly refer to the same physical defect viewed from multiple angles or distances.
- Keep defects separate when they occur on different structural elements or represent different damage.
- The overall site severity should reflect the highest-risk condition affecting the structure.

For each distinct defect visible across the photos, with and without caption, identify:
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
  "defects": [{ "type": string, "location": string, "severity": string, "description": string, "evidenceIndices": number[] }],
  "recommendation": string,
  "needsReview": boolean
}`;
}