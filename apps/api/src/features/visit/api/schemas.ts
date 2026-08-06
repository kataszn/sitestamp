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