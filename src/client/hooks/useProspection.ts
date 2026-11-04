import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { api } from "../api";
import {
  clinicSchema,
  type Clinic,
  type NewClinic,
  type Visit,
} from "../../shared/schemas";

export function useProspection() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [visits, setVisits] = useState<Record<string, Visit>>({});
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setReady(false);
    setError("");
    try {
      const [base, custom, records] = await Promise.all([
        fetch("/clinics.json").then(async (response) => {
          if (!response.ok) throw new Error("No se pudo cargar el directorio.");
          return z.array(clinicSchema).parse(await response.json());
        }),
        api.clinics(),
        api.visits(),
      ]);
      setClinics([...base, ...custom]);
      setVisits(Object.fromEntries(records.map((row) => [row.id, row.data])));
      setReady(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos. Comprueba tu conexión.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function addClinic(data: NewClinic) {
    const clinic = await api.addClinic(data);
    setClinics((current) => [...current, clinic]);
    return clinic;
  }
  async function saveVisit(id: string, data: Visit) {
    const row = await api.saveVisit(id, data);
    setVisits((current) => ({ ...current, [id]: row.data }));
    return row.data;
  }
  return {
    clinics,
    visits,
    loading,
    ready,
    error,
    reload,
    addClinic,
    saveVisit,
  };
}
