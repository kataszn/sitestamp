import { ReportDTO } from "./report.types";

export interface VisitDTO {
  id: string;
  siteName: string;
  inspectorName: string;
  notes: string | null;
  status: 'OPEN' | 'GENERATING' | 'COMPLETE';
  evidence: EvidenceDTO[];
  report: ReportDTO | null;
}

export interface EvidenceDTO {
  id: string;
  imageUrl: string;
  caption: string | null;
  audioUrl: string | null;
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
  caption?: string;
  audioUrl?: string;
  captionSource?: CaptionSource;
}