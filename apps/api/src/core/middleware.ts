import cors from "cors";
import helmet from "helmet";
import express from "express";
import morgan from "morgan";
import { logger } from "./logger";
import { ENV } from "./env";

const morganStream: morgan.StreamOptions = {
  write(message) {
    logger.info(message.trim());
  },
};

export function registerMiddlewares(app: express.Express): void {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(helmet());
  app.use(
    cors({
      origin: [ENV.CORS_ORIGIN],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );

  app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
      stream: morganStream,
      skip: (_req, _res) => process.env.NODE_ENV === "test",
    }),
  );
}