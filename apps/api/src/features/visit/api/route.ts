import { Router } from "express";

export function createVisitRoutes(): Router {
  const router = Router({ mergeParams: true });

  router.post("/", (req, res) => {
    res.status(501).json({ message: "Not implemented" });
  });

  router.post("/:id/evidence", (req, res) => {
    res.status(501).json({ message: "Not implemented" });
  });

  router.get("/:id", (req, res) => {
    res.status(501).json({ message: "Not implemented" });
  });

  router.post("/:id/report", (req, res) => {
    res.status(501).json({ message: "Not implemented" });
  });

  router.get("/:id/report", (req, res) => {
    res.status(501).json({ message: "Not implemented" });
  });

  return router;
}