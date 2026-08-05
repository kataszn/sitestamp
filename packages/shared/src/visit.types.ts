import { ReportDTO } from "./report.types";

export interface VisitDTO {
  id: string;
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
  caption: string | null;
  captionSource: CaptionSource | null;
}

export type CaptionSource = 'TEXT' | 'VOICE';