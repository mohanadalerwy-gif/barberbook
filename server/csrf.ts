import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// Public auth flows that run before a session exists — no CSRF needed.
const CSRF_EXEMPT_PATHS = new Set([
  "/login",
  "/register",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/resend-verification",
]);

export function generateCsrfToken(req: any): string {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken as string;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Safe methods never mutate state.
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  // Exempt public auth paths (path is relative because middleware is mounted at /api).
  if (CSRF_EXEMPT_PATHS.has(req.path)) return next();

  // Unauthenticated requests will be rejected by isAuthenticated middleware anyway.
  if (!(req as any).isAuthenticated?.()) return next();

  const clientToken = (req.headers["x-csrf-token"] as string) ?? "";
  const sessionToken = ((req as any).session?.csrfToken as string) ?? "";

  const tokensMatch =
    clientToken.length > 0 &&
    sessionToken.length > 0 &&
    clientToken.length === sessionToken.length &&
    crypto.timingSafeEqual(Buffer.from(clientToken), Buffer.from(sessionToken));

  if (!tokensMatch) {
    return res.status(403).json({ message: "طلب غير مصرح به" });
  }

  next();
}
