import type { Clinic } from "../shared/schemas";

export const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const tileOptions = {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  maxZoom: 19,
  referrerPolicy: "strict-origin-when-cross-origin" as const,
};

export function mapClinics(clinics: Clinic[], nearby: boolean) {
  return clinics
    .filter(
      (clinic): clinic is Clinic & { lat: number; lng: number } =>
        clinic.lat !== null && clinic.lng !== null,
    )
    .slice(0, nearby ? 100 : undefined);
}
