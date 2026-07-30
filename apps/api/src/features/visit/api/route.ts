import { Router } from "express";
import * as handlers from "./handlers";

export function createVisitRoutes(): Router {
  const router = Router({ mergeParams: true });

  router.post("/", handlers.createVisit);
  router.post("/:id/evidence", handlers.addEvidence);
  router.get("/:id", handlers.getVisit);
  router.post("/:id/report", handlers.generateReport);
  router.get("/:id/report", handlers.getReport);

  return router;
}