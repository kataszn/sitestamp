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
    imageUrl: z.string().url({ message: 'Invalid image URL' }),
    caption: z.string().optional(),
    captionSource: z.enum(['TEXT', 'VOICE']).optional(),
  })
});

export const generateReport = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
});

export const idParam = z.object({
  params: z.object({
    id: z.cuid2(),
  }),
});