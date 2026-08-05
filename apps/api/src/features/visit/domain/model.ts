import { Severity } from "@sitestamp/shared";

export interface Visit {
  id: string;
  siteName: string;
  inspectorName: string;
  notes: string | null;
  status: 'OPEN' | 'GENERATING' | 'COMPLETE' | 'FAILED';
  evidence: Evidence[];
  report?: Report | null;
  lastError: string | null;

  createdAt: Date;
}

export interface Report {
  id: string;
  visitId: string;
  summary: string;
  severity: Severity;
  defects: Defect[];
  recommendation: string;
  needsReview: boolean;

  createdAt: Date;
}

export interface Defect {
  type: string;          // "crack", "spalling", "drainage_blockage", ...
  location: string;       // "underside of deck, mid-span"
  severity: Severity;
  description: string;
  evidenceIndices: number[];
  evidenceIds: string[];  // which photos this defect is drawn from
}


export interface Evidence {
  id: string;
  visitId: string;
  imageUrl: string;
  mimeType: string;
  note: string | null;
  noteSource: 'TEXT' | 'VOICE' | null;
}