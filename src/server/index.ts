import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { api } from "./api";
import type { AppEnv } from "./env";

const app = new Hono<AppEnv>();
app.route("/api", api);
app.all("/api/*", (c) => c.json({ error: "Ruta no encontrada" }, 404));
app.get("/clinics.json", (c) => c.json({ error: "Ruta no encontrada" }, 404));
app.get("/inicio", (c) => c.redirect("/", 302));
app.get("/inicio/", (c) => c.redirect("/", 302));
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));
app.onError((error, c) => {
  if (error instanceof HTTPException) return error.getResponse();
  console.error("Request failed:", error);
  return c.json(
    { error: "No se pudo completar la operación. Inténtalo de nuevo." },
    500,
  );
});

export default app;
