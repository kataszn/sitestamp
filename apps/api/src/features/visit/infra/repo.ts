import { CreateVisit, AddEvidence, SaveReport } from "./repo.types";
import { isPrismaNotFound, PrismaClientError } from '#utils/prisma';

import { DB } from "#core/db";
import { Evidence, Report, Visit } from "#features/visit/domain/model";
import * as mapper from "#features/visit/infra/repo.mapper";

export async function create(data: CreateVisit): Promise<Visit> {
  const record = await DB.visit.create({
    data: {
      siteName: data.siteName,
      inspectorName: data.inspectorName,
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
            caption: data.caption,
            captionSource: data.captionSource,
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

export async function saveReport(input: SaveReport): Promise<Report | null> {
  try {
    const record = await DB.report.upsert({
      where: {
        visitId: input.visitId,
      },
      create: {
        visitId: input.visitId,
        summary: input.summary,
        severity: input.severity,
        defects: JSON.stringify(input.defects),
        recommendation: input.recommendation,
        needsReview: input.needsReview ?? false,
        rawModelJson: input.rawModelJson,
      },
      update: {
        summary: input.summary,
        severity: input.severity,
        defects: JSON.stringify(input.defects),
        recommendation: input.recommendation,
        needsReview: input.needsReview ?? false,
        rawModelJson: input.rawModelJson,
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