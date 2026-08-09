import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from 'sharp';

import type {
  VisitDTO,
  EvidenceDTO,
  ReportDTO,
  DefectData,
  NoteSource,
} from "@sitestamp/shared";
import { AppError, Errors } from "#core/errors";
import * as repo from "#features/visit/infra/db/repo";
import * as mapper from "#features/visit/api/mapper";
import * as gemma from "#features/visit/infra/ai/gemma.client";
import { storage } from "#features/visit/infra/storage";
import type { CreateVisitInput, AddEvidenceInput } from "./types";

export const createVisit = async (input: CreateVisitInput): Promise<VisitDTO> => {
  const visit = await repo.create(input);
  return mapper.toVisitDTO(visit);
};

export const addEvidence = async (input: AddEvidenceInput): Promise<EvidenceDTO> => {
  const { visitId, image, audio } = input;
  let noteSource: NoteSource | null = input.note ? 'TEXT' : null;
  let note = input.note;

  // audio: never saved, transcribed to text and replaces text note
  if (audio) {
    const audioNote = await gemma.transcribeAudio(audio.buffer, audio.mimetype);
    note = audioNote;
    noteSource = 'VOICE';
  }

  // image: save to storage
  const ext = path.extname(image.originalname) || '.jpg';
  const filename = `${note || randomUUID()}-${ext}`;
  const processedBuffer = await prepareImageForAnalysis(image.buffer);
  const imageUrl = await storage.save(processedBuffer, filename, image.mimetype);
  

  const evidence = await repo.addEvidence({
    visitId,
    imageUrl,
    mimeType: image.mimetype,
    note,
    noteSource: noteSource ?? undefined,
  });
  if (!evidence) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  return mapper.toEvidenceDTO(evidence);
};

async function prepareImageForAnalysis(buffer: Buffer): Promise<Buffer> {
  const resized = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 65 })
    .toBuffer();
  return resized;
}

export const getVisit = async (visitId: string): Promise<VisitDTO> => {
  const visit = await repo.find(visitId);
  if (!visit) {
    throw new AppError(Errors.NOT_FOUND, { message: "Visit not found" });
  }
  
  const report = visit.report;
  if (!report) {
    return mapper.toVisitDTO(visit);
  }

  const reportDTO = mapper.toReportDTO(report);
  if (report.historicalAssessment && visit.assetCode) {
    reportDTO.trendPoints = await repo.getTrendPoints(
      visit.assetCode,
      visit.id,
      visit.createdAt,
      report.severity,
    );
  }

  return { ...mapper.toVisitDTO(visit), report: reportDTO };
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
        console.log(`Sending image: ${(imageBuffer.length / 1024).toFixed(0)}KB`);
        return { imageBuffer, mimeType: e.mimeType, note: e.note };
      })
    );
    
    const { report, raw } = await gemma.generateReport(
      visit.siteName,
      visit.assetCode,
      visit.notes,
      evidenceInputs,
      visit.id,
      new Date(visit.createdAt),
    );

    report.defects = resolveEvidenceIds(report.defects, visit.evidence);

    savedReport = await repo.saveReport({
      visitId,
      report: { ...report, rawModelJson: raw },
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

