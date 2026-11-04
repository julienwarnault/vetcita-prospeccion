import { ChevronRight, Cross } from "lucide-react";
import type { Clinic, Visit } from "../../shared/schemas";
import { clinicStatus, distance, type Position } from "../model";
import Badge from "./ui/Badge";

export default function ClinicCard({
  c,
  visit,
  nearby,
  pos,
  onOpen,
}: {
  c: Clinic;
  visit?: Visit;
  nearby: boolean;
  pos: Position | null;
  onOpen: (clinic: Clinic) => void;
}) {
  const status = clinicStatus(visit);
  return (
    <button
      type="button"
      className="mb-[9px] flex w-full items-center gap-3.5 rounded-xl border border-[#eeedf3] bg-white p-[17px] text-left text-inherit transition-shadow hover:border-[#c8b9f2] hover:shadow-[0_6px_25px_#4e37800a] focus-visible:outline-2 focus-visible:outline-primary max-[420px]:gap-2.5"
      onClick={() => onOpen(c)}
    >
      <div className="grid size-[42px] shrink-0 place-items-center rounded-[11px] bg-[#f1edff] text-[#8063d3] max-[420px]:size-[35px]">
        <Cross aria-hidden="true" className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5 max-[800px]:items-start max-[420px]:block">
          <strong className="text-sm max-[800px]:max-w-[70%] max-[420px]:block max-[420px]:max-w-none">
            {c.name}
          </strong>
          <Badge
            tone={status === "Cliente" ? "success" : "default"}
            className="max-[420px]:mt-1.5 max-[420px]:inline-block"
          >
            {status}
          </Badge>
        </div>
        <p className="my-[5px] text-xs leading-[1.4] text-[#918d9b]">
          {c.address || "Dirección no disponible"}
        </p>
        <div className="text-[11px] text-[#aaa5b2] [&_b]:text-[#8c72c5]">
          {c.borough || "Alcaldía sin confirmar"}{" "}
          {nearby && pos && isFinite(distance(c, pos)) && (
            <>
              {" "}
              · <b>{distance(c, pos).toFixed(1)} km</b>
            </>
          )}{" "}
          {c.verify && (
            <>
              {" "}
              · <b>Por verificar</b>
            </>
          )}
        </div>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="size-6 shrink-0 text-[#c8c4d0]"
      />
    </button>
  );
}
