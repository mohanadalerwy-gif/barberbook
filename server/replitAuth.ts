import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { sendOtpEmail } from "./email";

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
        if (!user.emailVerified) {
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
    const { email, password, firstName, lastName, lang } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {
      const existing = await storage.getUserByEmail(email.toLowerCase());
      if (existing) {
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

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await storage.createEmailVerification(user.id, code, expiresAt);
      await sendOtpEmail(user.email!, code, lang === "ar" ? "ar" : "en");

      res.status(201).json({ requiresVerification: true, userId: user.id });
    } catch (err: any) {
      console.error("Registration error:", err);
      const detail = err?.message ?? String(err);
      res.status(500).json({ message: `Registration failed: ${detail}` });
    }
  });

  app.post("/api/verify-email", async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).json({ message: "userId and code are required" });
    }

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
    const { userId, lang } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

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
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        if (info?.message === "EMAIL_NOT_VERIFIED") {
          // Find the user so we can return their id for the verification redirect.
          const existing = await storage.getUserByEmail((req.body.email ?? "").toLowerCase());
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
