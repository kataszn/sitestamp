import { Router } from "express";
import route from "../../middlewares/route";
import * as services from "./service";
import { validate, CaptionSource } from "@inspection/shared";
import { evidenceUpload } from "../../middlewares/upload";
import { AppError, Errors } from "../../core/errors";

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

  const imageUrl = `/uploads/${image.filename}`;
  let caption = req.body.caption;
  let captionSource: CaptionSource = 'TEXT';

  if (audio) {
    // TODO: transcribe audio file here
    caption = req.body.caption;
    captionSource = 'VOICE';
  }

  const evidence = await services.addEvidence({
    visitId: req.params.id,
    imageUrl,
    caption,
    audioUrl: audio ? `/uploads/${audio.filename}` : undefined,
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