import { EvidenceDTO, VisitDTO, ReportDTO } from "@sitestamp/shared";
import { Evidence, Report, Visit } from "#features/visit/domain/model";

const toEvidenceDTO = (evidence: Evidence): EvidenceDTO => ({
  id: evidence.id,
  imageUrl: evidence.imageUrl,
  mimeType: evidence.mimeType,
  note: evidence.note,
  noteSource: evidence.noteSource as EvidenceDTO['noteSource'],
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
  lastError: visit.lastError,
  createdAt: visit.createdAt.toISOString(),
  evidence: visit.evidence.map(toEvidenceDTO),
  report: visit.report ? toReportDTO(visit.report) : null,
});

export { toVisitDTO, toEvidenceDTO, toReportDTO };