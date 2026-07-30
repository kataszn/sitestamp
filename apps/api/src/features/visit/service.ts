import type {
  CreateVisitInput,
  AddEvidenceInput,
  VisitDTO,
  EvidenceDTO,
  ReportDTO,
} from "@inspection/shared";
import { CTX } from "../../core/app-context";
import { AppError, Errors } from "../../core/errors";
import * as mapper from "./dto.mapper";


const createVisit = async (input: CreateVisitInput): Promise<VisitDTO> => {
  const visit = await CTX.repo.visit.createVisit(input);
  return mapper.toVisitDTO(visit);
};

const addEvidence = async (input: AddEvidenceInput): Promise<EvidenceDTO> => {
  const evidence = await CTX.repo.visit.addEvidence(input);
  if (!evidence) {
    throw new AppError(Errors.NOT_FOUND, { message: 'Visit not found' });
  }
  return mapper.toEvidenceDTO(evidence);
};

const getVisit = async (visitId: string): Promise<VisitDTO> => {
  const visit = await CTX.repo.visit.getVisit(visitId);
  if (!visit) {
    throw new AppError(Errors.NOT_FOUND, { message: 'Visit not found' });
  }
  return mapper.toVisitDTO(visit);
};

const generateReport = async (visitId: string): Promise<ReportDTO> => {
  throw new Error("Not implemented");
};

const getReport = async (visitId: string): Promise<ReportDTO> => {
  const visit = await getVisit(visitId);
  const report = visit.report;
  if (!report) {
    throw new AppError(Errors.NOT_FOUND, { message: `Report not found. Generate one first.` });
  }
  return report;
};

export {
  createVisit,
  addEvidence,
  getVisit,
  generateReport,
  getReport,
};
