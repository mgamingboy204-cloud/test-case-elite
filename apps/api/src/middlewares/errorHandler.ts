import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { formatZodError } from "../utils/validation";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // ✅ critical: don't try to respond twice
  if (res.headersSent) return next(err);

  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({ message: "Payload too large" });
  }

  if (err instanceof HttpError) {
    const body = err.body ?? {};
    if (typeof body === "string") {
      return res.status(err.status).json({ message: body });
    }
    if (typeof body.error === "string") {
      return res.status(err.status).json({ message: body.error });
    }
    if (body.error?.message) {
      return res.status(err.status).json({ message: body.error.message, fieldErrors: body.error.fieldErrors });
    }
    if (body.message) {
      return res.status(err.status).json(body);
    }
    return res.status(err.status).json({ message: "Request failed" });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Duplicate value" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
    return res.status(400).json({ message: "Invalid request" });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: "Invalid request" });
  }

  if (err instanceof ZodError) {
    const details = formatZodError(err);
    return res.status(400).json({ message: details.message, fieldErrors: details.fieldErrors });
  }

  logger.error("Unhandled error", err);
  return res.status(500).json({ message: "Internal server error" });
}
