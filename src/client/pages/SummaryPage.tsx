import Stats from "../components/Stats";
import { ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import type { ReactNode } from "react";
import type { Clinic, Visit } from "../../shared/schemas";
import { isActive } from "../model";

export default function SummaryPage({
  clinics,
  visits,
  visited,
  go,
  card,
}: {
  clinics: Clinic[];
  visits: Record<string, Visit>;
  visited: number;
  go: (page: "history") => void;
  card: (clinic: Clinic) => ReactNode;
}) {
  return (
    <>
      <div className="text-[10px] font-bold tracking-[1.6px] text-[#9787bc]">
        VISIÓN GENERAL
      </div>
      <h1>
        Resumen de actividad<span className="text-accent">.</span>
      </h1>
      <p className="text-[15px] leading-[1.6] text-[#898594]">
        Sigue el avance de la prospección.
      </p>
      <Stats
        items={[
          { label: "TOTAL DE CLÍNICAS", value: clinics.length },
          { label: "GESTIONADAS", value: visited },
          {
            label: "AVANCE",
            value: `${clinics.length ? Math.round((100 * visited) / clinics.length) : 0}%`,
          },
        ]}
      />
      <div className="mb-[18px] flex items-end justify-between [&_h2]:mt-2">
        <h2>Últimas visitas</h2>
        <Button variant="text" onClick={() => go("history")}>
          Ver historial <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      {clinics
        .filter((c) => isActive(visits[c.id]))
        .sort((a, b) =>
          (visits[b.id]?.date || "").localeCompare(visits[a.id]?.date || ""),
        )
        .slice(0, 8)
        .map(card)}
      {!visited && (
        <div className="p-[30px] text-center text-[13px] text-[#a09ba9]">
          Todavía no hay visitas registradas.
        </div>
      )}
    </>
  );
}
