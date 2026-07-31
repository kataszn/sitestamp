export interface DefectData {
  type: string;          // "crack", "spalling", "drainage_blockage", ...
  location: string;       // "underside of deck, mid-span"
  severity: Severity;
  description: string;
  evidenceIndices: number[]; // indices of the evidence photos that show this defect
  evidenceIds: string[]; // IDs of the evidence photos that show this defect, resolved from evidenceIndices
}

export interface ReportDTO {
  summary: string;
  severity: Severity;
  defects: DefectData[];
  recommendation: string;
  needsReview: boolean;
}

export type SaveReportInput = {
  visitId: string;
  summary: string;
  severity: Severity;
  defects: DefectData[];
  recommendation: string;
  needsReview: boolean;
  rawModelJson: string;
};

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';