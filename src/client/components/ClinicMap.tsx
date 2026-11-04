import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Popup } from "maplibre-gl";
import type { Clinic } from "../../shared/schemas";
import type { Position } from "../model";
import { clinicPoints, mapClinics, mapStyle, positionPoint } from "../map";
import Button, { buttonVariants } from "./ui/Button";

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
  const popup = useRef<Popup | null>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const points = useMemo(() => mapClinics(clinics, nearby), [clinics, nearby]);
  const data = useMemo(() => clinicPoints(points), [points]);

  // Click handlers read current filters/callbacks without rebuilding the map.
  const current = useRef({ points, onOpen });
  useEffect(() => {
    current.current = { points, onOpen };
  }, [points, onOpen]);

  useEffect(() => {
    let disposed = false;
    let instance: MapLibreMap | undefined;
    void import("maplibre-gl")
      .then(({ default: engine }) => {
        if (disposed || !container.current) return;
        instance = new engine.Map({
          container: container.current,
          style: mapStyle(),
          center: [-99.1332, 19.4326],
          zoom: 13,
          maxZoom: 19,
          renderWorldCopies: false,
          attributionControl: { compact: true },
          transformRequest: (url) => ({
            url,
            referrerPolicy: "strict-origin-when-cross-origin",
          }),
        });
        const view = instance;
        view.addControl(
          new engine.NavigationControl({ showCompass: false }),
          "top-left",
        );
        view.on("load", () => {
          void view
            .loadImage("/map/marker-icon-2x.png")
            .then((image) => {
              if (disposed) return;
              view.addImage("clinic-marker", image.data, { pixelRatio: 2 });
              setMap(view);
            })
            .catch(() => {
              if (!disposed)
                setError("No se pudieron cargar los marcadores del mapa.");
            });
        });
        view.on("error", () => {
          if (!disposed)
            setError(
              "No se pudo cargar el mapa. Comprueba tu conexión y que WebGL esté disponible.",
            );
        });
        view.on("mouseenter", "clinics", () => {
          view.getCanvas().style.cursor = "pointer";
        });
        view.on("mouseleave", "clinics", () => {
          view.getCanvas().style.cursor = "";
        });
        view.on("click", "clinics", (event) => {
          const id: unknown = event.features?.[0]?.properties?.clinicId;
          if (typeof id !== "string") return;
          const clinic = current.current.points.find(
            (point) => point.id === id,
          );
          if (!clinic) return;
          const content = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = clinic.name;
          const rating = document.createElement("p");
          rating.className = "mt-2 text-xs";
          rating.textContent = [
            clinic.rating === null ? "Sin calificación" : `${clinic.rating}/5`,
            clinic.reviews === null
              ? "Reseñas no disponibles"
              : `${clinic.reviews.toLocaleString("es-MX")} ${clinic.reviews === 1 ? "reseña" : "reseñas"}`,
          ].join(" · ");
          content.appendChild(title);
          content.appendChild(rating);
          if (clinic.phone) {
            const phone = document.createElement("a");
            phone.href = `tel:${clinic.phone}`;
            phone.textContent = clinic.phone;
            phone.className = "mt-1 block text-xs underline";
            content.appendChild(phone);
          } else {
            const phone = document.createElement("p");
            phone.textContent = "Teléfono no disponible";
            phone.className = "mt-1 text-xs";
            content.appendChild(phone);
          }
          const button = document.createElement("button");
          button.type = "button";
          button.className = buttonVariants({ className: "mt-2.5" });
          button.textContent = "Abrir ficha";
          button.addEventListener("click", () =>
            current.current.onOpen(clinic),
          );
          content.appendChild(button);
          popup.current?.remove();
          popup.current = new engine.Popup({
            maxWidth: "280px",
            offset: [0, -41],
          })
            .setLngLat([clinic.lng, clinic.lat])
            .setDOMContent(content)
            .addTo(view);
        });
      })
      .catch(() => {
        if (!disposed)
          setError(
            "No se pudo iniciar el mapa. Este navegador debe admitir WebGL.",
          );
      });
    return () => {
      disposed = true;
      popup.current?.remove();
      popup.current = null;
      instance?.remove();
    };
  }, [attempt]);

  useEffect(() => {
    if (!map) return;
    // A retry unmounts the old WebGL map before the new one has loaded.
    const source = map.getSource<GeoJSONSource>("clinics");
    if (!source) return;
    popup.current?.remove();
    source.setData(data);
    map.getSource<GeoJSONSource>("position")?.setData(positionPoint(position));
    if (position && points.length > 20) {
      map.jumpTo({ center: [position[1], position[0]], zoom: 13 });
    } else if (points.length) {
      const lngs = points.map((point) => point.lng);
      const lats = points.map((point) => point.lat);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 35, maxZoom: 15, duration: 0 },
      );
    } else if (position) {
      map.jumpTo({ center: [position[1], position[0]], zoom: 13 });
    }
  }, [map, data, points, position]);

  return (
    <>
      <div
        ref={container}
        className="clinic-map relative z-0 h-[340px] w-full overflow-hidden rounded-xl border-0 max-[800px]:h-[390px]"
        role="region"
        aria-label="Mapa de clínicas cercanas"
      />
      {error && (
        <div className="mt-5 text-[13px] text-[#a75b54]" role="alert">
          {error}{" "}
          <Button
            variant="text"
            onClick={() => {
              setError("");
              setMap(null);
              setAttempt((value) => value + 1);
            }}
          >
            Reintentar
          </Button>
        </div>
      )}
    </>
  );
}
