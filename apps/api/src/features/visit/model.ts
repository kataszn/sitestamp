import { Severity } from "@inspection/shared";

export interface Visit {
  id: string;
  siteName: string;
  inspectorName: string;
  notes: string | null;
  status: 'OPEN' | 'GENERATING' | 'COMPLETE';
  evidence: Evidence[];
  report?: Report | null;

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
  evidenceIds: string[];  // which photos this defect is drawn from
}


export interface Evidence {
  id: string;
  visitId: string;
  imageUrl: string;
  caption: string | null;
  audioUrl: string | null;
  captionSource: 'TEXT' | 'VOICE' | null;
}