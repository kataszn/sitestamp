import { CreateVisitInput, AddEvidenceInput, SaveReportInput } from "@inspectai/shared";
import { isPrismaNotFound, PrismaClientError } from '../../../utils/prisma';

import { DB } from "../../../core/db";

async function create(input: CreateVisitInput) {
  return await DB.visit.create({
    data: {
      siteName: input.siteName,
      inspectorName: input.inspectorName,
      notes: input.notes,
    },
    include: {
      evidence: true,
      report: true,
    },
  });
}

async function addEvidence(input: AddEvidenceInput) {
  try {
    const visit = await DB.visit.update({
      where: { id: input.visitId },
      data: {
        evidence: {
          create: {
            imageUrl: input.imageUrl,
            mimeType: input.mimeType,
            caption: input.caption,
            captionSource: input.captionSource ?? 'TEXT',
          },
        },
      },
      include: {
        evidence: true,
        report: true,
      },
    });
    // Return the newly created evidence (last in the array)
    return visit.evidence.at(-1) ?? null;
  } catch (err) {
    if (err instanceof PrismaClientError && isPrismaNotFound(err)) {
      return null;
    }
    throw err;
  }
}

async function find(visitId: string) {
  return await DB.visit.findUnique({
    where: { id: visitId },
    include: {
      evidence: true,
      report: true,
    },
  });
}

async function findAll() {
  return await DB.visit.findMany({
    include: {
      evidence: true,
      report: true,
    },
  });
}

async function saveReport(input: SaveReportInput) {
  return DB.report.upsert({
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
}

async function updateStatus(visitId: string, status: 'OPEN' | 'GENERATING' | 'COMPLETE') {
  return DB.visit.update({
    where: { id: visitId },
    data: { status },
  });
}

async function removeEvidence(evidenceId: string) {
  return DB.evidence.delete({
    where: { id: evidenceId },
  });
}

export {
  create,
  addEvidence,
  find,
  findAll,
  saveReport,
  updateStatus,
  removeEvidence
}