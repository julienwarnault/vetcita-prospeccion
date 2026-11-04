import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { test } from "node:test";
import app from "../src/server";
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

function setup() {
  const { sqlite, binding } = database();
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
          ...extra,
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
      },
      env,
    );
  return { sqlite, env, request };
}

test("pages and API work locally without app authentication", async () => {
  const { sqlite, env } = setup();
  try {
    for (const path of ["/api/clinics", "/api/visits"]) {
      const response = await app.request(
        `https://vetcita.test${path}`,
        {},
        env,
      );
      assert.equal(response.status, 200);
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
  const { sqlite, request } = setup();
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
    assert.equal(records[0].author, "shared");
    const stored = sqlite
      .prepare("SELECT data FROM visits WHERE id = ?")
      .get("clinic-1");
    assert.equal(typeof stored?.data, "string");
  } finally {
    sqlite.close();
  }
});

test("malformed visits cannot reach storage", async () => {
  const { sqlite, request } = setup();
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
  const { sqlite, request } = setup();
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
  const { sqlite, request } = setup();
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
    assert.deepEqual(records, [clinic]);
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
  const { sqlite, request } = setup();
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
  const { sqlite, request } = setup();
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

test("Access email is recorded as author when available, without requiring a local identity", async () => {
  const { sqlite, request } = setup();
  try {
    const response = await request(
      "/api/visits",
      { id: "access-clinic", data: blankVisit },
      { "Cf-Access-Authenticated-User-Email": "member@example.invalid" },
    );
    assert.equal(response.status, 200);
    const record = visitRecordSchema.parse(await response.json());
    assert.equal(record.author, "member@example.invalid");
  } finally {
    sqlite.close();
  }
});
