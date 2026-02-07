import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { formatZodError } from "../utils/validation";

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = formatZodError(parsed.error);
      return res.status(400).json({ message: details.message, fieldErrors: details.fieldErrors });
    }
    req.body = parsed.data;
    return next();
  };
}

export function validateParams(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const details = formatZodError(parsed.error);
      return res.status(400).json({ message: details.message, fieldErrors: details.fieldErrors });
    }
    req.params = parsed.data;
    return next();
  };
}

export function validateQuery(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const details = formatZodError(parsed.error);
      return res.status(400).json({ message: details.message, fieldErrors: details.fieldErrors });
    }
    req.query = parsed.data;
    return next();
  };
}
