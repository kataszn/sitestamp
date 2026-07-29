import { Severity } from './severity';

export interface DefectData {
  type: string;          // "crack", "spalling", "drainage_blockage", ...
  location: string;       // "underside of deck, mid-span"
  severity: Severity;
  description: string;
  evidenceIds: string[];  // which photos this defect is drawn from
}

export interface ReportDTO {
  summary: string;
  severity: Severity;
  defects: DefectData[];
  recommendation: string;
  needsReview: boolean;
}