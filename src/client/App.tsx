import Button from "./components/ui/Button";
import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import {
  blankClinic,
  blankVisit,
  visitSchema,
  type Clinic,
  type DraftVisit,
  type NewClinic,
} from "../shared/schemas";
import AppLayout from "./components/AppLayout";
import ClinicCard from "./components/ClinicCard";
import AddClinicPage from "./pages/AddClinicPage";
import ClinicDetails from "./pages/ClinicDetails";
import HomePage from "./pages/HomePage";
import SummaryPage from "./pages/SummaryPage";
import DirectoryPage from "./pages/DirectoryPage";
import { useProspection } from "./hooks/useProspection";
import { getPosition, useLocation } from "./hooks/useLocation";
import { clinicStatus, distance, isActive, type Page } from "./model";

export default function App() {
  const {
    clinics,
    visits,
    loading,
    ready,
    error,
    reload,
    addClinic: createClinic,
    saveVisit,
  } = useProspection();
  const { pos, geo, locate } = useLocation();
  const [page, setPage] = useState<Page>("home");
  const [selected, setSelected] = useState<Clinic | null>(null);
  const [draft, setDraft] = useState<DraftVisit>(blankVisit);
  const [query, setQuery] = useState("");
  const [borough, setBorough] = useState("");
  const [status, setStatus] = useState("");
  const [map, setMap] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [newClinic, setNewClinic] = useState<NewClinic>(blankClinic);
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [locating, setLocating] = useState(false);
  const selection = useRef(0);
  const savingRef = useRef(false);
  const addingRef = useRef(false);

  const visited = Object.values(visits).filter(isActive).length;
  const customers = Object.values(visits).filter(
    (visit) => clinicStatus(visit) === "Cliente",
  ).length;
  const hasLegacy = Object.values(visits).some(
    (visit) => visit.status === "Visitada",
  );
  const boroughs = useMemo(
    () =>
      Array.from(
        new Set(clinics.map((clinic) => clinic.borough).filter(Boolean)),
      ).sort(),
    [clinics],
  );
  const filtered = useMemo(
    () =>
      clinics
        .filter((clinic) => {
          const visit = visits[clinic.id];
          return (
            (!query ||
              `${clinic.name} ${clinic.address} ${clinic.neighborhood}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (!borough || clinic.borough === borough) &&
            (!status || clinicStatus(visit) === status) &&
            (page !== "history" || isActive(visit)) &&
            (page !== "near" || !clinic.verify)
          );
        })
        .sort((a, b) =>
          page === "near" && pos
            ? distance(a, pos) - distance(b, pos)
            : page === "history"
              ? (visits[b.id]?.date || "").localeCompare(
                  visits[a.id]?.date || "",
                )
              : a.name.localeCompare(b.name),
        ),
    [clinics, visits, query, borough, status, page, pos],
  );

  const open = useCallback(
    (clinic: Clinic) => {
      if (!ready) {
        setMsg("Espera a que se carguen los datos antes de abrir una ficha.");
        return;
      }
      selection.current++;
      setSelected(clinic);
      setDraft({
        ...blankVisit,
        ...visits[clinic.id],
        status: clinicStatus(visits[clinic.id]),
      });
      setMsg("");
    },
    [ready, visits],
  );

  function back() {
    selection.current++;
    setSelected(null);
    setMsg("");
  }
  function go(next: Page) {
    if (next === "add") {
      setNewClinic(blankClinic);
      setAddMsg("");
    }
    back();
    setPage(next);
    setQuery("");
    setBorough("");
    setStatus("");
    setMap(false);
    if (next === "near" && !pos) void locate();
  }

  async function clinicLocation() {
    setLocating(true);
    setAddMsg("");
    try {
      const [lat, lng] = await getPosition();
      setNewClinic((current) => ({ ...current, lat, lng }));
    } catch {
      setAddMsg(
        "No se pudo obtener la ubicación. Puedes intentar de nuevo o guardar sin coordenadas.",
      );
    } finally {
      setLocating(false);
    }
  }

  async function addClinic(event: FormEvent) {
    event.preventDefault();
    if (addingRef.current || !ready) return;
    addingRef.current = true;
    const token = selection.current;
    setAdding(true);
    setAddMsg("Guardando…");
    try {
      const clinic = await createClinic(newClinic);
      if (token === selection.current) {
        setNewClinic(blankClinic);
        setAddMsg("");
        setPage("list");
        open(clinic);
        setMsg("Clínica agregada. Puedes registrar la visita.");
      }
    } catch (error) {
      if (token === selection.current)
        setAddMsg(
          error instanceof Error
            ? error.message
            : "No se pudo guardar la clínica.",
        );
    } finally {
      addingRef.current = false;
      setAdding(false);
    }
  }

  async function save() {
    if (!selected || !ready || savingRef.current) return;
    const parsed = visitSchema.safeParse({
      ...draft,
      status:
        draft.status === "Visitada (anterior)" ? "Visitada" : draft.status,
      date:
        draft.status !== "Sin visitar"
          ? draft.date || new Date().toISOString()
          : draft.date,
    });
    if (!parsed.success) {
      setMsg("Comprueba el correo electrónico y los valores numéricos.");
      return;
    }
    const token = selection.current;
    savingRef.current = true;
    setSaving(true);
    setMsg("Guardando…");
    try {
      const data = await saveVisit(selected.id, parsed.data);
      if (token === selection.current) {
        setDraft({ ...data, status: clinicStatus(data) });
        setMsg("Cambios guardados");
      }
    } catch (error) {
      if (token === selection.current)
        setMsg(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const card = (clinic: Clinic) => (
    <ClinicCard
      key={clinic.id}
      c={clinic}
      visit={visits[clinic.id]}
      nearby={page === "near"}
      pos={pos}
      onOpen={open}
    />
  );
  return (
    <AppLayout page={page} go={go}>
      {error && (
        <div className="mt-5 text-[13px] text-[#a75b54]" role="alert">
          No se pudieron cargar los datos. {error}{" "}
          <Button
            variant="text"
            onClick={() => void reload()}
            disabled={loading}
          >
            Reintentar
          </Button>
        </div>
      )}
      {page === "add" ? (
        <AddClinicPage
          go={go}
          newClinic={newClinic}
          setNewClinic={setNewClinic}
          boroughs={boroughs}
          locating={locating}
          clinicLocation={clinicLocation}
          adding={adding || !ready}
          addClinic={addClinic}
          addMsg={addMsg}
        />
      ) : selected ? (
        <ClinicDetails
          selected={selected}
          draft={draft}
          setDraft={setDraft}
          onBack={back}
          save={save}
          msg={msg}
          saving={saving}
          canSave={ready}
        />
      ) : page === "home" ? (
        <HomePage
          clinics={clinics}
          visited={visited}
          customers={customers}
          loading={loading}
          go={go}
        />
      ) : page === "admin" ? (
        <SummaryPage
          clinics={clinics}
          visits={visits}
          visited={visited}
          go={go}
          card={card}
        />
      ) : (
        <DirectoryPage
          page={page}
          pos={pos}
          geo={geo}
          locate={locate}
          go={go}
          query={query}
          setQuery={setQuery}
          borough={borough}
          setBorough={setBorough}
          boroughs={boroughs}
          status={status}
          setStatus={setStatus}
          hasLegacy={hasLegacy}
          filtered={filtered}
          map={map}
          setMap={setMap}
          card={card}
          open={open}
        />
      )}
      {msg && !selected && (
        <div className="mt-5 text-[13px] text-[#a75b54]" role="status">
          {msg}
        </div>
      )}
    </AppLayout>
  );
}
