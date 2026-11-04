import { useState } from "react";
import type { Position } from "../model";

export function getPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Tu dispositivo no admite ubicación."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (result) => resolve([result.coords.latitude, result.coords.longitude]),
      () =>
        reject(
          new Error(
            "No pudimos obtener tu ubicación. Activa el permiso de ubicación e inténtalo de nuevo.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}
export function useLocation() {
  const [pos, setPos] = useState<Position | null>(null);
  const [geo, setGeo] = useState("");
  async function locate() {
    setGeo("Buscando tu ubicación…");
    try {
      setPos(await getPosition());
      setGeo("Ubicación actualizada");
    } catch (error) {
      setGeo(
        error instanceof Error
          ? error.message
          : "No se pudo obtener la ubicación.",
      );
    }
  }
  return { pos, geo, locate };
}
