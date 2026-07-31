import { z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Express middleware that validates `body`, `params`, and `query` against a Zod schema.
 * On success, the parsed data is merged into `req` for downstream handlers.
 * On failure, passes the Zod error to the next error handler.
 */
export function validate(schema: z.ZodType): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      next(result.error);
      return;
    }

    Object.assign(req, result.data);
    next();
  };
}

export default validate;