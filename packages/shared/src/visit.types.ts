import { ReportDTO } from "./report.types";

export interface VisitDTO {
  id: string;
  siteName: string;
  inspectorName: string;
  notes: string | null;
  status: 'OPEN' | 'GENERATING' | 'COMPLETE';
  evidence: EvidenceDTO[];
  report: ReportDTO | null;

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

export interface CreateVisitInput {
  siteName: string;
  inspectorName: string;
  notes?: string;
}

export interface AddEvidenceInput {
  visitId: string;
  imageUrl: string; // already-uploaded URL; keep upload separate from this call
  mimeType: string; 
  caption?: string;
  captionSource?: CaptionSource;
}