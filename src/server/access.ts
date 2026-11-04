import rawClinics from "../../data/clinics.json";
import { clinicSchema, type User, type Clinic } from "../shared/schemas";
import { getDb } from "./db";
import { customClinics } from "./db/schema";

export const baseClinics = rawClinics.map((clinic) =>
  clinicSchema.parse(clinic),
);
export function parseStates(states: string | null): string[] | null {
  const values = [
    ...new Set(
      (states ?? "")
        .split(",")
        .map((state) => state.trim())
        .filter(Boolean),
    ),
  ];
  return values.length ? values : null;
}
const normalize = (value: string) =>
  value.trim().normalize("NFC").toLocaleLowerCase("es-MX");
export function canAccess(user: User, clinic: Pick<Clinic, "state">) {
  return (
    user.states === null ||
    user.states.some((state) => normalize(state) === normalize(clinic.state))
  );
}
export async function allClinics(binding: D1Database) {
  const rows = await getDb(binding).select().from(customClinics);
  return [
    ...baseClinics,
    ...rows.map((row) => clinicSchema.parse(JSON.parse(row.data))),
  ];
}
