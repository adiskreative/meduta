export const MAX_FAILED_LOGIN_ATTEMPTS = 3;
export const LOGIN_LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;

export function isLoginLocked(
  loginLockedUntil: Date | null,
  now: Date = new Date(),
): boolean {
  return loginLockedUntil !== null && loginLockedUntil > now;
}

export function getLoginLockoutExpiry(
  failedLoginAttempts: number,
  now: Date = new Date(),
): Date | null {
  if (failedLoginAttempts < MAX_FAILED_LOGIN_ATTEMPTS) return null;
  return new Date(now.getTime() + LOGIN_LOCKOUT_DURATION_MS);
}
