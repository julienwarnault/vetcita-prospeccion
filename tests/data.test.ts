import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { clinicSchema, visitSchema } from "../src/shared/schemas";
import {
  clinicStatus,
  compareClinics,
  distance,
  isActive,
} from "../src/client/model";

test("merged directory has unique identities and remains compatible with the shared schema", () => {
  const data: unknown[] = JSON.parse(readFileSync("data/clinics.json", "utf8"));
  assert.equal(data.length, 2267);
  const clinics = data.map((clinic) => clinicSchema.parse(clinic));
  assert.equal(
    new Set(clinics.map((clinic) => clinic.id)).size,
    clinics.length,
  );
  assert.equal(clinics[0].website, "");
  assert.equal(clinics[0].reviews, 4);
});

test("legacy statuses keep their existing display and filtering behavior", () => {
  const legacy = visitSchema.parse({ status: "Visitada" });
  assert.equal(clinicStatus(legacy), "Visitada (anterior)");
  assert.equal(isActive(legacy), true);
  assert.equal(isActive(visitSchema.parse({ status: "No visitada" })), false);
  assert.equal(clinicStatus(), "Sin visitar");
});

test("distance handles absent coordinates and valid zero coordinates", () => {
  const data = JSON.parse(readFileSync("data/clinics.json", "utf8"));
  const clinic = clinicSchema.parse(data[0]);
  assert.equal(distance({ ...clinic, lat: null }, [0, 0]), Infinity);
  assert.equal(distance({ ...clinic, lat: 0, lng: 0 }, [0, 0]), 0);
  assert.equal(distance(clinic, null), Infinity);
});

test("clinics carry their Mexican state without inventing unknown locations", () => {
  const data: Record<string, unknown>[] = JSON.parse(
    readFileSync("data/clinics.json", "utf8"),
  );
  const counts: Record<string, number> = {};
  for (const row of data) {
    assert.ok(Object.hasOwn(row, "state"));
    const clinic = clinicSchema.parse(row);
    counts[clinic.state] = (counts[clinic.state] || 0) + 1;
  }
  assert.deepEqual(counts, {
    "Ciudad de México": 1920,
    "": 2,
    Guanajuato: 106,
    "Nuevo León": 239,
  });
});

test("legacy clinic JSON without a state remains readable", () => {
  const data = JSON.parse(readFileSync("data/clinics.json", "utf8"));
  const legacy = { ...data[0] };
  delete legacy.state;
  assert.equal(clinicSchema.parse(legacy).state, "");
});

test("clinic sorting balances ratings with review volume and supports names, distance and visit date", () => {
  const data = JSON.parse(readFileSync("data/clinics.json", "utf8"));
  const clinic = clinicSchema.parse(data[0]);
  const established = {
    ...clinic,
    id: "established",
    name: "Álamo",
    rating: 4.8,
    reviews: 200,
    lat: 19,
    lng: -99,
  };
  const singleReview = {
    ...clinic,
    id: "single",
    name: "Zorro",
    rating: 5,
    reviews: 1,
    lat: 20,
    lng: -99,
  };
  const missing = {
    ...clinic,
    id: "missing",
    name: "B",
    rating: null,
    reviews: null,
    lat: null,
    lng: null,
  };
  const sort = (order: Parameters<typeof compareClinics>[2]) =>
    [missing, singleReview, established]
      .sort((a, b) =>
        compareClinics(
          a,
          b,
          order,
          { single: visitSchema.parse({ date: "2026-11-04T12:00:00Z" }) },
          [19, -99],
        ),
      )
      .map((clinic) => clinic.id);
  assert.deepEqual(sort("relevance"), ["established", "single", "missing"]);
  assert.deepEqual(sort("name-asc"), ["established", "missing", "single"]);
  assert.deepEqual(sort("name-desc"), ["single", "missing", "established"]);
  assert.deepEqual(sort("distance"), ["established", "single", "missing"]);
  assert.equal(sort("recent")[0], "single");
});
