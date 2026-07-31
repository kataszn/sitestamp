import { EvidenceDTO, VisitDTO, ReportDTO } from "@inspectai/shared";
import { Evidence, Report, Visit } from "../model";

const toEvidenceDTO = (evidence: Evidence): EvidenceDTO => ({
  id: evidence.id,
  imageUrl: evidence.imageUrl,
  mimeType: evidence.mimeType,
  caption: evidence.caption,
  captionSource: evidence.captionSource as EvidenceDTO['captionSource'],
});

const toReportDTO = (report: Report): ReportDTO => {
  return {
    summary: report.summary,
    severity: report.severity as ReportDTO['severity'],
    defects: report.defects.map((defect) => ({
      ...defect,
      evidenceIndices: defect.evidenceIndices,
      evidenceIds: defect.evidenceIds,
    })) as ReportDTO['defects'],
    recommendation: report.recommendation,
    needsReview: report.needsReview,
  };
};

const toVisitDTO = (visit: Visit): VisitDTO => ({
  id: visit.id,
  siteName: visit.siteName,
  inspectorName: visit.inspectorName,
  notes: visit.notes,
  status: visit.status,
  createdAt: visit.createdAt.toISOString(),
  evidence: visit.evidence.map(toEvidenceDTO),
  report: visit.report ? toReportDTO(visit.report) : null,
});

export { toVisitDTO, toEvidenceDTO, toReportDTO };