import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { zValidator } from "@hono/zod-validator";
import {
  clinicSchema,
  newClinicSchema,
  saveVisitSchema,
  visitSchema,
} from "../shared/schemas";
import { getDb } from "./db";
import { customClinics, visits } from "./db/schema";
import type { AppEnv } from "./env";

import { auth, requireUser } from "./auth";
import { allClinics, canAccess } from "./access";
export const api = new Hono<AppEnv>()
  .use("*", async (c, next) => {
    c.header("Cache-Control", "private, no-store");
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      const origin = c.req.header("Origin");
      if (
        (origin && origin !== new URL(c.req.url).origin) ||
        c.req.header("Sec-Fetch-Site") === "cross-site"
      ) {
        return c.json({ error: "Origen no autorizado" }, 403);
      }
    }
    await next();
  })
  .use(
    "*",
    bodyLimit({
      maxSize: 32768,
      onError: (c) => c.json({ error: "Datos demasiado grandes" }, 413),
    }),
  )
  .route("/auth", auth)
  .use("*", requireUser)
  .get("/clinics", async (c) => {
    const clinics = await allClinics(c.env.DB);
    return c.json(clinics.filter((clinic) => canAccess(c.get("user"), clinic)));
  })
  .post(
    "/clinics",
    zValidator("json", newClinicSchema, (result, c) => {
      if (!result.success)
        return c.json(
          { error: "Comprueba el nombre, la dirección y las coordenadas" },
          400,
        );
    }),
    async (c) => {
      const data = c.req.valid("json");
      if (!canAccess(c.get("user"), data))
        return c.json({ error: "Estado no autorizado" }, 403);
      const clinic = clinicSchema.parse({
        ...data,
        id: `manual-${crypto.randomUUID()}`,
        website: "",
        hours: "",
        rating: null,
        verify: false,
        manual: true,
        maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`,
      });
      await getDb(c.env.DB)
        .insert(customClinics)
        .values({
          id: clinic.id,
          data: JSON.stringify(clinic),
          createdAt: new Date().toISOString(),
          author: c.get("user").email,
        });
      return c.json(clinic, 201);
    },
  )
  .get("/visits", async (c) => {
    const allowed = new Set(
      (await allClinics(c.env.DB))
        .filter((clinic) => canAccess(c.get("user"), clinic))
        .map((clinic) => clinic.id),
    );
    const rows = (await getDb(c.env.DB).select().from(visits)).filter((row) =>
      allowed.has(row.id),
    );
    return c.json(
      rows.map((row) => ({
        ...row,
        data: visitSchema.parse(JSON.parse(row.data)),
      })),
    );
  })
  .post(
    "/visits",
    zValidator("json", saveVisitSchema, (result, c) => {
      if (!result.success)
        return c.json(
          { error: "Datos de visita inválidos. Comprueba los campos." },
          400,
        );
    }),
    async (c) => {
      const { id, data } = c.req.valid("json");
      const clinic = (await allClinics(c.env.DB)).find(
        (clinic) => clinic.id === id,
      );
      if (!clinic || !canAccess(c.get("user"), clinic))
        return c.json({ error: "Clínica no encontrada" }, 404);
      const row = {
        id,
        data: JSON.stringify(data),
        updatedAt: new Date().toISOString(),
        author: c.get("user").email,
      };
      await getDb(c.env.DB)
        .insert(visits)
        .values(row)
        .onConflictDoUpdate({ target: visits.id, set: row });
      return c.json({ ...row, data });
    },
  );

export type Api = typeof api;
