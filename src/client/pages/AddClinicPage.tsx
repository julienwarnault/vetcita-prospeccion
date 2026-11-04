import { ArrowLeft, LocateFixed } from "lucide-react";
import { panelVariants } from "../components/ui/Panel";
import Button from "../components/ui/Button";
import { Input, Field } from "../components/ui/Fields";
import type { FormEvent, Dispatch, SetStateAction } from "react";
import type { NewClinic } from "../../shared/schemas";

export default function AddClinicPage({
  go,
  newClinic,
  setNewClinic,
  boroughs,
  locating,
  clinicLocation,
  adding,
  addClinic,
  addMsg,
}: {
  go: (page: "list") => void;
  newClinic: NewClinic;
  setNewClinic: Dispatch<SetStateAction<NewClinic>>;
  boroughs: string[];
  locating: boolean;
  clinicLocation: () => void;
  adding: boolean;
  addClinic: (event: FormEvent) => void;
  addMsg: string;
}) {
  return (
    <>
      <Button variant="back" onClick={() => go("list")}>
        <ArrowLeft aria-hidden="true" />
        Volver al directorio
      </Button>
      <div className="mt-[26px] text-[10px] font-bold tracking-[1.6px] text-[#9787bc]">
        NUEVO PROSPECTO
      </div>
      <h1>
        Agregar clínica<span className="text-accent">.</span>
      </h1>
      <p className="text-[15px] leading-[1.6] text-[#898594]">
        Añade una clínica que no encuentres en el directorio.
      </p>
      <form
        className={panelVariants({ className: "mt-[27px] max-w-[760px]" })}
        onSubmit={addClinic}
      >
        <h2>Datos de la clínica</h2>
        <p className="-mt-2.5 mb-[22px] text-xs leading-[1.5] text-[#9892a1]">
          El nombre y la dirección son obligatorios.
        </p>
        <div className="grid grid-cols-2 gap-5 max-[420px]:grid-cols-1 max-[420px]:gap-0">
          <Field>
            Nombre de la clínica *
            <Input
              required
              maxLength={200}
              value={newClinic.name}
              onChange={(e) =>
                setNewClinic({ ...newClinic, name: e.target.value })
              }
              placeholder="Nombre de la clínica"
            />
          </Field>
          <Field>
            Teléfono
            <Input
              type="tel"
              inputMode="tel"
              maxLength={80}
              value={newClinic.phone}
              onChange={(e) =>
                setNewClinic({ ...newClinic, phone: e.target.value })
              }
              placeholder="Número de la clínica"
            />
          </Field>
          <Field className="col-span-full max-[800px]:col-auto">
            Dirección *
            <Input
              required
              maxLength={500}
              value={newClinic.address}
              onChange={(e) =>
                setNewClinic({ ...newClinic, address: e.target.value })
              }
              placeholder="Calle, número y ciudad"
            />
          </Field>
          <Field>
            Alcaldía
            <Input
              list="borough-list"
              maxLength={100}
              value={newClinic.borough}
              onChange={(e) =>
                setNewClinic({ ...newClinic, borough: e.target.value })
              }
              placeholder="Ej. Coyoacán"
            />
            <datalist id="borough-list">
              {boroughs.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </Field>
          <Field>
            Colonia
            <Input
              maxLength={150}
              value={newClinic.neighborhood}
              onChange={(e) =>
                setNewClinic({ ...newClinic, neighborhood: e.target.value })
              }
              placeholder="Ej. Del Valle"
            />
          </Field>
        </div>
        <div className="mb-[18px] flex items-center gap-[13px] rounded-xl bg-[#f0ebff] p-4 text-[#7055bd] [&>div]:flex-1 [&_strong]:text-[13px] [&_p]:mt-1 [&_p]:text-xs [&_p]:text-[#9285ae] [&_button]:min-h-11 max-[800px]:items-start max-[800px]:[&_button]:whitespace-nowrap">
          <LocateFixed aria-hidden="true" className="size-[26px] shrink-0" />
          <div>
            <strong>
              {newClinic.lat !== null
                ? "Ubicación registrada"
                : "Ubicación en el mapa (opcional)"}
            </strong>
            <p>
              {newClinic.lat !== null
                ? "Se utilizará la ubicación actual para mostrar la clínica en el mapa."
                : "Si estás en la clínica, usa el GPS para añadirla al mapa."}
            </p>
          </div>
          <Button
            variant="text"
            type="button"
            disabled={locating}
            onClick={clinicLocation}
          >
            {locating
              ? "Buscando…"
              : newClinic.lat !== null
                ? "Actualizar"
                : "Usar GPS"}
          </Button>
        </div>
        {newClinic.lat === null && (
          <p className="-mt-2.5 mb-[22px] text-xs leading-[1.5] text-[#9892a1]">
            Sin GPS, la clínica aparecerá en el directorio, pero no como punto
            en el mapa.
          </p>
        )}
        <div className="mt-[25px] flex items-center gap-3.5 text-xs text-[#7a6a94] max-[800px]:[&_button]:min-h-12 max-[800px]:[&_button]:shrink-0 max-[800px]:[&_button]:text-sm">
          <Button type="submit" disabled={adding}>
            {adding ? "Guardando…" : "Guardar clínica"}
          </Button>
          <Button variant="text" type="button" onClick={() => go("list")}>
            Cancelar
          </Button>
        </div>
        <p className="mt-3 text-[13px] text-[#8a6071]" role="status">
          {addMsg}
        </p>
      </form>
    </>
  );
}
