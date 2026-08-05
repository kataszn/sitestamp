import { NoteSource } from "@sitestamp/shared";
import { AppError, Errors } from "#core/errors";
import { logger } from "#core/logger";
import { catchAsync } from "#utils/catch-async";
import * as services from "#features/visit/domain/service";
import { transcribeAudio } from "#features/visit/infra/gemma.client";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from 'node:fs/promises';
import { ENV } from "#core/env";
import { RequestHandler } from "express";

export const createVisit: RequestHandler = catchAsync(async (req, res) => {
  const visit = await services.createVisit(req.body);
  res.status(201).json(visit);
});

export const getVisit: RequestHandler = catchAsync(async (req, res) => {
  const visitId = req.params.id as string;
  const visit = await services.getVisit(visitId);
  res.status(200).json(visit);
});

export const getAllVisits: RequestHandler = catchAsync(async (req, res) => {
  const visits = await services.getAllVisits();
  res.status(200).json(visits);
});

export const addEvidence: RequestHandler = catchAsync(async (req, res) => {
  const files = req.files as {
    image?: Express.Multer.File[];
    audio?: Express.Multer.File[];
  };
  const image = files.image?.[0];
  const audio = files.audio?.[0];

  if (!image) {
    throw new AppError(Errors.VALIDATION, { message: 'Image file is required' });
  }

  const evidence = await services.addEvidence({
    visitId: req.params.id as string,
    note: req.body.note,
    image,
    audio,
  });
  res.status(200).json(evidence);
});

export const generateReport: RequestHandler = catchAsync(async (req, res) => {
  const visitId = req.params.id as string;
  // Return 202 immediately — report generation runs in the background
  res.status(202).json({ status: "GENERATING" });

  // Fire-and-forget: todo: consider using a queue/events system
  services.generateReport(visitId).catch((err) => {
    logger.error("Background report generation failed", { visitId, err });
  });
});

export const getReport: RequestHandler = catchAsync(async (req, res) => {
  const visitId = req.params.id as string;
  const report = await services.getReport(visitId);
  res.status(200).json(report);
});

export const updateStatus: RequestHandler = catchAsync(async (req, res) => {
  const visitId = req.params.id as string;
  const { status } = req.body;
  const updatedVisit = await services.updateVisitStatus(visitId, status);
  res.status(200).json(updatedVisit);
});

export const removeEvidence: RequestHandler = catchAsync(async (req, res) => {
  const evidenceId = req.params.id as string;
  await services.removeEvidence(evidenceId);
  res.status(204).send();
});