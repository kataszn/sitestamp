import type {
  CreateVisitInput,
  AddEvidenceInput,
  VisitDTO,
  EvidenceDTO,
  ReportDTO,
  DefectData,
} from "@inspection/shared";
import { CTX } from "../../core/app-context";
import { AppError, Errors } from "../../core/errors";
import * as mapper from "./dto.mapper";
import * as gemma from "./gemma.client";
import path from "node:path";
import fs from "node:fs";
import { ENV } from "../../core/env";

const createVisit = async (input: CreateVisitInput): Promise<VisitDTO> => {
  const visit = await CTX.repo.visit.create(input);
  return mapper.toVisitDTO(visit);
};

const addEvidence = async (input: AddEvidenceInput): Promise<EvidenceDTO> => {
  const evidence = await CTX.repo.visit.addEvidence(input);
  if (!evidence) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  return mapper.toEvidenceDTO(evidence);
};

const getVisit = async (visitId: string): Promise<VisitDTO> => {
  const visit = await CTX.repo.visit.find(visitId);
  if (!visit) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  return mapper.toVisitDTO(visit);
};

const generateReport = async (visitId: string): Promise<ReportDTO> => {
  const visit = await getVisit(visitId);
  await CTX.repo.visit.updateStatus(visitId, 'GENERATING');

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

  const saved = await CTX.repo.visit.saveReport({ visitId, ...report, rawModelJson: raw });
  await CTX.repo.visit.updateStatus(visitId, 'COMPLETE');

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

const getReport = async (visitId: string): Promise<ReportDTO> => {
  const visit = await CTX.repo.visit.find(visitId);
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

const updateVisitStatus = async (visitId: string, status: 'OPEN' | 'COMPLETE') => {
  await CTX.repo.visit.updateStatus(visitId, status);
};

const removeEvidence = async (evidenceId: string) => {
  await CTX.repo.visit.removeEvidence(evidenceId);
};

const getAllVisits = async (): Promise<VisitDTO[]> => {
  const visits = await CTX.repo.visit.findAll();
  return visits.map(mapper.toVisitDTO);
}

export { createVisit, addEvidence, getVisit, generateReport, getReport, updateVisitStatus, removeEvidence, getAllVisits };
