import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { isAuthorizedCronRequest } from "../src/lib/cron-auth";

describe("isAuthorizedCronRequest", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("accepts the correct bearer token", () => {
    expect(isAuthorizedCronRequest({ headers: { authorization: "Bearer test-secret" } })).toBe(true);
  });

  it("rejects a missing or wrong token", () => {
    expect(isAuthorizedCronRequest({ headers: {} })).toBe(false);
    expect(isAuthorizedCronRequest({ headers: { authorization: "Bearer wrong" } })).toBe(false);
    expect(isAuthorizedCronRequest({ headers: { authorization: "test-secret" } })).toBe(false);
  });

  it("refuses every request when CRON_SECRET isn't configured", () => {
    delete process.env.CRON_SECRET;
    expect(isAuthorizedCronRequest({ headers: { authorization: "Bearer test-secret" } })).toBe(false);
  });
});
