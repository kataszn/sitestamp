export interface DefectData {
  type: string;          // "crack", "spalling", "drainage_blockage", ...
  location: string;       // "underside of deck, mid-span"
  severity: Severity;
  description: string;
}

export interface ReportDTO {
  summary: string;
  severity: Severity;
  defects: DefectData[];
  recommendation: string;
  needsReview: boolean;
}

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';