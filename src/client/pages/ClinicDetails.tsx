import Badge from "../components/ui/Badge";
import { ArrowLeft, ExternalLink, Sparkles, Star } from "lucide-react";
import Panel from "../components/ui/Panel";
import Button from "../components/ui/Button";
import { Input, Textarea, Field } from "../components/ui/Fields";
import type { Dispatch, SetStateAction } from "react";
import {
  statusOptions,
  type Clinic,
  type DraftVisit,
} from "../../shared/schemas";
import Choices from "../components/Choices";

export default function ClinicDetails({
  selected,
  draft,
  setDraft,
  onBack,
  save,
  msg,
  saving,
  canSave,
}: {
  selected: Clinic;
  draft: DraftVisit;
  setDraft: Dispatch<SetStateAction<DraftVisit>>;
  onBack: () => void;
  save: () => void;
  msg: string;
  saving: boolean;
  canSave: boolean;
}) {
  return (
    <>
      <Button
        variant="back"
        onClick={() => {
          onBack();
        }}
      >
        <ArrowLeft aria-hidden="true" />
        Volver
      </Button>
      <div className="my-[25px] flex items-center justify-between gap-5 max-[420px]:items-start [&_h1]:text-[30px] max-[800px]:[&_h1]:text-[25px] [&_p]:text-[13px] [&_p]:text-[#9994a2]">
        <div>
          <div className="text-[10px] font-bold tracking-[1.6px] text-[#9787bc]">
            FICHA DE CLÍNICA {selected.verify && " · POR VERIFICAR"}
          </div>
          <h1>{selected.name}</h1>
          <p>{selected.address || "Dirección no disponible"}</p>
        </div>
        <Badge
          size="large"
          tone={draft.status === "Cliente" ? "success" : "default"}
        >
          {draft.status}
        </Badge>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 max-[800px]:block">
        <div>
          <Panel>
            <h2>Información de contacto</h2>
            <div className="grid grid-cols-2 gap-5 max-[420px]:grid-cols-1 [&_small]:text-[9px] [&_small]:font-bold [&_small]:tracking-[1px] [&_small]:text-[#aaa5b3] [&_p]:mt-1.5 [&_p]:text-[13px]">
              <div>
                <small>ALCALDÍA</small>
                <p>{selected.borough || "Sin información"}</p>
              </div>
              <div>
                <small>TELÉFONO</small>
                <p>
                  {selected.phone ? (
                    <a href={"tel:" + selected.phone}>{selected.phone}</a>
                  ) : (
                    "Sin información"
                  )}
                </p>
              </div>
              <div>
                <small>CATEGORÍA</small>
                <p>{selected.category || "Sin información"}</p>
              </div>
              <div>
                <small>CALIFICACIÓN</small>
                <p>
                  {selected.rating ? (
                    <>
                      <Star
                        aria-hidden="true"
                        className="mr-1 inline size-3.5"
                      />
                      {selected.rating}/5
                    </>
                  ) : (
                    "Sin información"
                  )}
                </p>
              </div>
            </div>
            <div className="mt-[25px] flex gap-5 text-xs font-bold [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5">
              {selected.maps && (
                <a
                  href={selected.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en Google Maps{" "}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              )}
              {selected.website && (
                <a
                  href={selected.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sitio web{" "}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              )}
            </div>
          </Panel>
          <Panel>
            <fieldset
              className="m-0 min-w-0 border-0 p-0 disabled:opacity-65"
              disabled={saving || !canSave}
            >
              <div className="[&_p]:-mt-3 [&_p]:mb-[22px] [&_p]:text-xs [&_p]:text-[#a09ba9]">
                <div>
                  <h2>Información de la visita</h2>
                  <p>Registra lo que descubriste en la clínica.</p>
                </div>
              </div>
              <Choices
                label="Estado de la clínica"
                value={draft.status}
                options={statusOptions}
                onChange={(value) => setDraft({ ...draft, status: value })}
              />
              {draft.status === "Visitada (anterior)" && (
                <p className="-mt-2.5 mb-[22px] rounded-[9px] bg-[#fff8e9] px-3.5 py-3 text-xs leading-[1.5] text-[#896928]">
                  Esta clínica estaba marcada como visitada en la versión
                  anterior. Selecciona uno de los nuevos estados cuando puedas.
                </p>
              )}
              <div className="mt-1.5 border-t border-[#eeedf3] pt-[22px] [&_h3]:mb-4 [&_h3]:text-[15px] [&>p]:-mt-2 [&>p]:mb-[18px] [&>p]:text-xs [&>p]:text-[#9992a3] [&_fieldset]:mb-5">
                <h3>Persona de contacto</h3>
                <p>¿Con quién hablaste en la clínica?</p>
                <div className="grid grid-cols-2 gap-5 max-[420px]:grid-cols-1 max-[420px]:gap-0">
                  <Field>
                    Nombre del contacto
                    <Input
                      autoComplete="name"
                      value={draft.contactName}
                      onChange={(e) =>
                        setDraft({ ...draft, contactName: e.target.value })
                      }
                      placeholder="Nombre y apellido"
                    />
                  </Field>
                  <Field>
                    Puesto
                    <Input
                      autoComplete="organization-title"
                      value={draft.contactRole}
                      onChange={(e) =>
                        setDraft({ ...draft, contactRole: e.target.value })
                      }
                      placeholder="Ej. gerente o veterinario"
                    />
                  </Field>
                  <Field>
                    Correo electrónico
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={draft.contactEmail}
                      onChange={(e) =>
                        setDraft({ ...draft, contactEmail: e.target.value })
                      }
                      placeholder="correo@ejemplo.com"
                    />
                  </Field>
                  <Field>
                    Teléfono del contacto
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={draft.contactPhone}
                      onChange={(e) =>
                        setDraft({ ...draft, contactPhone: e.target.value })
                      }
                      placeholder="Número de teléfono"
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-1.5 border-t border-[#eeedf3] pt-[22px] [&_h3]:mb-4 [&_h3]:text-[15px] [&>p]:-mt-2 [&>p]:mb-[18px] [&>p]:text-xs [&>p]:text-[#9992a3] [&_fieldset]:mb-5">
                <h3>Herramientas actuales</h3>
                <Choices
                  label="¿Ya utiliza una plataforma?"
                  value={draft.platform}
                  options={["Sí", "No", "No sabe"] as const}
                  onChange={(value) => setDraft({ ...draft, platform: value })}
                />
                {(draft.platform === "Sí" ||
                  !!draft.provider ||
                  !!draft.price) && (
                  <div className="grid grid-cols-2 gap-5 max-[420px]:grid-cols-1 max-[420px]:gap-0">
                    <Field>
                      ¿Cuál plataforma?
                      <Input
                        value={draft.provider}
                        onChange={(e) =>
                          setDraft({ ...draft, provider: e.target.value })
                        }
                        placeholder="Nombre de la plataforma"
                      />
                    </Field>
                    <Field>
                      Precio mensual (MXN)
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={draft.price}
                        onChange={(e) =>
                          setDraft({ ...draft, price: e.target.value })
                        }
                        placeholder="Ej. 1500"
                      />
                    </Field>
                  </div>
                )}
              </div>
              <div className="mt-1.5 border-t border-[#eeedf3] pt-[22px] [&_h3]:mb-4 [&_h3]:text-[15px] [&>p]:-mt-2 [&>p]:mb-[18px] [&>p]:text-xs [&>p]:text-[#9992a3] [&_fieldset]:mb-5">
                <h3>Sobre la clínica</h3>
                <Choices
                  label="¿Tiene varias sucursales?"
                  value={draft.multi}
                  options={["Sí", "No", "No sabe"] as const}
                  onChange={(value) => setDraft({ ...draft, multi: value })}
                />
                <div className="grid grid-cols-2 gap-5 max-[420px]:grid-cols-1 max-[420px]:gap-0">
                  {(draft.multi === "Sí" || !!draft.sites) && (
                    <Field>
                      Número de sucursales
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={draft.sites}
                        onChange={(e) =>
                          setDraft({ ...draft, sites: e.target.value })
                        }
                        placeholder="Ej. 2"
                      />
                    </Field>
                  )}
                  <Field>
                    Número de empleados
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={draft.employees}
                      onChange={(e) =>
                        setDraft({ ...draft, employees: e.target.value })
                      }
                      placeholder="Ej. 5"
                    />
                  </Field>
                  <Field>
                    Número de veterinarios
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={draft.vets}
                      onChange={(e) =>
                        setDraft({ ...draft, vets: e.target.value })
                      }
                      placeholder="Ej. 2"
                    />
                  </Field>
                  <Field>
                    Visitas mensuales por sucursal
                    <Input
                      value={draft.monthly}
                      onChange={(e) =>
                        setDraft({ ...draft, monthly: e.target.value })
                      }
                      placeholder="Ej. Centro: 150; Norte: 80"
                    />
                  </Field>
                </div>
              </div>
              <Field>
                Notas
                <Textarea
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  placeholder="Añade información útil para el seguimiento…"
                />
              </Field>
              <div className="flex items-center gap-3.5 text-xs text-[#7a6a94] max-[800px]:[&_button]:min-h-12 max-[800px]:[&_button]:shrink-0 max-[800px]:[&_button]:text-sm">
                <Button disabled={saving || !canSave} onClick={save}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
                <span role="status">{msg}</span>
              </div>
            </fieldset>
          </Panel>
        </div>
        <div className="h-max rounded-[15px] bg-[#f0eafa] p-[22px] text-[#6d579a] max-[800px]:hidden [&_h3]:mt-[13px] [&_h3]:mb-2 [&_h3]:text-sm [&_p]:text-xs [&_p]:leading-[1.6] [&_p]:text-[#9284aa]">
          <Sparkles aria-hidden="true" className="size-[23px]" />
          <h3>Una visita a la vez</h3>
          <p>
            Completa la información que tengas disponible. Puedes volver a
            editarla después.
          </p>
        </div>
      </div>
    </>
  );
}
