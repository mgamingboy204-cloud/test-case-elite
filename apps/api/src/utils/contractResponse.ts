import { Response } from "express";
import { ZodTypeAny } from "zod";
import { serializeForContract } from "./serialize";

export function sendContract<TSchema extends ZodTypeAny>(res: Response, schema: TSchema, payload: unknown) {
  const safePayload = serializeForContract(payload);
  const parsed = schema.parse(safePayload);
  return res.json(parsed);
}
