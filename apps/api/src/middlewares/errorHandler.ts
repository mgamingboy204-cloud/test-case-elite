import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { formatZodError } from "../utils/validation";

/**
 * Domain-specific error messages for a premium experience.
 */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string; code: string }> = {
  P2002: {
    status: 409,
    message: "This account already exists in our Elite network. Please log in instead.",
    code: "DUPLICATE_ENTRY",
  },
  P2025: {
    status: 404,
    message: "We couldn't find the requested information in our records.",
    code: "NOT_FOUND",
  },
  P2003: {
    status: 400,
    message: "The requested operation cannot be completed due to missing dependencies.",
    code: "FOREIGN_KEY_FAILURE",
  },
};

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);

  // 1. Handle HttpError (Explicitly thrown)
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.body.message,
      code: err.body.code ?? "HTTP_ERROR",
      fieldErrors: err.body.fieldErrors,
      currentStep: err.body.currentStep,
      requiredStep: err.body.requiredStep,
      redirectTo: err.body.redirectTo,
    });
  }

  // 2. Handle Prisma Client Errors (Database)
  const PrismaKnownRequestError = Prisma?.PrismaClientKnownRequestError as unknown as (new (...args: any[]) => Error) | undefined;
  if (PrismaKnownRequestError && err instanceof PrismaKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[err.code];
    if (mapped) {
      return res.status(mapped.status).json({
        message: mapped.message,
        code: mapped.code,
      });
    }
    // Generic DB error fallback
    logger.warn(`Unhandled Prisma Error [${err.code}]:`, err.message);
    return res.status(400).json({
      message: "Our elite systems encountered a data processing issue. Please try again.",
      code: `DB_ERROR_${err.code}`,
    });
  }

  // 3. Handle Prisma Validation Errors
  const PrismaValidationError = Prisma?.PrismaClientValidationError as unknown as (new (...args: any[]) => Error) | undefined;
  if (PrismaValidationError && err instanceof PrismaValidationError) {
    logger.error("Prisma Validation Error:", err.message);
    return res.status(400).json({
      message: "The provided information does not meet our elite quality standards.",
      code: "DATA_VALIDATION_ERROR",
    });
  }

  // 4. Handle Zod Validation Errors (Input)
  if (err instanceof ZodError) {
    const details = formatZodError(err);
    return res.status(400).json({
      message: "Some details in your request require adjustment.",
      code: "VALIDATION_ERROR",
      fieldErrors: details.fieldErrors,
    });
  }

  // 5. Handle Body Parser Errors (Payload size)
  if ((err as any)?.type === "entity.too.large") {
    return res.status(413).json({
      message: "The file or information you are trying to send exceeds our size limits.",
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  // 6. Final Fallback (Unhandled)
  const shouldShowFullStack = req.path === "/likes" || process.env.LIKES_DEBUG_LOGS === "1";
  logger.error("Unhandled Global Error:", {
    requestId: (res.locals.requestId as string | undefined) ?? req.get("x-request-id") ?? null,
    path: req.path,
    message: err.message,
    stack: shouldShowFullStack || process.env.NODE_ENV !== "production" ? err.stack : "REDACTED",
    method: req.method,
    userId: req.user?.id ?? null,
  });

  return res.status(500).json({
    message: "Our systems are experiencing a momentary lapse in excellence. Please refresh.",
    code: "INTERNAL_SERVER_ERROR",
  });
}
