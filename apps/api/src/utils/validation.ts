import { z } from "zod";

export function formatZodError(error: z.ZodError) {
  const flattened = error.flatten();
  const messages = [
    ...flattened.formErrors,
    ...Object.values(flattened.fieldErrors).flat().filter(Boolean)
  ];
  return {
    message: messages.join(", ") || "Invalid request",
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors
  };
}
