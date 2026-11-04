import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { test } from "node:test";
import app from "../src/server";
import { digest } from "../src/server/token";
import { baseClinics } from "../src/server/access";
import {
  blankVisit,
  clinicSchema,
  visitRecordSchema,
} from "../src/shared/schemas";
import { z } from "zod";

// Exercise the real Drizzle SQL against SQLite, with the D1 methods it uses.
function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync("drizzle/0000_futuristic_red_skull.sql", "utf8"));
  sqlite.exec(readFileSync("drizzle/0001_material_spot.sql", "utf8"));
  sqlite.exec(readFileSync("drizzle/0002_broad_mojo.sql", "utf8"));
  const binding = {
    prepare(sql: string) {
      const statement = sqlite.prepare(sql);
      return {
        bind(...params: SQLInputValue[]) {
          return {
            async run() {
              return statement.run(...params);
            },
            async raw() {
              return statement.all(...params).map((row) => Object.values(row));
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  return { sqlite, binding };
}

async function setup() {
  const { sqlite, binding } = database();
  const token = "a".repeat(64);
  sqlite
    .prepare("INSERT INTO users VALUES (?, ?, ?, ?)")
    .run("tester", "tester@example.invalid", "test-password", null);
  sqlite
    .prepare("INSERT INTO sessions VALUES (?, ?, ?)")
    .run(
      await digest(token),
      "tester",
      new Date(Date.now() + 86400000).toISOString(),
    );
  for (const id of ["clinic-1", "legacy", "access-clinic"]) {
    sqlite
      .prepare("INSERT INTO custom_clinics VALUES (?, ?, ?, ?)")
      .run(
        id,
        JSON.stringify({ ...baseClinics[0], id }),
        new Date().toISOString(),
        "tester",
      );
  }
  const assets = {
    fetch: async () =>
      new Response('<div id="root"></div>', {
        headers: { "Content-Type": "text/html" },
      }),
  } as unknown as Fetcher;
  const env = { DB: binding, ASSETS: assets };
  const request = (
    path: string,
    payload?: unknown,
    extra: Record<string, string> = {},
  ) =>
    app.request(
      `https://vetcita.test${path}`,
      {
        method: payload === undefined ? "GET" : "POST",
        headers: {
          ...(payload === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          Cookie: `vetcita_session=${token}`,
          ...extra,
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      },
      env,
    );
  return { sqlite, env, request };
}

test("API requires an application session while the login shell stays public", async () => {
  const { sqlite, env } = await setup();
  try {
    for (const path of ["/api/clinics", "/api/visits"]) {
      const response = await app.request(
        `https://vetcita.test${path}`,
        {},
        env,
      );
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    }
    const response = await app.request("https://vetcita.test/", {}, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Location"), null);
  } finally {
    sqlite.close();
  }
});

test("visits round-trip through SQLite and keep the existing upsert behavior", async () => {
  const { sqlite, request } = await setup();
  try {
    const first = {
      ...blankVisit,
      status: "Por contactar",
      notes: "Primera llamada",
      contactName: "Ana",
    };
    assert.equal(
      (await request("/api/visits", { id: "clinic-1", data: first })).status,
      200,
    );
    const updated = {
      ...first,
      status: "Cliente",
      notes: "Cliente confirmado",
    };
    assert.equal(
      (await request("/api/visits", { id: "clinic-1", data: updated })).status,
      200,
    );
    const records = z
      .array(visitRecordSchema)
      .parse(await (await request("/api/visits")).json());
    assert.equal(records.length, 1);
    assert.deepEqual(records[0].data, updated);
    assert.equal(records[0].author, "tester@example.invalid");
    const stored = sqlite
      .prepare("SELECT data FROM visits WHERE id = ?")
      .get("clinic-1");
    assert.equal(typeof stored?.data, "string");
  } finally {
    sqlite.close();
  }
});

test("malformed visits cannot reach storage", async () => {
  const { sqlite, request } = await setup();
  try {
    for (const payload of [
      null,
      { id: "", data: {} },
      { id: "1", data: null },
      { id: "1", data: [] },
      { id: "1", data: { status: {} } },
      { id: "1", data: { date: 123 } },
      { id: "1", data: { contactEmail: "invalid" } },
      { id: "1", data: { price: "-1" } },
    ]) {
      assert.equal(
        (await request("/api/visits", payload)).status,
        400,
        JSON.stringify(payload),
      );
    }
    const records = z
      .array(visitRecordSchema)
      .parse(await (await request("/api/visits")).json());
    assert.equal(records.length, 0);
  } finally {
    sqlite.close();
  }
});

test("legacy visit JSON is read without changing stored data", async () => {
  const { sqlite, request } = await setup();
  try {
    const oldData = JSON.stringify({
      status: "Visitada",
      notes: "Registro anterior",
    });
    sqlite
      .prepare("INSERT INTO visits VALUES (?, ?, ?, ?)")
      .run("legacy", oldData, new Date().toISOString(), "old@example.invalid");
    const records = z
      .array(visitRecordSchema)
      .parse(await (await request("/api/visits")).json());
    assert.equal(records[0].data.status, "Visitada");
    assert.equal(records[0].data.contactName, "");
    assert.equal(
      sqlite.prepare("SELECT data FROM visits").get()?.data,
      oldData,
    );
  } finally {
    sqlite.close();
  }
});

test("manual clinics preserve optional coordinates and nullable legacy fields", async () => {
  const { sqlite, request } = await setup();
  try {
    const response = await request("/api/clinics", {
      name: "  Nueva clínica  ",
      address: "Calle 123",
      lat: null,
      lng: null,
    });
    assert.equal(response.status, 201);
    const clinic = clinicSchema.parse(await response.json());
    assert.equal(clinic.name, "Nueva clínica");
    assert.equal(clinic.lat, null);
    assert.equal(clinic.manual, true);
    assert.match(clinic.id, /^manual-/);
    const records = await (await request("/api/clinics")).json();
    assert.ok(Array.isArray(records));
    assert.deepEqual(
      records.find((row: { id: string }) => row.id === clinic.id),
      clinic,
    );
    for (const payload of [
      { name: "", address: "Calle", lat: null, lng: null },
      { name: "A", address: "B", lat: 19, lng: null },
      { name: "A", address: "B", lat: 91, lng: -99 },
    ]) {
      assert.equal((await request("/api/clinics", payload)).status, 400);
    }
  } finally {
    sqlite.close();
  }
});

test("cross-origin writes, oversized payloads and unknown API routes are rejected", async () => {
  const { sqlite, request } = await setup();
  try {
    assert.equal(
      (
        await request(
          "/api/visits",
          { id: "1", data: blankVisit },
          { Origin: "https://other.test" },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request("/api/visits", {
          id: "1",
          data: { ...blankVisit, notes: "x".repeat(40000) },
        })
      ).status,
      413,
    );
    assert.equal((await request("/api/missing")).status, 404);
  } finally {
    sqlite.close();
  }
});

test("pages serve the SPA and the legacy /inicio URL redirects", async () => {
  const { sqlite, request } = await setup();
  try {
    const page = await request("/");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /id="root"/);
    const redirect = await request("/inicio");
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get("Location"), "/");
  } finally {
    sqlite.close();
  }
});

test("author comes from the authenticated account, never a spoofed header", async () => {
  const { sqlite, request } = await setup();
  try {
    const response = await request(
      "/api/visits",
      { id: "access-clinic", data: blankVisit },
      { "Cf-Access-Authenticated-User-Email": "member@example.invalid" },
    );
    assert.equal(response.status, 200);
    const record = visitRecordSchema.parse(await response.json());
    assert.equal(record.author, "tester@example.invalid");
  } finally {
    sqlite.close();
  }
});

test("login, HttpOnly session, expiry and logout work without exposing the password", async () => {
  const { sqlite, request } = await setup();
  try {
    const wrong = await request(
      "/api/auth/login",
      { email: "tester@example.invalid", password: "wrong" },
      { Cookie: "" },
    );
    assert.equal(wrong.status, 401);
    const response = await request(
      "/api/auth/login",
      { email: " TESTER@example.invalid ", password: "test-password" },
      { Cookie: "" },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: "tester",
      email: "tester@example.invalid",
      states: null,
    });
    const cookie = response.headers.get("Set-Cookie")!;
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /SameSite=Strict/i);
    const sessionCookie = cookie.split(";")[0];
    assert.equal(
      (await request("/api/auth/me", undefined, { Cookie: sessionCookie }))
        .status,
      200,
    );
    assert.equal(
      (await request("/api/auth/logout", {}, { Cookie: sessionCookie })).status,
      200,
    );
    assert.equal(
      (await request("/api/auth/me", undefined, { Cookie: sessionCookie }))
        .status,
      401,
    );
    sqlite
      .prepare("UPDATE sessions SET expires_at = ?")
      .run("2000-01-01T00:00:00.000Z");
    assert.equal((await request("/api/clinics")).status, 401);
    assert.equal(
      (
        await request("/api/clinics", undefined, {
          Cookie: "vetcita_session=forged",
        })
      ).status,
      401,
    );
    assert.equal((await request("/clinics.json")).status, 404);
  } finally {
    sqlite.close();
  }
});

test("state restrictions protect directory, manual clinics, visits and writes, and refresh every request", async () => {
  const { sqlite, request } = await setup();
  try {
    const leon = baseClinics.find((clinic) => clinic.state === "Guanajuato")!;
    const cdmx = baseClinics.find(
      (clinic) => clinic.state === "Ciudad de México",
    )!;
    for (const id of [leon.id, cdmx.id])
      sqlite
        .prepare("INSERT INTO visits VALUES (?, ?, ?, ?)")
        .run(
          id,
          JSON.stringify(blankVisit),
          new Date().toISOString(),
          "someone",
        );
    sqlite
      .prepare("UPDATE users SET states = ?")
      .run(" guanajuato , Nuevo León , guanajuato ");
    const clinics = z
      .array(clinicSchema)
      .parse(await (await request("/api/clinics")).json());
    assert.ok(clinics.length > 0);
    assert.ok(
      clinics.every((clinic) =>
        ["Guanajuato", "Nuevo León"].includes(clinic.state),
      ),
    );
    assert.equal(
      clinics.some((clinic) => clinic.id === cdmx.id),
      false,
    );
    const records = z
      .array(visitRecordSchema)
      .parse(await (await request("/api/visits")).json());
    assert.deepEqual(
      records.map((row) => row.id),
      [leon.id],
    );
    assert.equal(
      (await request("/api/visits", { id: cdmx.id, data: blankVisit })).status,
      404,
    );
    assert.equal(
      (await request("/api/visits", { id: "unknown", data: blankVisit }))
        .status,
      404,
    );
    assert.equal(
      (await request("/api/visits", { id: leon.id, data: blankVisit })).status,
      200,
    );
    const manual = { name: "Nueva", address: "Calle", lat: null, lng: null };
    for (const state of ["", "Ciudad de México"])
      assert.equal(
        (await request("/api/clinics", { ...manual, state })).status,
        403,
      );
    const added = await request("/api/clinics", {
      ...manual,
      state: "Guanajuato",
    });
    assert.equal(added.status, 201);
    const clinic = clinicSchema.parse(await added.json());
    assert.equal(
      (await request("/api/visits", { id: clinic.id, data: blankVisit }))
        .status,
      200,
    );
    sqlite.prepare("UPDATE users SET states = ?").run("No existe");
    assert.deepEqual(await (await request("/api/clinics")).json(), []);
    assert.deepEqual(await (await request("/api/visits")).json(), []);
    for (const state of [null, "", " , "]) {
      sqlite.prepare("UPDATE users SET states = ?").run(state);
      const all = z
        .array(clinicSchema)
        .parse(await (await request("/api/clinics")).json());
      assert.equal(all.length, baseClinics.length + 4);
      assert.ok(all.some((clinic) => clinic.id === cdmx.id));
    }
  } finally {
    sqlite.close();
  }
});

test("login attempts are limited and cross-origin login is rejected", async () => {
  const { sqlite, request } = await setup();
  try {
    const credentials = { email: "tester@example.invalid", password: "wrong" };
    assert.equal(
      (
        await request("/api/auth/login", credentials, {
          Origin: "https://other.test",
        })
      ).status,
      403,
    );
    for (let index = 0; index < 10; index++)
      assert.equal((await request("/api/auth/login", credentials)).status, 401);
    assert.equal((await request("/api/auth/login", credentials)).status, 429);
    sqlite
      .prepare("UPDATE login_attempts SET expires_at = ?")
      .run("2000-01-01T00:00:00.000Z");
    assert.equal(
      (
        await request("/api/auth/login", {
          ...credentials,
          password: "test-password",
        })
      ).status,
      200,
    );
  } finally {
    sqlite.close();
  }
});

test("reapplying migrations preserves existing data and a deleted account loses access", async () => {
  const { sqlite, request } = await setup();
  try {
    await request("/api/visits", {
      id: "clinic-1",
      data: { ...blankVisit, notes: "Preservar" },
    });
    for (const name of [
      "0000_futuristic_red_skull",
      "0001_material_spot",
      "0002_broad_mojo",
    ]) {
      sqlite.exec(readFileSync(`drizzle/${name}.sql`, "utf8"));
    }
    assert.equal(
      sqlite.prepare("SELECT count(*) AS count FROM users").get()?.count,
      1,
    );
    assert.equal(
      sqlite.prepare("SELECT count(*) AS count FROM custom_clinics").get()
        ?.count,
      3,
    );
    assert.equal(
      JSON.parse(
        sqlite.prepare("SELECT data FROM visits WHERE id = ?").get("clinic-1")
          ?.data as string,
      ).notes,
      "Preservar",
    );
    assert.equal((await request("/api/clinics")).status, 200);
    sqlite.prepare("DELETE FROM users").run();
    assert.equal((await request("/api/clinics")).status, 401);
  } finally {
    sqlite.close();
  }
});
