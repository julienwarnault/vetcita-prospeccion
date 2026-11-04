import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { type Clinic, type NewClinic, type Visit } from "../../shared/schemas";

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
      const [clinics, records] = await Promise.all([
        api.clinics(),
        api.visits(),
      ]);
      setClinics(clinics);
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
