import type { Prisma } from "@prisma/client";
import { EvidenceDTO, VisitDTO, ReportDTO } from "@inspection/shared";

type PrismaVisit = Prisma.VisitGetPayload<{
  include: { evidence: true; report: true }
}>;

const toEvidenceDTO = (evidence: PrismaVisit['evidence'][number]): EvidenceDTO => ({
  id: evidence.id,
  imageUrl: evidence.imageUrl,
  mimeType: evidence.mimeType,
  caption: evidence.caption,
  captionSource: evidence.captionSource as EvidenceDTO['captionSource'],
});

const toReportDTO = (report: NonNullable<PrismaVisit['report']>): ReportDTO => ({
  summary: report.summary,
  severity: report.severity as ReportDTO['severity'],
  defects: report.defects as unknown as ReportDTO['defects'],
  recommendation: report.recommendation,
  needsReview: report.needsReview,
});

const toVisitDTO = (visit: PrismaVisit): VisitDTO => ({
  id: visit.id,
  siteName: visit.siteName,
  inspectorName: visit.inspectorName,
  notes: visit.notes,
  status: visit.status,
  evidence: visit.evidence.map(toEvidenceDTO),
  report: visit.report ? toReportDTO(visit.report) : null,
});

export { toVisitDTO, toEvidenceDTO, toReportDTO };