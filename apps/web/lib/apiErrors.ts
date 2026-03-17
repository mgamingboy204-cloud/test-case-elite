import { ApiError } from "@/lib/api";

export type NormalizedApiErrorCode =
  | "unauthenticated"
  | "onboarding_required"
  | "payment_required"
  | "profile_incomplete"
  | "matching_ineligible"
  | "profile_data_missing"
  | "generic_server_error";

export type NormalizedApiError = {
  code: NormalizedApiErrorCode;
  message: string;
  redirectTo: string | null;
  status: number;
};

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (!(error instanceof ApiError)) {
    return {
      code: "generic_server_error",
      message: "Unexpected error. Please try again.",
      redirectTo: null,
      status: 0
    };
  }

  const body = (typeof error.body === "object" && error.body !== null ? error.body : {}) as {
    code?: string;
    message?: string;
    redirectTo?: string;
  };

  const rawCode = String(body.code ?? "").toLowerCase();

  if (error.status === 401) {
    return { code: "unauthenticated", message: body.message ?? error.message, redirectTo: "/signin", status: error.status };
  }

  if (rawCode === "payment_required") {
    return { code: "payment_required", message: body.message ?? error.message, redirectTo: body.redirectTo ?? "/onboarding/payment", status: error.status };
  }
  if (rawCode === "profile_incomplete") {
    return { code: "profile_incomplete", message: body.message ?? error.message, redirectTo: body.redirectTo ?? "/onboarding/details", status: error.status };
  }
  if (rawCode === "profile_data_missing") {
    return { code: "profile_data_missing", message: body.message ?? error.message, redirectTo: body.redirectTo ?? "/profile", status: error.status };
  }
  if (rawCode === "matching_ineligible") {
    return { code: "matching_ineligible", message: body.message ?? error.message, redirectTo: body.redirectTo ?? "/profile", status: error.status };
  }
  if (rawCode.includes("onboarding") || rawCode.includes("verification") || error.status === 403) {
    return { code: "onboarding_required", message: body.message ?? error.message, redirectTo: body.redirectTo ?? "/onboarding/verification", status: error.status };
  }

  return {
    code: "generic_server_error",
    message: body.message ?? error.message,
    redirectTo: body.redirectTo ?? null,
    status: error.status
  };
}
