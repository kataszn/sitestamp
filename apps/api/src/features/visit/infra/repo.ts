import { CreateVisit, AddEvidence, SaveReport } from "./repo.types";
import { isPrismaNotFound, PrismaClientError } from '#utils/prisma';

import { DB } from "#core/db";
import { Evidence, Report, Visit } from "#features/visit/domain/model";
import type { SiteHistoryEntry } from '#features/visit/domain/agent.tools';
import * as mapper from "#features/visit/infra/repo.mapper";
import { TrendPoint } from "@sitestamp/shared";

export async function create(data: CreateVisit): Promise<Visit> {
  const record = await DB.visit.create({
    data: {
      siteName: data.siteName,
      inspectorName: data.inspectorName,
      assetCode: data.assetCode,
      notes: data.notes,
    },
    include: {
      evidence: true,
      report: true,
    },
  });
  return mapper.toDomain(record);
}


export async function addEvidence(data: AddEvidence): Promise<Evidence | null> {
  try {
    const visit = await DB.visit.update({
      where: { id: data.visitId },
      data: {
        evidence: {
          create: {
            imageUrl: data.imageUrl,
            mimeType: data.mimeType,
            note: data.note,
            noteSource: data.noteSource,
          },
        },
      },
      include: {
        evidence: true,
        report: true,
      },
    });
    const evidence = visit.evidence.at(-1) ?? null;
    return evidence ? mapper.toDomainEvidence(evidence) : null;
  } catch (err) {
    if (err instanceof PrismaClientError && isPrismaNotFound(err)) {
      return null;
    }
    throw err;
  }
}

export async function find(visitId: string): Promise<Visit | null> {
  const record = await DB.visit.findUnique({
    where: { id: visitId },
    include: {
      evidence: true,
      report: true,
    },
  });
  return record ? mapper.toDomain(record) : null;
}

export async function findAll(): Promise<Visit[]> {
  const records = await DB.visit.findMany({
    include: {
      evidence: true,
      report: true,
    },
  });
  return records.map(mapper.toDomain);
}

export async function saveReport(data: SaveReport): Promise<Report | null> {
  try {
    const record = await DB.report.upsert({
      where: {
        visitId: data.visitId,
      },
      create: {
        visitId: data.visitId,
        summary: data.report.summary,
        severity: data.report.severity,
        defects: JSON.stringify(data.report.defects),
        recommendation: data.report.recommendation,
        needsReview: data.report.needsReview ?? false,
        historicalAssessment: data.report.historicalAssessment, 
        rawModelJson: data.report.rawModelJson,
      },
      update: {
        summary: data.report.summary,
        severity: data.report.severity,
        defects: JSON.stringify(data.report.defects),
        recommendation: data.report.recommendation,
        needsReview: data.report.needsReview ?? false,
        historicalAssessment: data.report.historicalAssessment, 
        rawModelJson: data.report.rawModelJson,
      },
    });
    return mapper.toDomainReport(record);
  } catch (err) {
    if (err instanceof PrismaClientError && isPrismaNotFound(err)) {
      return null;
    }
    throw err;
  }
}

export async function updateStatus(visitId: string, status: Visit['status']): Promise<Visit | null> {
  try {
    const record = await DB.visit.update({
      where: { id: visitId },
      data: { status },
    });
    return mapper.toDomain(record);
  } catch (err) {
    if (err instanceof PrismaClientError && isPrismaNotFound(err)) {
      return null;
    }
    throw err;
  }
}

export async function removeEvidence(evidenceId: string): Promise<void> {
  await DB.evidence.delete({
    where: { id: evidenceId },
  });
}

export async function markVisitFailed(id: string, error: string) {
  return DB.visit.update({
    where: { id },
    data: { status: "FAILED" as Visit["status"], lastError: error },
  });
}

export async function findVisitsByAsset(assetCode: string, excludeVisitId: string, before: Date) {
  return DB.visit.findMany({
    where: {
      assetCode,
      id: { not: excludeVisitId },
      status: "COMPLETE",
      createdAt: { lt: before },
    },
    orderBy: { createdAt: "desc" },
    include: { report: true },
  });
}

// Fallback for visits without an assetCode set — least reliable, use only if assetCode is absent
export async function findVisitsBySiteName(siteName: string, excludeVisitId: string) {
  return DB.visit.findMany({
    where: { siteName: { equals: siteName.trim(), mode: 'insensitive' }, id: { not: excludeVisitId }, status: 'COMPLETE' },
    orderBy: { createdAt: 'desc' },
    include: { report: true },
  });
}
 
export async function getSiteHistorySummaries(assetCode: string, excludeVisitId: string, before: Date): Promise<SiteHistoryEntry[]> {
  const visits = await findVisitsByAsset(assetCode, excludeVisitId, before); // already includes { report: true }

  // Deliberately thin: date, severity, one-line summary only.
  // No images, no full defect list, no evidence IDs — keeps the tool response
  // small and text-only, which Gemma reasons over far more reliably than
  // resending heavy or structurally complex data through a function response.
  return visits
    .filter((v) => v.report !== null)
    .map((v) => ({
      date: v.createdAt.toISOString().slice(0, 10),
      severity: v.report!.severity,
      summary: v.report!.summary,
    }));
}

export async function getTrendPoints(
  assetCode: string,
  currentVisitId: string,
  currentVisitDate: Date,
  currentSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
): Promise<TrendPoint[]> {
  const priorVisits = await findVisitsByAsset(assetCode, currentVisitId, currentVisitDate); // already ordered desc, includes { report: true }

  const priorPoints: TrendPoint[] = priorVisits
    .filter((v) => v.report !== null)
    .map((v) => ({
      date: v.createdAt.toISOString().slice(0, 10),
      severity: v.report!.severity,
      isCurrent: false,
    }))
    .reverse(); // chronological order, oldest first

  return [
    ...priorPoints,
    { date: currentVisitDate.toISOString().slice(0, 10), severity: currentSeverity, isCurrent: true },
  ];
}