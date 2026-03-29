import { Request, Response, NextFunction } from "express";
import { AppError } from "./error";

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * JWT auth middleware. For now, extracts user ID from Authorization header.
 * Will be replaced with proper JWT verification when Cognito is wired up.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid authorization header");
  }

  // TODO: Replace with JWT verification (Cognito)
  const token = authHeader.slice(7);
  if (!token) {
    throw new AppError(401, "Invalid token");
  }

  // Placeholder: in dev, the token IS the user ID for easy testing
  req.userId = token;
  next();
}
