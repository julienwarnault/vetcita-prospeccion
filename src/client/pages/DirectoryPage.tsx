import { ToggleGroup } from "radix-ui";
import { cva } from "class-variance-authority";
import { List, Map, LocateFixed, Plus, Search } from "lucide-react";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Fields";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Clinic } from "../../shared/schemas";
import { statusOptions } from "../../shared/schemas";
import type { ClinicSort, Page, Position } from "../model";
import ClinicMap from "../components/ClinicMap";

const viewToggleVariants = cva(
  "flex items-center gap-1.5 rounded-[7px] border-0 bg-transparent px-3.5 py-2 text-xs font-bold text-[#96909f] data-[state=on]:bg-white data-[state=on]:text-[#6f53c1] data-[state=on]:shadow-[0_1px_4px_#0001] focus-visible:outline-2 focus-visible:outline-primary",
);

export default function DirectoryPage({
  page,
  pos,
  geo,
  locate,
  go,
  query,
  setQuery,
  borough,
  setBorough,
  boroughs,
  status,
  setStatus,
  sort,
  setSort,
  hasLegacy,
  filtered,
  map,
  setMap,
  card,
  open,
}: {
  page: Page;
  pos: Position | null;
  geo: string;
  locate: () => void;
  go: (page: Page) => void;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  borough: string;
  setBorough: Dispatch<SetStateAction<string>>;
  boroughs: string[];
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  sort: ClinicSort;
  setSort: Dispatch<SetStateAction<ClinicSort>>;
  hasLegacy: boolean;
  filtered: Clinic[];
  map: boolean;
  setMap: Dispatch<SetStateAction<boolean>>;
  card: (clinic: Clinic) => ReactNode;
  open: (clinic: Clinic) => void;
}) {
  return (
    <>
      <div className="text-[10px] font-bold tracking-[1.6px] text-[#9787bc]">
        {page === "near"
          ? "EXPLORA TU ZONA"
          : page === "history"
            ? "TU ACTIVIDAD"
            : "DIRECTORIO"}
      </div>
      <h1>
        {page === "near"
          ? "Cerca de mí"
          : page === "history"
            ? "Historial de visitas"
            : "Todas las clínicas"}
        <span className="text-accent">.</span>
      </h1>
      <p className="text-[15px] leading-[1.6] text-[#898594]">
        {page === "near"
          ? "Descubre clínicas cercanas y prepara tu próxima visita."
          : page === "history"
            ? "Encuentra la información de tus visitas anteriores."
            : "Encuentra tu próximo prospecto en la base de clínicas."}
      </p>
      {page === "near" && (
        <div className="mt-[25px] flex items-center gap-[13px] rounded-xl bg-[#f0ebff] p-4 text-[#7055bd] [&>div]:flex-1 [&_strong]:text-[13px] [&_p]:mt-1 [&_p]:text-xs [&_p]:text-[#9285ae] max-[800px]:[&_button]:whitespace-nowrap">
          <LocateFixed aria-hidden="true" className="size-[26px] shrink-0" />
          <div>
            <strong>
              {pos ? "Tu ubicación está activa" : "Activa tu ubicación"}
            </strong>
            <p>
              {geo ||
                "Usa el GPS de tu dispositivo para ordenar por distancia."}
            </p>
          </div>
          <Button variant="text" onClick={locate}>
            {pos ? "Actualizar" : "Activar GPS"}
          </Button>
        </div>
      )}
      <div className="mt-5 flex justify-end max-[800px]:[&_button]:min-h-[46px]">
        <Button onClick={() => go("add")}>
          <Plus aria-hidden="true" />
          Agregar clínica
        </Button>
      </div>
      <div className="mt-3 mb-5 flex gap-2.5 max-[800px]:flex-wrap">
        <div className="relative min-w-0 flex-1 max-[800px]:basis-full">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9994a3]"
          />
          <Input
            className="pl-10"
            aria-label="Buscar por nombre o dirección"
            placeholder="Buscar por nombre o dirección"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          aria-label="Alcaldía"
          className="w-auto min-w-[180px] max-[800px]:min-w-0 max-[800px]:flex-1"
          value={borough}
          onChange={(e) => setBorough(e.target.value)}
        >
          <option value="">Todas las alcaldías</option>
          {boroughs.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Select
          aria-label="Estado"
          className="w-auto min-w-[180px] max-[800px]:min-w-0 max-[800px]:flex-1"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {statusOptions
            .filter((x) => page !== "history" || x !== "Sin visitar")
            .map((x) => (
              <option key={x}>{x}</option>
            ))}
          {hasLegacy && <option>Visitada (anterior)</option>}
        </Select>
      </div>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#9994a3] [&_b]:text-[#4c465b]">
        <span>
          <b>{filtered.length}</b> clínicas{" "}
          {sort === "distance" && pos ? "ordenadas por distancia" : ""}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#777282]">
            Ordenar por
            <Select
              className="w-auto min-w-0 py-2 text-xs"
              value={sort}
              onChange={(event) => setSort(event.target.value as ClinicSort)}
            >
              <option value="relevance">Relevancia (nota y reseñas)</option>
              <option value="name-asc">Nombre (A–Z)</option>
              <option value="name-desc">Nombre (Z–A)</option>
              {page === "near" && <option value="distance">Distancia</option>}
              {page === "history" && (
                <option value="recent">Visitas más recientes</option>
              )}
            </Select>
          </label>
          {(page === "near" || page === "list") && (
            <ToggleGroup.Root
              type="single"
              value={map ? "map" : "list"}
              onValueChange={(value) => {
                if (value) setMap(value === "map");
              }}
              aria-label="Vista del directorio"
              className="flex rounded-[9px] bg-[#efedf4] p-[3px]"
            >
              <ToggleGroup.Item
                value="list"
                aria-label="Lista"
                className={viewToggleVariants()}
              >
                <List aria-hidden="true" className="size-4" />
                Lista
              </ToggleGroup.Item>
              <ToggleGroup.Item
                value="map"
                aria-label="Mapa"
                className={viewToggleVariants()}
              >
                <Map aria-hidden="true" className="size-4" />
                Mapa
              </ToggleGroup.Item>
            </ToggleGroup.Root>
          )}
        </div>
      </div>
      {(page === "near" || page === "list") && map ? (
        <div className="[&>p]:my-3 [&>p]:text-xs [&>p]:text-[#8c8798]">
          <ClinicMap
            clinics={filtered}
            nearby={page === "near"}
            position={pos}
            onOpen={open}
          />
          <p>
            {page === "near"
              ? "Se muestran hasta 100 clínicas con ubicación."
              : "Se muestran las clínicas con ubicación que coinciden con los filtros."}{" "}
            Toca un punto y después «Abrir ficha» para consultar la clínica.
          </p>
          {filtered.slice(0, 10).map(card)}
        </div>
      ) : (
        <div>
          {filtered.slice(0, 100).map(card)}
          {filtered.length > 100 && (
            <div className="p-[30px] text-center text-[13px] text-[#a09ba9]">
              Mostrando 100 de {filtered.length}. Usa los filtros para afinar la
              búsqueda.
            </div>
          )}
          {!filtered.length && (
            <div className="p-[30px] text-center text-[13px] text-[#a09ba9]">
              No encontramos clínicas con estos filtros.
            </div>
          )}
        </div>
      )}
    </>
  );
}
