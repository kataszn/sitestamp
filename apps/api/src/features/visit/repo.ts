import { CreateVisitInput, AddEvidenceInput, SaveReportInput } from "@inspection/shared";
import { PrismaClient } from '@prisma/client';
import { isPrismaNotFound, PrismaClientError } from '../../utils/prisma';

export class VisitRepository {
  constructor(private readonly db: PrismaClient ) {}

  async createVisit(input: CreateVisitInput) {
    return await this.db.visit.create({
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

  async addEvidence(input: AddEvidenceInput) {
    try {
      const visit = await this.db.visit.update({
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

  async getVisit(visitId: string) {
    return await this.db.visit.findUnique({
      where: { id: visitId },
      include: {
        evidence: true,
        report: true,
      },
    });
  }

  async saveReport(input: SaveReportInput) {
  return this.db.report.upsert({
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
}