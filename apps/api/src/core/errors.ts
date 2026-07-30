export class AppError extends Error {
  readonly definition: ErrorDefinition;
  readonly data?: object;

  constructor(definition: ErrorDefinition, options: AppErrorOptions = {}) {
    super(options.message ?? definition.message);

    this.definition = definition;
    this.data = options.data;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export type ErrorCode = string;

export interface ErrorDefinition {
  readonly code: ErrorCode;
  readonly message: string;
  readonly httpStatus: number;
  readonly category: "system" | "validation" | "business";
}

export interface AppErrorOptions {
  message?: string;
  data?: object;
  cause?: Error;
}

export const Errors = {
  INTERNAL: {
    code: "INTERNAL_ERROR",
    message: "An internal server error occurred.",
    httpStatus: 500,
    category: "system",
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    message: "The requested resource was not found.",
    httpStatus: 404,
    category: "business",
  },
  VALIDATION: {
    code: "VALIDATION",
    message: "Validation failed.",
    httpStatus: 400,
    category: "validation",
  },
  BAD_REQUEST: {
    code: "BAD_REQUEST",
    message: "Bad request.",
    httpStatus: 400,
    category: "business",
  }
} as const;