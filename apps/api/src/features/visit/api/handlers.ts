import catchAsync from '../../../utils/catch-async';
import { AppError, Errors } from '../../../core/errors';

const createVisit = catchAsync(async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

const addEvidence = catchAsync(async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

const getVisit = catchAsync(async (req, res) => {
  throw new AppError(Errors.NOT_FOUND, { message: "test: Visit not found" });
  res.status(501).json({ message: "Not implemented" });
});

const generateReport = catchAsync(async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

const getReport = catchAsync(async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export {
  createVisit,
  addEvidence,
  getVisit,
  generateReport,
  getReport
};