import { CaptionSource } from "@inspectai/shared";
import { AppError, Errors } from "../../../core/errors";
import { catchAsync } from "../../../utils/catch-async";
import * as services from "../service";
import * as reportProgress from "../infra/report-progress";
import { transcribeAudio } from "../infra/gemma.client";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from 'node:fs/promises';
import { ENV } from "../../../core/env";
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
  const files = req.files as { image?: Express.Multer.File[]; audio?: Express.Multer.File[] };
  const image = files.image?.[0];
  const audio = files.audio?.[0];

  if (!image) {
    throw new AppError(Errors.BAD_REQUEST, { message: 'Image file is required' });
  }

  // audio: never touches disk, buffer goes straight to transcription and is discarded
  let caption = req.body.caption;
  let captionSource: CaptionSource = 'TEXT';

  if (audio) {
    const audioCaption = await transcribeAudio(audio.buffer, audio.mimetype);
    caption = audioCaption;
    captionSource = 'VOICE';
  }

  // image: write buffer to disk, we need it to persist for the report + Gemma call
  const ext = path.extname(image.originalname) || '.jpg';
  const filename = `${caption || randomUUID()}-${ext}`;
  await fs.writeFile(path.join(ENV.UPLOAD_DIR, filename), image.buffer);
  const imageUrl = `/uploads/${filename}`;
  

  const evidence = await services.addEvidence({
    visitId: req.params.id as string,
    imageUrl,
    mimeType: image.mimetype,
    caption,
    captionSource,
  });
  res.status(200).json(evidence);
});

export const generateReport: RequestHandler = catchAsync(async (req, res) => {
  const visitId = req.params.id as string;
  reportProgress.startReportGeneration(visitId);
  res.status(202).json({ status: "GENERATING" });
});

export const streamReportProgress: RequestHandler = async (req, res) => {
  const visitId = req.params.id as string;
  const startRequested = req.query.start === "1";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const visit = await services.getVisit(visitId);
    const existingJob = reportProgress.getReportJob(visitId);
    const shouldStart = (startRequested && !visit.report) || visit.status === "GENERATING";

    const job = shouldStart
      ? reportProgress.startReportGeneration(visitId)
      : existingJob;

    if (!job) {
      res.write(`data: ${JSON.stringify({ error: "No generation job available." })}\n\n`);
      res.end();
      return;
    }

    if (job.preview) {
      res.write(`data: ${JSON.stringify({ preview: job.preview })}\n\n`);
    }

    if (job.status === "complete") {
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    if (job.status === "error") {
      res.write(`data: ${JSON.stringify({ error: job.error ?? "Stream failed" })}\n\n`);
      res.end();
      return;
    }

    const onProgress = (chunk: string, preview: string) => {
      res.write(`data: ${JSON.stringify({ text: chunk, preview })}\n\n`);
    };

    const cleanup = () => {
      job.emitter.off("progress", onProgress);
      job.emitter.off("complete", onComplete);
      job.emitter.off("failure", onError);
    };

    const onComplete = () => {
      cleanup();
      res.write("data: [DONE]\n\n");
      res.end();
    };

    const onError = (message: string) => {
      cleanup();
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    };

    job.emitter.on("progress", onProgress);
    job.emitter.on("complete", onComplete);
    job.emitter.on("failure", onError);

    req.on("close", () => {
      cleanup();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream failed";
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  }
};

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