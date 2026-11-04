import { z } from "zod";

export const statusOptions = [
  "Sin visitar",
  "Por contactar",
  "Visita pendiente",
  "Cliente",
] as const;
const visitStatus = z.enum([...statusOptions, "Visitada", "No visitada"]);
const text = (max = 300) => z.string().max(max).default("");
const numericText = z
  .string()
  .max(30)
  .refine(
    (value) =>
      value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
    "Introduce un número positivo",
  )
  .default("");

export const visitSchema = z.object({
  status: visitStatus.default("Sin visitar"),
  platform: z.enum(["", "Sí", "No", "No sabe"]).default(""),
  provider: text(),
  price: numericText,
  multi: z.enum(["", "Sí", "No", "No sabe"]).default(""),
  sites: numericText,
  employees: numericText,
  vets: numericText,
  monthly: text(1000),
  notes: text(10000),
  date: z
    .union([z.literal(""), z.string().datetime({ offset: true })])
    .default(""),
  contactName: text(),
  contactRole: text(),
  contactEmail: z
    .union([z.literal(""), z.string().email().max(300)])
    .default(""),
  contactPhone: text(80),
});
export type Visit = z.infer<typeof visitSchema>;
export type DraftVisit = Omit<Visit, "status"> & {
  status: Visit["status"] | "Visitada (anterior)";
};
export const blankVisit: Visit = visitSchema.parse({});

export const clinicSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1),
  // Legacy/manual clinics can omit the state until it is known.
  state: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? ""),
  borough: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  phone: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  address: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  category: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  website: z
    .union([
      z.literal(""),
      z
        .string()
        .url()
        .refine((value) => /^https?:\/\//i.test(value)),
    ])
    .nullable()
    .transform((value) => value ?? ""),
  hours: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  neighborhood: z
    .string()
    .nullable()
    .transform((value) => value ?? ""),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  maps: z
    .string()
    .url()
    .refine((value) => /^https?:\/\//i.test(value)),
  verify: z.boolean(),
  rating: z.number().min(0).max(5).nullable(),
  manual: z.boolean().optional(),
});
export type Clinic = z.infer<typeof clinicSchema>;

export const newClinicSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    address: z.string().trim().min(1).max(500),
    borough: z.string().trim().max(100).default(""),
    neighborhood: z.string().trim().max(150).default(""),
    phone: z.string().trim().max(80).default(""),
    category: z.string().trim().max(150).default(""),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
  })
  .refine(
    (value) => (value.lat === null) === (value.lng === null),
    "Las coordenadas deben indicarse juntas",
  );
export type NewClinic = z.infer<typeof newClinicSchema>;
export const blankClinic: NewClinic = {
  name: "",
  address: "",
  borough: "",
  neighborhood: "",
  phone: "",
  category: "",
  lat: null,
  lng: null,
};
export const saveVisitSchema = z.object({
  id: z.string().trim().min(1).max(200),
  data: visitSchema,
});
export const visitRecordSchema = z.object({
  id: z.string(),
  data: visitSchema,
  updatedAt: z.string(),
  author: z.string(),
});
