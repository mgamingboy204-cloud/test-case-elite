export class HttpError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    const message =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : "Request failed";
    super(message);
    this.status = status;
    if (typeof body.message === "string") {
      this.body = body;
    } else if (typeof body.error === "string") {
      this.body = { message: body.error, fieldErrors: body.fieldErrors };
    } else {
      this.body = { message };
    }
  }
}
