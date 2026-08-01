import { Router } from "express";

import validate from "../../../middlewares/validate";
import * as handlers from "./handlers";
import { schema } from "@inspectai/shared";
import { evidenceUpload } from "../../../middlewares/upload";

const router: Router = Router({ mergeParams: true });

router.post("/", validate(schema.createVisit), handlers.createVisit);

router.get("/", handlers.getAllVisits);

router.post(
  "/:id/evidence",
  evidenceUpload,
  validate(schema.addEvidence),
  handlers.addEvidence
);

router.get("/:id", validate(schema.idParam), handlers.getVisit);

router.post("/:id/report", validate(schema.generateReport), handlers.generateReport);

router.get("/:id/report", validate(schema.idParam), handlers.getReport);

router.post("/:id/status", validate(schema.updateStatus), handlers.updateStatus);

router.post("/evidence/:id/remove", validate(schema.idParam), handlers.removeEvidence);


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
 *
 * /visits/{id}/status:
 *   post:
 *     tags: [Visits]
 *     summary: Update the status of a visit
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, COMPLETE]
 *                 description: New status for the visit
 *     responses:
 *       200:
 *         description: Visit found
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
 *       404:
 *         description: Visit not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /visits/evidence/{id}/remove:
 *   post:
 *     tags: [Evidence]
 *     summary: Remove an evidence item from a visit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Evidence CUID
 *     responses:
 *       204:
 *         description: Evidence removed successfully (no content)
 *       404:
 *         description: Evidence not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 */

/**
 * @swagger
 * /visits:
 *   get:
 *     tags: [Visits]
 *     summary: List all visits
 *     responses:
 *       200:
 *         description: A list of all visits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VisitDTO'
 *
 */