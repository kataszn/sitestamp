import { z } from 'zod';

export const createVisitSchema = z.object({
  siteName: z.string().min(1, { message: 'Site name is required' }),
  notes: z.string().optional(),
});

export const addEvidenceSchema = z.object({
  visitId: z.cuid2(),
  imageUrl: z.string().url({ message: 'Invalid image URL' }),
  caption: z.string().optional(),
});

export const generateReportSchema = z.object({
  visitId: z.cuid2(),
});