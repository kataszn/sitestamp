import { z } from "zod";
import { Request, Response, RequestHandler } from "express";

type InferRequest<T extends z.ZodType> = z.infer<T> extends {
  body?: infer Body;
  params?: infer Params;
  query?: infer Query;
}
  ? Request<
      Params extends object ? Params : {},
      any,
      Body extends object ? Body : {},
      Query extends object ? Query : {}
    >
  : Request;

/** 
 * Validates and routes a request to the provided handler. 
 * 
 */
export function route<T extends z.ZodType>(
  schema: T,
  handler: (req: InferRequest<T>, res: Response) => Promise<void>
): RequestHandler {
  return async (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(result.error);
    }

    Object.assign(req, result.data);

    try {
      await handler(req as InferRequest<T>, res);
    } catch (err) {
      next(err);
    }
  };
}

export default route;