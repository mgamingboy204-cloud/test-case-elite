export function serializeForContract<T>(value: T): unknown {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();

  if (Array.isArray(value)) {
    return value.map((item) => serializeForContract(item));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue;
      out[key] = serializeForContract(nested);
    }
    return out;
  }

  return value;
}
