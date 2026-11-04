import Button, { buttonVariants } from "./ui/Button";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import type { Clinic } from "../../shared/schemas";
import type { Position } from "../model";
import { mapClinics, tileOptions, tileUrl } from "../map";

export default function ClinicMap({
  clinics,
  nearby,
  position,
  onOpen,
}: {
  clinics: Clinic[];
  nearby: boolean;
  position: Position | null;
  onOpen: (clinic: Clinic) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const tiles = useRef<TileLayer | null>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    let instance: LeafletMap | undefined;
    // Leaflet uses window/document: load it only when the map is mounted.
    void import("leaflet")
      .then((L) => {
        if (disposed || !container.current) return;
        instance = L.map(container.current).setView([19.4326, -99.1332], 13);
        const layer = L.tileLayer(tileUrl, tileOptions);
        layer.on("tileerror", () =>
          setError(
            "No se pudo cargar el fondo del mapa. Comprueba tu conexión e inténtalo de nuevo.",
          ),
        );
        layer.addTo(instance);
        tiles.current = layer;
        setMap(instance);
      })
      .catch(() => {
        if (!disposed)
          setError(
            "No se pudo iniciar el mapa. Actualiza la página e inténtalo de nuevo.",
          );
      });
    return () => {
      disposed = true;
      tiles.current?.off();
      tiles.current = null;
      instance?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    let disposed = false;
    let cleanup = () => {};
    void import("leaflet").then((L) => {
      if (disposed) return;
      const markers = L.layerGroup().addTo(map);
      const points = mapClinics(clinics, nearby);
      const icon = L.icon({
        iconUrl: "/map/marker-icon.png",
        iconRetinaUrl: "/map/marker-icon-2x.png",
        shadowUrl: "/map/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      for (const clinic of points) {
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = clinic.name;
        const button = document.createElement("button");
        button.type = "button";
        button.className = buttonVariants({ className: "mt-2.5" });
        button.textContent = "Abrir ficha";
        button.addEventListener("click", () => onOpen(clinic));
        popup.appendChild(title);
        popup.appendChild(button);
        L.marker([clinic.lat, clinic.lng], { icon, title: clinic.name })
          .addTo(markers)
          .bindPopup(popup);
      }
      if (position) {
        map.setView(position, 13);
        L.circleMarker(position, {
          radius: 8,
          color: "#6650c5",
          fillOpacity: 1,
        })
          .addTo(markers)
          .bindPopup("Tu ubicación");
      }
      if (points.length > 0 && points.length <= 20) {
        map.fitBounds(
          points.map((clinic) => [clinic.lat, clinic.lng]),
          { padding: [35, 35], maxZoom: 15 },
        );
      }
      cleanup = () => {
        markers.remove();
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [map, clinics, nearby, position, onOpen]);

  return (
    <>
      <div
        ref={container}
        className="clinic-map relative z-0 h-[340px] w-full rounded-xl border-0 max-[800px]:h-[390px]"
        role="region"
        aria-label="Mapa de clínicas cercanas"
      />
      {error && (
        <div className="mt-5 text-[13px] text-[#a75b54]" role="alert">
          {error}{" "}
          {tiles.current && (
            <Button
              type="button"
              variant="text"
              onClick={() => {
                setError("");
                tiles.current?.redraw();
              }}
            >
              Reintentar
            </Button>
          )}
        </div>
      )}
    </>
  );
}
