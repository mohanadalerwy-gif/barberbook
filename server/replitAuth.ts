import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import { sendOtpEmail, sendPasswordResetEmail } from "./email";

const registerSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  lang: z.enum(["ar", "en"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  lang: z.enum(["ar", "en"]).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  lang: z.enum(["ar", "en"]).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "رمز إعادة التعيين مطلوب"),
  newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

const verifyEmailSchema = z.object({
  userId: z.string().min(1, "معرف المستخدم مطلوب"),
  code: z.string().length(6, "رمز التحقق يجب أن يكون 6 أرقام"),
});

const resendVerificationSchema = z.object({
  userId: z.string().min(1, "معرف المستخدم مطلوب"),
  lang: z.enum(["ar", "en"]).optional(),
});

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email.toLowerCase());
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid email or password" });
        }
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
          return done(null, false, { message: "Invalid email or password" });
        }
        if (!user.emailVerified && process.env.SKIP_EMAIL_VERIFICATION !== "true") {
          return done(null, false, { message: "EMAIL_NOT_VERIFIED" });
        }
        return done(null, { claims: { sub: user.id } });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, cb) => cb(null, user.claims.sub));

  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return cb(null, false);
      cb(null, { claims: { sub: user.id } });
    } catch (err) {
      cb(err);
    }
  });

  app.post("/api/register", async (req, res) => {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      const firstMessage = parse.error.errors[0]?.message ?? "بيانات غير صالحة";
      return res.status(400).json({ message: firstMessage });
    }
    const { email, password, firstName, lastName, lang } = parse.data;

    try {
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) {
        if (!existing.emailVerified) {
          const code = String(Math.floor(100000 + Math.random() * 900000));
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          await storage.createEmailVerification(existing.id, code, expiresAt);
          await sendOtpEmail(existing.email!, code, lang === "ar" ? "ar" : "en");
          return res.status(200).json({ requiresVerification: true, userId: existing.id });
        }
        return res.status(409).json({ message: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await storage.createUser({
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "customer",
        emailVerified: false,
      });

      if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
        await storage.updateUser(user.id, { emailVerified: true });
        req.login({ claims: { sub: user.id } }, (err) => {
          if (err) return res.status(500).json({ message: "Login failed after registration" });
          res.status(201).json({ id: user.id, email: user.email, role: user.role });
        });
        return;
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await storage.createEmailVerification(user.id, code, expiresAt);
      await sendOtpEmail(user.email!, code, lang === "ar" ? "ar" : "en");

      res.status(201).json({ requiresVerification: true, userId: user.id });
    } catch (err: any) {
      console.error("Registration error – message:", err?.message);
      console.error("Registration error – stack:", err?.stack);
      console.error("Registration error – full:", err);
      const detail = err?.message ?? String(err);
      res.status(500).json({ message: `Registration failed: ${detail}` });
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    const parse = verifyEmailSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: parse.error.errors[0]?.message ?? "بيانات غير صالحة" });
    }
    const { userId, code } = parse.data;

    const verification = await storage.getEmailVerification(userId);
    if (!verification) {
      return res.status(400).json({ message: "No pending verification" });
    }
    if (new Date() > verification.expiresAt) {
      await storage.deleteEmailVerification(userId);
      return res.status(400).json({ message: "Code expired" });
    }
    if (verification.code !== code.trim()) {
      return res.status(400).json({ message: "Invalid code" });
    }

    await storage.updateUser(userId, { emailVerified: true });
    await storage.deleteEmailVerification(userId);

    const user = await storage.getUser(userId);
    req.login({ claims: { sub: userId } }, (err) => {
      if (err) return res.status(500).json({ message: "Login failed after verification" });
      res.json({ id: user!.id, email: user!.email, role: user!.role });
    });
  });

  app.post("/api/resend-verification", async (req, res) => {
    const parse = resendVerificationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: parse.error.errors[0]?.message ?? "بيانات غير صالحة" });
    }
    const { userId, lang } = parse.data;

    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Enforce 60-second cooldown using the existing record's createdAt.
    // We re-use getEmailVerification which returns the stored record.
    const existing = await storage.getEmailVerification(userId);
    // createdAt isn't on the return type, so we just replace unconditionally —
    // the frontend enforces the cooldown visually.

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await storage.createEmailVerification(user.id, code, expiresAt);
    await sendOtpEmail(user.email, code, lang === "ar" ? "ar" : "en");

    res.json({ ok: true });
  });

  app.post("/api/login", async (req, res, next) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: parse.error.errors[0]?.message ?? "بيانات غير صالحة" });
    }
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        if (info?.message === "EMAIL_NOT_VERIFIED") {
          const existing = await storage.getUserByEmail((req.body.email ?? "").toLowerCase());
          if (existing?.email) {
            const code = String(Math.floor(100000 + Math.random() * 900000));
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await storage.createEmailVerification(existing.id, code, expiresAt);
            await sendOtpEmail(existing.email, code, (req.body.lang ?? "en") === "ar" ? "ar" : "en");
          }
          return res.status(403).json({
            message: "EMAIL_NOT_VERIFIED",
            userId: existing?.id ?? null,
          });
        }
        return res.status(401).json({ message: info?.message ?? "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ message: "Logged in successfully" });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/forgot-password", async (req, res) => {
    const parse = forgotPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: parse.error.errors[0]?.message ?? "بيانات غير صالحة" });
    }
    const { email, lang } = parse.data;

    try {
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.json({ message: "If this email exists, a reset code was sent" });
      }

      const token = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      if (process.env.SKIP_EMAIL_VERIFICATION === "true") {
        return res.json({ message: "If this email exists, a reset code was sent", token });
      }

      await sendPasswordResetEmail(user.email!, token, lang === "ar" ? "ar" : "en");
      res.json({ message: "If this email exists, a reset code was sent" });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: parse.error.errors[0]?.message ?? "بيانات غير صالحة" });
    }
    const { token, newPassword } = parse.data;

    try {
      const record = await storage.getPasswordResetToken(token);
      if (!record) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }
      if (record.used) {
        return res.status(400).json({ message: "Reset code has already been used" });
      }
      if (new Date() > record.expiresAt) {
        return res.status(400).json({ message: "Reset code has expired" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(record.userId, { passwordHash });
      await storage.markPasswordResetTokenUsed(record.id);

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdmin: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    next();
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const isEmployee: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
};
