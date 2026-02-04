import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

function uniquePhone() {
  const seed = Date.now() % 10_000_000;
  return `555${seed.toString().padStart(7, "0")}`;
}

describe("Public auth access", () => {
  it("allows registration without Authorization header", async () => {
    const phone = uniquePhone();
    const response = await request(app)
      .post("/auth/register")
      .send({ phone, password: "Password@1", email: `${phone}@example.com` });
    expect([200, 201]).toContain(response.status);
  });

  it("rejects protected routes without Authorization header", async () => {
    const response = await request(app).get("/profile");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing authorization header");
  });
});
