import pino from "pino";
import { ENV } from "../core/env";

export const baseLogger = pino({
  level: ENV.LOG_LEVEL,
  base: { service: ENV.SERVICE_NAME, env: ENV.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

const logWithContext = (level: pino.Level, msg: string, meta?: object | Error) => {
  const logData = {
    ...(meta instanceof Error ? { err: meta } : meta),
  };

  baseLogger[level](logData, msg);
};

export const logger = {
  trace: (msg: string, meta?: object | Error) => logWithContext("trace", msg, meta),
  debug: (msg: string, meta?: object | Error) => logWithContext("debug", msg, meta),
  info: (msg: string, meta?: object | Error) => logWithContext("info", msg, meta),
  warn: (msg: string, meta?: object | Error) => logWithContext("warn", msg, meta),
  error: (msg: string, meta?: object | Error) => logWithContext("error", msg, meta),
  fatal: (msg: string, meta?: object | Error) => logWithContext("fatal", msg, meta),
};