export class HttpError extends Error {
  status: number;
  body: {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string[]>;
    currentStep?: string;
    requiredStep?: string;
    redirectTo?: string;
  };

  constructor(
    status: number,
    body:
      | string
      | {
          message: string;
          code?: string;
          fieldErrors?: Record<string, string[]>;
          currentStep?: string;
          requiredStep?: string;
          redirectTo?: string;
        }
  ) {
    const message = typeof body === "string" ? body : body.message || "Request failed";
    super(message);
    this.status = status;
    this.name = "HttpError";

    if (typeof body === "string") {
      this.body = { message: body };
    } else {
      this.body = body;
    }
  }
}
