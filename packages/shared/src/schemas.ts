import { z } from 'zod';

export const createVisit = z.object({
  body: z.object({
    inspectorName: z.string().min(1, { message: 'Inspector name is required' }),
    siteName: z.string().min(1, { message: 'Site name is required' }),
    assetCode: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const addEvidence = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
  body: z.object({
    note: z.string().optional(),
    noteSource: z.enum(['TEXT', 'VOICE']).optional(),
  })
});

export const generateReport = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
});

export const report = z.object({
  summary: z.string().min(1, { message: 'Summary is required' }),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  defects: z.array(z.object({
    type: z.string().min(1, { message: 'Defect type is required' }),
    location: z.string().min(1, { message: 'Defect location is required' }),
    severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    description: z.string().min(1, { message: 'Defect description is required' }),
    evidenceIndices: z.array(z.number().int()).default([]),
    evidenceIds: z.array(z.cuid2()).default([]),
  })),
  recommendation: z.string().min(1, { message: 'Recommendation is required' }),
  needsReview: z.boolean(),
  // Present only when get_site_history was called and returned prior visits.
  // Absent (not null) when there's no history to reason over — keeps the
  // report view's conditional rendering simple: `if (report.historicalAssessment)`.
  historicalAssessment: z
    .object({
      trend: z.enum(['IMPROVING', 'STABLE', 'DETERIORATING']),
      narrative: z.string(),
      priorVisitCount: z.number().int(),
    })
    .optional(),
}).loose();

export type ReportData = z.infer<typeof report>;

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