import type { StyleSpecification } from "maplibre-gl";
import type { Clinic } from "../shared/schemas";
import type { Position } from "./model";

export const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

type PointCollection = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    id: string;
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: { clinicId: string };
  }[];
};

export function mapClinics(clinics: Clinic[], nearby: boolean) {
  return clinics
    .filter(
      (clinic): clinic is Clinic & { lat: number; lng: number } =>
        clinic.lat !== null && clinic.lng !== null,
    )
    .slice(0, nearby ? 100 : undefined);
}

export function clinicPoints(
  clinics: ReturnType<typeof mapClinics>,
): PointCollection {
  return {
    type: "FeatureCollection",
    features: clinics.map((clinic) => ({
      type: "Feature",
      id: clinic.id,
      geometry: { type: "Point", coordinates: [clinic.lng, clinic.lat] },
      properties: { clinicId: clinic.id },
    })),
  };
}

export function positionPoint(position: Position | null): PointCollection {
  return {
    type: "FeatureCollection",
    features: position
      ? [
          {
            type: "Feature",
            id: "current-position",
            geometry: {
              type: "Point",
              coordinates: [position[1], position[0]],
            },
            properties: { clinicId: "" },
          },
        ]
      : [],
  };
}

export function mapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: "raster",
        tiles: [tileUrl],
        tileSize: 256,
        maxzoom: 19,
        attribution,
      },
      // Every clinic is rendered individually in one GPU layer. No DOM markers
      // or clustering, and no popup is allocated until a point is clicked.
      clinics: { type: "geojson", data: clinicPoints([]), cluster: false },
      position: { type: "geojson", data: positionPoint(null) },
    },
    layers: [
      { id: "basemap", type: "raster", source: "basemap" },
      {
        id: "clinics",
        type: "symbol",
        source: "clinics",
        layout: {
          "icon-image": "clinic-marker",
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      },
      {
        id: "position",
        type: "circle",
        source: "position",
        paint: {
          "circle-radius": 9,
          "circle-color": "#6650c5",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      },
    ],
  };
}
