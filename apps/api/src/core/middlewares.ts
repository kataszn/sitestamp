import cors from "cors";
import helmet from "helmet";
import express from "express";
import morgan from "morgan";
import type { Request, Response, NextFunction } from "express";

import { logger } from "#core/logger";
import { ENV } from "#core/env";
import { AppError, Errors } from "#core/errors";

export function registerMiddlewares(app: express.Express): void {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
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

const morganStream: morgan.StreamOptions = {
  write(message) {
    logger.info(message.trim());
  },
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  let error;
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof Error) {
    error =
      ENV.NODE_ENV === "production"
        ? new AppError(Errors.INTERNAL)
        : new AppError(Errors.INTERNAL, { message: err.message, cause: err });
  } else {
    error = new AppError(Errors.INTERNAL);
  }

  const level = logLevelByCategory(error.definition.category);
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

const logLevelByCategory = (category: "system" | "validation" | "external"): "error" | "info" => {
  switch (category) {
    case "system":
      return "error";
    case "validation":
      return "info";
    case "external":
      return "error";
  }
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(Errors.NOT_FOUND, {
      data: { path: req.path, method: req.method },
    })
  );
};