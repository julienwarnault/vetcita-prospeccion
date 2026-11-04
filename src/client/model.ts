import type { Clinic, Visit } from "../shared/schemas";

export type Page = "home" | "near" | "list" | "history" | "admin" | "add";
export type Position = [number, number];
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
