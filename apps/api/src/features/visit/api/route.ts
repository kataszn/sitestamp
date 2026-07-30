import { Router } from "express";
import route from "../../../middlewares/route";
import * as services from "../domain/visits.service";
import { createVisitSchema, addEvidenceSchema, generateReportSchema, idParamSchema } from "@inspection/shared";

const router: Router = Router({ mergeParams: true });

router.post("/", route(createVisitSchema, async (req, res) => {
  const visit = await services.createVisit(req.body);
  res.status(201).json(visit);
}));

router.post("/:id/evidence", route(addEvidenceSchema, async (req, res) => {
  const visit = await services.addEvidence({
    visitId: req.params.visitId,
    imageUrl: req.body.imageUrl,
    caption: req.body.caption,
  });
  res.status(200).json(visit);
}));
  
router.get("/:id", route(idParamSchema, async (req, res) => {
  const visit = await services.getVisit(req.params.id);
  res.status(200).json(visit);
}));
  
router.post("/:id/report", route(generateReportSchema, async (req, res) => {
  const report = await services.generateReport(req.params.visitId);
  res.status(200).json(report);
}));
  
router.get("/:id/report", route(idParamSchema, async (req, res) => {
  const report = await services.getReport(req.params.id);
  res.status(200).json(report);
}));

export default router;