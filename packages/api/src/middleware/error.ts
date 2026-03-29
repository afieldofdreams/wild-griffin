import { Request, Response, NextFunction, RequestHandler } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Wraps an async route handler so thrown errors are passed to Express error middleware.
 * Without this, async throws crash the process instead of returning an error response.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(`[${req.method} ${req.path}]`, err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    res.status(400).json({ error: "Validation failed", details: (err as any).issues });
    return;
  }

  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
}
