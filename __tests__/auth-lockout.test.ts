import { describe, expect, it } from "vitest";
import {
  getLoginLockoutExpiry,
  isLoginLocked,
  LOGIN_LOCKOUT_DURATION_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from "@/lib/auth-lockout";

describe("login lockout", () => {
  it("locks after three failed attempts for 24 hours", () => {
    const now = new Date("2026-10-22T00:00:00.000Z");
    const lockoutExpiry = getLoginLockoutExpiry(
      MAX_FAILED_LOGIN_ATTEMPTS,
      now,
    );

    expect(lockoutExpiry?.getTime()).toBe(
      now.getTime() + LOGIN_LOCKOUT_DURATION_MS,
    );
    expect(isLoginLocked(lockoutExpiry, now)).toBe(true);
  });

  it("does not lock before the third failed attempt", () => {
    expect(getLoginLockoutExpiry(MAX_FAILED_LOGIN_ATTEMPTS - 1)).toBeNull();
  });

  it("considers an expired lock available again", () => {
    const now = new Date("2026-10-22T00:00:00.000Z");

    expect(
      isLoginLocked(new Date(now.getTime() - 1), now),
    ).toBe(false);
  });
});
