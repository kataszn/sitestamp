import { Router } from "express";
import { createVisitRoutes } from "../features/visit/api/route";

export function createV1Routes(): Router {
  const router = Router();

  router.use("/visits", createVisitRoutes());

  return router;
}