import { ReportData } from "#features/visit/infra/ai/report.schema";

export type CreateVisit = {
  siteName: string;
  inspectorName: string;
  assetCode?: string;
  notes?: string;
};

export type AddEvidence = {
  visitId: string;
  imageUrl: string;
  mimeType: string;
  note?: string;
  noteSource?: 'TEXT' | 'VOICE';
};

export type SaveReport = {
  visitId: string;
  report: ReportData & {
    rawModelJson: string;
  };
};
