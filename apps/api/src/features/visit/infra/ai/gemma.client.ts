import { GoogleGenAI, Type, ApiError } from '@google/genai';
import { ENV } from '#core/env';
import { AppError, Errors } from '#core/errors';
import { buildInspectionPrompt } from '#features/visit/domain/ai/inspection.prompt';
import { getSiteHistoryTool } from '#features/visit/domain/ai/agent.tools';
import { getSiteHistorySummaries } from '#features/visit/infra/db/repo';
import { type ReportData, reportSchema } from './report.schema';

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
  assetCode: string | null,
  notes: string | null,
  evidence: EvidenceInput[],
  currentVisitId: string,
  visitCreatedAt: Date
): Promise<{ report: ReportData; raw: string }> {
  const prompt = buildInspectionPrompt(
    siteName,
    assetCode,
    notes,
    evidence.map((e) => ({ note: e.note }))
  );

  const initialContents = [
    {
      role: 'user',
      parts: [
        { text: prompt },
        ...evidence.map((e) => ({
          inlineData: { mimeType: e.mimeType, data: e.imageBuffer.toString('base64') },
        })),
      ],
    },
  ];

  // Tools + responseSchema together: in the common case (no assetCode, or Gemma
  // decides history isn't needed) this returns the final schema-constrained JSON
  // in one call. Only visits where Gemma actually requests history pay for a
  // second round trip.
  const first = await ai.models.generateContent({
    model: ENV.GENERATE_MODEL,
    contents: initialContents,
    config: {
      tools: assetCode ? [getSiteHistoryTool] : undefined,
      responseMimeType: 'application/json',
      responseSchema: GEMMA_REPORT_SCHEMA,
    },
  });

  const functionCall = first.functionCalls?.[0];
 
  if (!functionCall) {
    const raw = mustText(first);
    const parsed = JSON.parse(raw);
    return { report: reportSchema.parse(parsed), raw };
  }

  // Exactly one hop: execute the tool, feed the result back, force a final
  // answer with no tools available on the second call so Gemma can't chain
  // further tool calls.
  const history = await getSiteHistorySummaries(
    (functionCall.args?.assetCode as string) ?? assetCode!,
    currentVisitId,
    visitCreatedAt,
  );

  const followUpContents = [
    ...initialContents,
    { role: 'model', parts: [{ functionCall }] },
    {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: 'get_site_history',
            response: { history }, // lightweight summaries only — see getSiteHistorySummaries
          },
        },
      ],
    },
  ];

  const second = await ai.models.generateContent({
    model: ENV.GENERATE_MODEL,
    contents: followUpContents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: GEMMA_REPORT_SCHEMA, // no `tools` here — forces a final text answer
    },
  });
  const raw = mustText(second);
  const parsed = JSON.parse(raw);
  return { report: reportSchema.parse(parsed), raw };
}

function mustText(response: { text?: string }): string {
  const text = response.text?.trim();
  if (!text) {
    throw new AppError(Errors.GENERATION_FAILED, { message: "The model returned an empty response." });
  }
  return text;
}

interface EvidenceInput {
  imageBuffer: Buffer;
  mimeType: string;
  note: string | null;
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
          evidenceIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
        },
        required: ['type', 'location', 'severity', 'description', 'evidenceIndices'],
      },
    },
    recommendation: { type: Type.STRING },
    needsReview: { type: Type.BOOLEAN },
    historicalAssessment: {
      type: Type.OBJECT,
      properties: {
        trend: { type: Type.STRING, enum: ['IMPROVING', 'STABLE', 'DETERIORATING'] },
        narrative: { type: Type.STRING },
        priorVisitCount: { type: Type.INTEGER },
      },
      required: ['trend', 'narrative', 'priorVisitCount'],
    },
  },
  required: ['summary', 'severity', 'defects', 'recommendation', 'needsReview'],
};
 
