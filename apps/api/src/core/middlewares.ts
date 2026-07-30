import cors from "cors";
import helmet from "helmet";
import express from "express";
import morgan from "morgan";
import { logger } from "./logger";
import { ENV } from "./env";
import { AppError, Errors } from "./errors";
import type { Request, Response, NextFunction } from "express";

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

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof AppError ? err : new AppError(Errors.INTERNAL);

  const level = logLevelByCode[error.definition.code] || "error";
  logger[level](error.definition.code, {
    statusCode: error.definition.httpStatus,
    path: req.path,
    method: req.method,
    message: error.message,
  });

  res.status(error.definition.httpStatus).json({
    status: error.definition.httpStatus,
    code: error.definition.code,
    message: error.message,
    ...(error.data && { data: error.data }),
  });
};

const logLevelByCode: Record<string, "debug" | "info" | "warn" | "error"> = {
  INTERNAL_ERROR: "error",
  NOT_FOUND: "warn",
  VALIDATION: "info",
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(Errors.NOT_FOUND, {
      data: { path: req.path, method: req.method },
    })
  );
};
  