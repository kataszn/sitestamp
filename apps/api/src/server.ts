import express from "express";
import { registerMiddlewares } from "./core/middleware";
import { createV1Routes } from "./core/route";

export async function createServer(): Promise<express.Express> {
  const app: express.Express = express();

  registerMiddlewares(app);

  app.get("/health", async (_req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  });

  app.use("/api/v1", createV1Routes());

  return app;
}
