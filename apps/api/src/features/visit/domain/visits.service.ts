import type {
  CreateVisitInput,
  AddEvidenceInput,
  VisitDTO,
  ReportDTO,
} from "@inspection/shared";

const createVisit = async (input: CreateVisitInput): Promise<VisitDTO> => {
  throw new Error("Not implemented");
};

const addEvidence = async (input: AddEvidenceInput): Promise<VisitDTO> => {
  throw new Error("Not implemented");
};

const getVisit = async (visitId: string): Promise<VisitDTO> => {
  throw new Error("Not implemented");
};

const generateReport = async (visitId: string): Promise<ReportDTO> => {
  throw new Error("Not implemented");
};

const getReport = async (visitId: string): Promise<ReportDTO> => {
  throw new Error("Not implemented");
};

export {
  createVisit,
  addEvidence,
  getVisit,
  generateReport,
  getReport,
};
