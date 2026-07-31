import { Router } from "express";
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import route from "../../middlewares/route";
import * as services from "./service";
import { validate, CaptionSource } from "@inspection/shared";
import { evidenceUpload } from "../../middlewares/upload";
import { AppError, Errors } from "../../core/errors";
import { ENV } from "../../core/env";
import { transcribeAudio } from "./gemma.client";


const router: Router = Router({ mergeParams: true });

router.post("/", route(validate.createVisit, async (req, res) => {
  const visit = await services.createVisit(req.body);
  res.status(201).json(visit);
}));

router.post("/:id/evidence", evidenceUpload, route(validate.addEvidence, async (req, res) => {
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
    visitId: req.params.id,
    imageUrl,
    mimeType: image.mimetype,
    caption,
    captionSource,
  });
  res.status(200).json(evidence);
}));

router.get("/:id", route(validate.idParam, async (req, res) => {
  const visit = await services.getVisit(req.params.id);
  res.status(200).json(visit);
}));

router.post("/:id/report", route(validate.generateReport, async (req, res) => {
  const report = await services.generateReport(req.params.id);
  res.status(200).json(report);
}));

router.get("/:id/report", route(validate.idParam, async (req, res) => {
  const report = await services.getReport(req.params.id);
  res.status(200).json(report);
}));

export default router;

/**
 * @swagger
 * tags:
 *   - name: Visits
 *     description: Inspection visit management
 *   - name: Evidence
 *     description: Photo / audio evidence for a visit
 *   - name: Reports
 *     description: AI-generated defect reports
 *
 * /visits:
 *   post:
 *     tags: [Visits]
 *     summary: Create a new inspection visit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisitInput'
 *     responses:
 *       201:
 *         description: Visit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VisitDTO'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /visits/{id}:
 *   get:
 *     tags: [Visits]
 *     summary: Retrieve a visit by ID, including its evidence and report
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit CUID
 *     responses:
 *       200:
 *         description: Visit found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VisitDTO'
 *       404:
 *         description: Visit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /visits/{id}/evidence:
 *   post:
 *     tags: [Evidence]
 *     summary: Upload photo (and optionally audio) evidence for a visit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit CUID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Photo file (JPEG/PNG)
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Optional voice note (WAV/MP3)
 *               caption:
 *                 type: string
 *                 description: Optional text caption for the photo
 *     responses:
 *       200:
 *         description: Evidence added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvidenceDTO'
 *       400:
 *         description: Image file missing or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Visit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /visits/{id}/report:
 *   post:
 *     tags: [Reports]
 *     summary: Trigger AI report generation for a visit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit CUID
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportDTO'
 *       404:
 *         description: Visit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   get:
 *     tags: [Reports]
 *     summary: Get the previously generated report for a visit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit CUID
 *     responses:
 *       200:
 *         description: Report found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReportDTO'
 *       404:
 *         description: Report not found (generate one first)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */