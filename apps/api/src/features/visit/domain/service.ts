import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  VisitDTO,
  EvidenceDTO,
  ReportDTO,
  DefectData,
  CaptionSource,
} from "@sitestamp/shared";
import { AppError, Errors } from "#core/errors";
import * as repo from "#features/visit/infra/repo";
import * as mapper from "#features/visit/api/mapper";
import * as gemma from "#features/visit/infra/gemma.client";
import { ENV } from "#core/env";
import type { CreateVisitInput, AddEvidenceInput } from "./types";
import { transcribeAudio } from "#features/visit/infra/gemma.client";
import { storage } from "#features/visit/infra/storage";

export const createVisit = async (input: CreateVisitInput): Promise<VisitDTO> => {
  const visit = await repo.create(input);
  return mapper.toVisitDTO(visit);
};

export const addEvidence = async (input: AddEvidenceInput): Promise<EvidenceDTO> => {
  const { visitId, image, audio } = input;
  let captionSource: CaptionSource | null = input.caption ? 'TEXT' : null;
  let caption = input.caption;

  // audio: never saved, transcribed to text and replaces text note
  if (audio) {
    const audioCaption = await transcribeAudio(audio.buffer, audio.mimetype);
    caption = audioCaption;
    captionSource = 'VOICE';
  }

  // image: save to storage
  const ext = path.extname(image.originalname) || '.jpg';
  const filename = `${caption || randomUUID()}-${ext}`;
  const imageUrl = await storage.save(image.buffer, filename, image.mimetype);
  

  const evidence = await repo.addEvidence({
    visitId,
    imageUrl,
    mimeType: image.mimetype,
    caption,
    captionSource: captionSource ?? undefined,
  });
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
  if (!visit) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }

  let savedReport;
  try {
    await repo.updateStatus(visitId, "GENERATING");

    const evidenceInputs = await Promise.all(
      visit.evidence.map(async (e) => {
        const imageBuffer = await storage.read(e.imageUrl);
        return { imageBuffer, mimeType: e.mimeType, caption: e.caption };
      })
    );
    
    const { report, raw } = await gemma.generateReport(
      visit.siteName,
      visit.notes,
      evidenceInputs
    );

    report.defects = resolveEvidenceIds(report.defects, visit.evidence);

    savedReport = await repo.saveReport({
      visitId,
      ...report,
      rawModelJson: raw,
    });
  } catch (error) {
    // Set visit status to FAILED and store the error message
    await repo.markVisitFailed(visitId, error instanceof Error ? error.message : String(error));
    throw error;
  }

  await repo.updateStatus(visitId, "COMPLETE");
  return mapper.toReportDTO(savedReport!);
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

