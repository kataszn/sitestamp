import type {
  CreateVisitInput,
  AddEvidenceInput,
  VisitDTO,
  EvidenceDTO,
  ReportDTO,
  DefectData,
} from "@inspectai/shared";
import { AppError, Errors } from "../../core/errors";
import * as repo from "./infra/repo";
import * as mapper from "./api/mapper";
import * as gemma from "./infra/gemma.client";
import path from "node:path";
import fs from "node:fs";
import { ENV } from "../../core/env";

export const createVisit = async (input: CreateVisitInput): Promise<VisitDTO> => {
  const visit = await repo.create(input);
  return mapper.toVisitDTO(visit);
};

export const addEvidence = async (input: AddEvidenceInput): Promise<EvidenceDTO> => {
  const evidence = await repo.addEvidence(input);
  if (!evidence) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  return mapper.toEvidenceDTO(evidence);
};

export const getVisit = async (visitId: string): Promise<VisitDTO> => {
  const visit = await repo.find(visitId);
  if (!visit) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  return mapper.toVisitDTO(visit);
};

export const generateReport = async (visitId: string): Promise<ReportDTO> => {
  const visit = await getVisit(visitId);
  await repo.updateStatus(visitId, "GENERATING");

  const evidenceInputs = await Promise.all(
    visit.evidence.map(async (e) => {
      const filename = path.basename(e.imageUrl);
      const imageBuffer = fs.readFileSync(path.join(ENV.UPLOAD_DIR, filename));

      return {
        imageBuffer,
        mimeType: e.mimeType,
        caption: e.caption,
      };
    })
  );

  const { report, raw } = await gemma.generateReport(
    visit.siteName,
    visit.notes,
    evidenceInputs
  );

  const resolved = resolveEvidenceIds(report.defects, visit.evidence);
  report.defects = resolved;

  const saved = await repo.saveReport({
    visitId,
    ...report,
    rawModelJson: raw,
  });
  await repo.updateStatus(visitId, "COMPLETE");

  return mapper.toReportDTO(saved);
};

function resolveEvidenceIds(defects: DefectData[], evidence: EvidenceDTO[]) {
  return defects.map((d) => ({
    ...d,
    evidenceIds: d.evidenceIndices
      .filter((i) => i >= 0 && i < evidence.length)
      .map((i) => evidence[i]!.id),
  }));
}

export const getReport = async (visitId: string): Promise<ReportDTO> => {
  const visit = await repo.find(visitId);
  if (!visit) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  const report = visit.report;
  if (!report) {
    throw new AppError(Errors.NOT_FOUND, {
      message: `Report not found. Generate one first.`,
    });
  }
  return mapper.toReportDTO(report);
};

export const updateVisitStatus = async (visitId: string, status: 'OPEN' | 'COMPLETE') => {
  await repo.updateStatus(visitId, status);
};

export const removeEvidence = async (evidenceId: string) => {
  await repo.removeEvidence(evidenceId);
};

export const getAllVisits = async (): Promise<VisitDTO[]> => {
  const visits = await repo.findAll();
  return visits.map(mapper.toVisitDTO);
}

