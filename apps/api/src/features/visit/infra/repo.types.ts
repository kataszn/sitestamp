import { DefectData, Severity } from "@sitestamp/shared";

export type CreateVisit = {
  siteName: string;
  inspectorName: string;
  notes?: string;
};

export type AddEvidence = {
  visitId: string;
  imageUrl: string;
  mimeType: string;
  caption?: string;
  captionSource?: 'TEXT' | 'VOICE';
};

export type SaveReport = {
  visitId: string;
  summary: string;
  severity: Severity;
  defects: DefectData[];
  recommendation: string;
  needsReview: boolean;
  rawModelJson: string;
};
