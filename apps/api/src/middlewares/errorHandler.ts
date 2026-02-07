import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { formatZodError } from "../utils/validation";

/**
 * Shape of HttpError.body
 * Explicit typing fixes TS2339 errors
 */
type ErrorBody =
  | string
  | {
      message?: string;
      error?: {
        message?: string;
        fieldErrors?: Record<string, string[]>;
      } | string;
      fieldErrors?: Record<string, string[]>;
    };

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // never respond twice
  if (res.headersSent) return next(err);

  // payload too large (multer / body-parser)
  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large" });
  }

  // custom HttpError
    if (err instanceof HttpError) {
    const body = err.body as
      | string
      | { message?: string; fieldErrors?: Record<string, string[]> }
      | undefined;
  
    // body is a plain string
    if (typeof body === "string") {
      return res.status(err.status).json({ message: body });
    }
  
    // body is an object (or undefined)
    const message =
      typeof body?.message === "string" ? body.message : "Request failed";
  
    const fieldErrors =
      body?.fieldErrors && typeof body.fieldErrors === "object"
        ? body.fieldErrors
        : undefined;
  
    return res
      .status(err.status)
      .json(fieldErrors ? { message, fieldErrors } : { message });
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
      message: details.message,
      fieldErrors: details.fieldErrors,
    });
  }

  // fallback
  logger.error("Unhandled error", err);
  return res.status(500).json({ message: "Internal server error" });
}
