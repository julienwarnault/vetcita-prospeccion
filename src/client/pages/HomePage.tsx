import {
  ArrowRight,
  Building2,
  History,
  LocateFixed,
  Plus,
} from "lucide-react";
import type { Clinic } from "../../shared/schemas";
import type { Page } from "../model";
import Button from "../components/ui/Button";
import Stats from "../components/Stats";

const actions = [
  {
    page: "near",
    icon: LocateFixed,
    title: "Cerca de mí",
    description: "Encuentra clínicas cercanas usando tu ubicación.",
    action: "Buscar cerca",
  },
  {
    page: "list",
    icon: Building2,
    title: "Explorar clínicas",
    description: "Busca y filtra toda tu base de prospectos.",
    action: "Ver directorio",
  },
  {
    page: "history",
    icon: History,
    title: "Mis visitas",
    description: "Consulta las clínicas que ya has visitado.",
    action: "Ver historial",
  },
] satisfies {
  page: Page;
  icon: typeof History;
  title: string;
  description: string;
  action: string;
}[];
export default function HomePage({
  clinics,
  visited,
  customers,
  loading,
  go,
}: {
  clinics: Clinic[];
  visited: number;
  customers: number;
  loading: boolean;
  go: (page: Page) => void;
}) {
  return (
    <>
      <div className="text-[10px] font-bold tracking-[1.6px] text-[#9787bc]">
        TU ESPACIO DE PROSPECCIÓN
      </div>
      <h1>
        Hoy es un buen día
        <br />
        para conectar<span className="text-accent">.</span>
      </h1>
      <p className="text-[15px] leading-[1.6] text-[#898594]">
        Encuentra clínicas, registra tus visitas y mantén tu progreso al día.
      </p>
      <Stats
        compact
        items={[
          { label: "CLÍNICAS", value: clinics.length.toLocaleString("es-MX") },
          { label: "GESTIONADAS", value: loading ? "—" : visited },
          { label: "CLIENTES", value: loading ? "—" : customers },
        ]}
      />
      <div className="mb-[18px]">
        <div className="text-[10px] font-bold tracking-[1.6px] text-[#9787bc]">
          EMPIEZA AQUÍ
        </div>
        <h2 className="mt-2">¿Qué quieres hacer?</h2>
      </div>
      <div className="-mt-[3px] mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#f0ebff] px-[17px] py-3.5 text-[13px] text-[#61517c] max-[800px]:text-xs">
        <span>¿La clínica no está en la lista?</span>
        <Button
          variant="text"
          className="whitespace-nowrap text-[#6d4fc3]"
          onClick={() => go("add")}
        >
          <Plus aria-hidden="true" />
          Agregar clínica
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3.5 max-[800px]:grid-cols-1 max-[800px]:gap-2.5">
        {actions.map(({ page, icon: Icon, title, description, action }) => (
          <button
            type="button"
            key={page}
            className="flex min-h-[210px] flex-col rounded-2xl border border-[#eeedf3] bg-white p-[23px] text-left text-inherit hover:border-[#c8b9f2] hover:shadow-[0_6px_25px_#4e37800a] focus-visible:outline-2 focus-visible:outline-primary max-[800px]:grid max-[800px]:min-h-0 max-[800px]:grid-cols-[45px_1fr] max-[800px]:gap-x-[15px] max-[800px]:p-[18px]"
            onClick={() => go(page)}
          >
            <span className="mb-[19px] grid size-[43px] place-items-center rounded-xl bg-[#f1edff] text-[#7a5cd5] max-[800px]:row-span-3 max-[800px]:mb-0">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <h3>{title}</h3>
            <p className="mt-[9px] mb-5 text-[13px] leading-[1.5] text-[#96919f] max-[800px]:mt-[5px] max-[800px]:mb-3">
              {description}
            </p>
            <b className="mt-auto flex w-full items-center justify-between text-xs text-[#785bd0] max-[800px]:col-start-2">
              {action}
              <ArrowRight aria-hidden="true" className="size-[18px]" />
            </b>
          </button>
        ))}
      </div>
    </>
  );
}
