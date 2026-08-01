import { normalizeRecord } from "../../../utils/normalize-record";
import { Defect, Evidence, Report, Visit } from "../domain/model";

export function toDomainEvidence(record: any): Evidence {
  const normalized = normalizeRecord(record);

  return {
    id: normalized.id,
    visitId: String(normalized.visitId),
    imageUrl: String(normalized.imageUrl),
    mimeType: String(normalized.mimeType),
    caption: normalized.caption ?? null,
    captionSource: normalized.captionSource ?? null,
  };
}

export function toDomainReport(record: any): Report {
  const normalized = normalizeRecord(record);
  const defects = typeof normalized.defects === "string" ? JSON.parse(normalized.defects) : normalized.defects;

  return {
    id: normalized.id,
    visitId: String(normalized.visitId),
    summary: String(normalized.summary),
    severity: normalized.severity,
    defects: Array.isArray(defects)
      ? defects.map((defect: any) => ({
          type: String(defect.type),
          location: String(defect.location),
          severity: defect.severity,
          description: String(defect.description),
          evidenceIndices: Array.isArray(defect.evidenceIndices) ? defect.evidenceIndices.map(Number) : [],
          evidenceIds: Array.isArray(defect.evidenceIds) ? defect.evidenceIds.map(String) : [],
        } satisfies Defect))
      : [],
    recommendation: String(normalized.recommendation),
    needsReview: Boolean(normalized.needsReview),
    createdAt: normalized.createdAt instanceof Date ? normalized.createdAt : new Date(normalized.createdAt),
  };
}

export function toDomain(record: any): Visit {
  const normalized = normalizeRecord(record);

  return {
    id: normalized.id,
    siteName: String(normalized.siteName),
    inspectorName: String(normalized.inspectorName),
    notes: normalized.notes ?? null,
    status: normalized.status,
    createdAt: normalized.createdAt instanceof Date ? normalized.createdAt : new Date(normalized.createdAt),
    evidence: Array.isArray(normalized.evidence) ? normalized.evidence.map(toDomainEvidence) : [],
    report: normalized.report ? toDomainReport(normalized.report) : null,
  };
}