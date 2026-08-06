// domain/tools.ts
import { Type } from '@google/genai';

export const getSiteHistoryTool = {
  functionDeclarations: [
    {
      name: 'get_site_history',
      description:
        'Fetch prior completed inspections for this asset, to compare current findings against past ' +
        'severity and identify deterioration trends. Only call this if an asset code is available and ' +
        'comparing against history would meaningfully improve the assessment.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          assetCode: { type: Type.STRING, description: 'The asset code for this site, e.g. "BRG-MB-003"' },
        },
        required: ['assetCode'],
      },
    },
  ],
};

export interface SiteHistoryEntry {
  date: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  summary: string;
}