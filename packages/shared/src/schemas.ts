import { z } from 'zod';

export const createVisit = z.object({
  body: z.object({
    inspectorName: z.string().min(1, { message: 'Inspector name is required' }),
    siteName: z.string().min(1, { message: 'Site name is required' }),
    notes: z.string().optional(),
  }),
});

export const addEvidence = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
  body: z.object({
    caption: z.string().optional(),
    captionSource: z.enum(['TEXT', 'VOICE']).optional(),
  })
});

export const generateReport = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
});

export const reportSchema = z.object({
  summary: z.string().min(1, { message: 'Summary is required' }),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  defects: z.array(z.object({
    type: z.string().min(1, { message: 'Defect type is required' }),
    location: z.string().min(1, { message: 'Defect location is required' }),
    severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    description: z.string().min(1, { message: 'Defect description is required' }),
    evidenceIndices: z.array(z.number().int()).default([]),
    evidenceIds: z.array(z.string().cuid2()).default([]),
  })),
  recommendation: z.string().min(1, { message: 'Recommendation is required' }),
  needsReview: z.boolean(),
}).loose();

export const updateStatus = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'COMPLETE']),
  }),
});

export const idParam = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
});