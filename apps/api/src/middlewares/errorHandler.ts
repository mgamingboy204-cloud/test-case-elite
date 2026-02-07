import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { formatZodError } from "../utils/validation";

/**
 * Supported shapes for HttpError.body across the codebase.
 * Keep this tolerant so older callers don't break builds.
 */
type HttpErrorBody =
  | string
  | {
      message?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | {
      error?: string | { message?: string; fieldErrors?: Record<string, string[]> };
      message?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | undefined;

function normalizeHttpErrorBody(body: HttpErrorBody): {
  message: string;
  fieldErrors?: Record<string, string[]>;
} {
  if (!body) return { message: "Request failed" };

  // plain string body
  if (typeof body === "string") return { message: body };

  // legacy nested error: { error: "msg" }
  if (typeof (body as any).error === "string") {
    const b = body as { error: string; fieldErrors?: Record<string, string[]> };
    return { message: b.error, fieldErrors: b.fieldErrors };
  }

  // legacy nested error: { error: { message, fieldErrors } }
  if (typeof (body as any).error === "object" && (body as any).error !== null) {
    const e = (body as any).error as { message?: string; fieldErrors?: Record<string, string[]> };
    return {
      message: e.message ?? "Request failed",
      fieldErrors: e.fieldErrors
    };
  }

  // normal shape: { message, fieldErrors }
  const b = body as { message?: string; fieldErrors?: Record<string, string[]> };
  if (typeof b.message === "string") return { message: b.message, fieldErrors: b.fieldErrors };

  // last resort
  return { message: "Request failed" };
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // never respond twice
  if (res.headersSent) return next(err);

  // payload too large (multer / body-parser)
  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large" });
  }

  // custom HttpError
  if (err instanceof HttpError) {
    const { message, fieldErrors } = normalizeHttpErrorBody(err.body as HttpErrorBody);
    return res.status(err.status).json({
      message,
      ...(fieldErrors ? { fieldErrors } : {})
    });
  }

  // prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Duplicate value" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
    return res.status(400).json({ message: "Invalid request" });
  }

  // prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // zod validation errors
  if (err instanceof ZodError) {
    const details = formatZodError(err);
    return res.status(400).json({
      message: details.message ?? "Validation error",
      ...(details.fieldErrors ? { fieldErrors: details.fieldErrors } : {})
    });
  }

  // fallback
  logger.error("Unhandled error", err);
  return res.status(500).json({ message: "Internal server error" });
}
