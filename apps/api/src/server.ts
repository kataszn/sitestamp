import express from "express";
import { registerMiddlewares, errorHandler, notFoundHandler } from "./core/middlewares";
import { createV1Routes } from "./core/route";
import { connectDB, isDBConnected } from "./core/db";
import { createAppContext } from './core/app-context';

export async function createServer(): Promise<express.Express> {
  const app: express.Express = express();
  registerMiddlewares(app);

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
  app.use("/api/v1", createV1Routes());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
