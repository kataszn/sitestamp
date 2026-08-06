export interface VisitDTO {
  id: string;
  assetCode: string | null;
  siteName: string;
  inspectorName: string;
  notes: string | null;
  status: 'OPEN' | 'GENERATING' | 'COMPLETE' | 'FAILED';
  evidence: EvidenceDTO[];
  report: ReportDTO | null;
  lastError: string | null;

  createdAt: string;
}

export interface EvidenceDTO {
  id: string;
  imageUrl: string;
  mimeType: string;
  note: string | null;
  noteSource: NoteSource | null;
}

export type NoteSource = 'TEXT' | 'VOICE';

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

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';