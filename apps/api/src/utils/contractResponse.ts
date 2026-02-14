import { Response } from "express";
import { ZodTypeAny } from "zod";

export function sendContract<TSchema extends ZodTypeAny>(res: Response, schema: TSchema, payload: unknown) {
  const parsed = schema.parse(payload);
  return res.json(parsed);
}
