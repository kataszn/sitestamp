import { GoogleGenAI, Type, ApiError } from '@google/genai';
import { schema, type ReportDTO } from '@inspectai/shared';
import { ENV } from '#core/env';
import { AppError, Errors } from '#core/errors';
import { buildInspectionPrompt } from '#features/visit/domain/report.prompt';

const ai = new GoogleGenAI({ apiKey: ENV.GOOGLE_AI_API_KEY });

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
      throw new AppError(Errors.GENERATION_FAILED, { message: "The model returned an empty response." });
    }
    return text;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err instanceof ApiError) {
      throw new AppError(Errors.GENERATION_FAILED, { message: err.message });
    }
    throw new AppError(Errors.GENERATION_FAILED);
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

  const response = await ai.models.generateContent({
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

  const raw = response.text?.trim();
  if (!raw) {
    throw new AppError(Errors.GENERATION_FAILED, { message: "The model returned an empty response." });
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
