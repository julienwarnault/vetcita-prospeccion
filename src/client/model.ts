import type { Clinic, Visit } from "../shared/schemas";

export type Page = "home" | "near" | "list" | "history" | "admin" | "add";
export type Position = [number, number];
export type ClinicSort =
  "relevance" | "name-asc" | "name-desc" | "distance" | "recent";
const names = new Intl.Collator("es", { sensitivity: "base", numeric: true });

function relevance(clinic: Clinic) {
  if (clinic.rating === null || !clinic.reviews) return -1;
  // Blend with 20 reviews at 3.5/5 so a lone 5-star review cannot dominate.
  return (clinic.rating * clinic.reviews + 3.5 * 20) / (clinic.reviews + 20);
}

export function compareClinics(
  a: Clinic,
  b: Clinic,
  sort: ClinicSort,
  visits: Record<string, Visit>,
  position: Position | null,
) {
  const byName = names.compare(a.name, b.name) || a.id.localeCompare(b.id);
  switch (sort) {
    case "relevance":
      return (
        relevance(b) - relevance(a) ||
        (b.reviews ?? 0) - (a.reviews ?? 0) ||
        byName
      );
    case "name-desc":
      return -byName;
    case "distance":
      return distance(a, position) - distance(b, position) || byName;
    case "recent":
      return (
        (visits[b.id]?.date || "").localeCompare(visits[a.id]?.date || "") ||
        byName
      );
    default:
      return byName;
  }
}
export function clinicStatus(visit?: Visit) {
  if (!visit?.status || visit.status === "No visitada") return "Sin visitar";
  return visit.status === "Visitada" ? "Visitada (anterior)" : visit.status;
}
export function isActive(visit?: Visit) {
  return !!visit && clinicStatus(visit) !== "Sin visitar";
}
export function distance(clinic: Clinic, position: Position | null) {
  if (!position || clinic.lat === null || clinic.lng === null) return Infinity;
  const rad = Math.PI / 180;
  const dlat = (clinic.lat - position[0]) * rad;
  const dlng = (clinic.lng - position[1]) * rad;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(position[0] * rad) *
      Math.cos(clinic.lat * rad) *
      Math.sin(dlng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, a)));
}
