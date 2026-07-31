import { Router } from "express";
import visit from "../features/visit/api/route";

export function createV1Routes(): Router {
  const router = Router();

  router.use("/visits", visit);

  return router;
}