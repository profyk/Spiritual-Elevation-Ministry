import { describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp } from "../src/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit and denies the one that exceeds it", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 3, windowMs: 60_000 };

    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;

    expect(checkRateLimit(keyA, opts).allowed).toBe(true);
    expect(checkRateLimit(keyB, opts).allowed).toBe(true);
    expect(checkRateLimit(keyA, opts).allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  it("prefers the first address in x-forwarded-for", () => {
    const ip = getClientIp({ headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(ip).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const ip = getClientIp({ headers: { "x-real-ip": "9.9.9.9" } });
    expect(ip).toBe("9.9.9.9");
  });

  it("falls back to req.ip, then unknown", () => {
    expect(getClientIp({ headers: {}, ip: "10.0.0.1" })).toBe("10.0.0.1");
    expect(getClientIp({ headers: {} })).toBe("unknown");
  });
});
