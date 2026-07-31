import express from "express";
import { registerMiddlewares, errorHandler, notFoundHandler } from "./core/middlewares";
import { createV1Routes } from "./core/route";
import { connectDB, isDBConnected } from "./core/db";
import { createAppContext } from './core/app-context';
import { openApiSpec } from "./core/openapi";
import swaggerUi from "swagger-ui-express";
import { ENV } from "./core/env";
import fs from "node:fs/promises";

export async function createServer(): Promise<express.Express> {
  const app: express.Express = express();
  registerMiddlewares(app);

  // Ensure upload directory exists
  await fs.mkdir(ENV.UPLOAD_DIR, { recursive: true });

  const db = await connectDB();
  createAppContext(db);

  app.get("/health", async (_req: express.Request, res: express.Response) => {
    const connected = await isDBConnected(db);
    res.status(connected ? 200 : 503).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: connected ? "connected" : "disconnected",
    });
  });

  // Swagger UI
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Serve uploaded files
  app.use("/uploads", express.static(ENV.UPLOAD_DIR));

  app.use("/v1", createV1Routes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
