import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { and, eq, gt, sql, lt } from "drizzle-orm";
import { loginSchema } from "../shared/schemas";
import { getDb } from "./db";
import { users, sessions, loginAttempts } from "./db/schema";
import { digest } from "./token";
import { parseStates } from "./access";
import type { AppEnv } from "./env";
import type { MiddlewareHandler } from "hono";

const cookie = "vetcita_session";
export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, cookie);
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    return c.json({ error: "Inicia sesión para continuar" }, 401);
  const db = getDb(c.env.DB);
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, await digest(token)),
        gt(sessions.expiresAt, new Date().toISOString()),
      ),
    );
  if (!row)
    return c.json(
      { error: "Tu sesión ha caducado. Inicia sesión de nuevo." },
      401,
    );
  c.set("user", {
    id: row.user.id,
    email: row.user.email,
    states: parseStates(row.user.states),
  });
  await next();
};

export const auth = new Hono<AppEnv>()
  .post(
    "/login",
    zValidator("json", loginSchema, (result, c) => {
      if (!result.success)
        return c.json(
          { error: "Introduce un correo y una contraseña válidos" },
          400,
        );
    }),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const db = getDb(c.env.DB);
      const now = new Date().toISOString();
      await db.delete(loginAttempts).where(lt(loginAttempts.expiresAt, now));
      // Limit both account guessing and attempts from a single client.
      const keys = await Promise.all(
        [
          `email:${email}`,
          `ip:${c.req.header("CF-Connecting-IP") ?? "local"}`,
        ].map(digest),
      );
      for (const key of keys) {
        const [attempt] = await db
          .insert(loginAttempts)
          .values({
            key,
            count: 1,
            expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
          })
          .onConflictDoUpdate({
            target: loginAttempts.key,
            set: { count: sql`${loginAttempts.count} + 1` },
          })
          .returning();
        if (attempt.count > (key === keys[0] ? 10 : 100)) {
          c.header("Retry-After", "900");
          return c.json(
            { error: "Demasiados intentos. Inténtalo en 15 minutos." },
            429,
          );
        }
      }
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      const valid = user
        ? (await digest(password)) === (await digest(user.password))
        : false;
      if (!user || !valid)
        return c.json({ error: "Correo o contraseña incorrectos" }, 401);
      await db.delete(loginAttempts).where(eq(loginAttempts.key, keys[0]));
      await db.delete(sessions).where(lt(sessions.expiresAt, now));
      const token = Array.from(
        crypto.getRandomValues(new Uint8Array(32)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      const maxAge = 7 * 86400;
      await db
        .insert(sessions)
        .values({
          tokenHash: await digest(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + maxAge * 1000).toISOString(),
        });
      setCookie(c, cookie, token, {
        httpOnly: true,
        secure: new URL(c.req.url).protocol === "https:",
        sameSite: "Strict",
        path: "/",
        maxAge,
      });
      return c.json({
        id: user.id,
        email: user.email,
        states: parseStates(user.states),
      });
    },
  )
  .get("/me", requireUser, (c) => c.json(c.get("user")))
  .post("/logout", async (c) => {
    const token = getCookie(c, cookie);
    if (token)
      await getDb(c.env.DB)
        .delete(sessions)
        .where(eq(sessions.tokenHash, await digest(token)));
    deleteCookie(c, cookie, {
      path: "/",
      secure: new URL(c.req.url).protocol === "https:",
      httpOnly: true,
      sameSite: "Strict",
    });
    return c.json({ ok: true });
  });
