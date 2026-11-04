import { hc } from "hono/client";
import { z } from "zod";
import type { Api } from "../server/api";
import {
  clinicSchema,
  visitRecordSchema,
  type NewClinic,
  type Visit,
} from "../shared/schemas";

const client = hc<Api>("/api");
async function read<T>(
  response: Pick<Response, "ok" | "status" | "json">,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ error: z.string() }).safeParse(data);
    throw new Error(
      error.success ? error.data.error : "No se pudo completar la operación.",
    );
  }
  return schema.parse(data);
}

export const api = {
  async clinics() {
    return read(await client.clinics.$get(), z.array(clinicSchema));
  },
  async visits() {
    return read(await client.visits.$get(), z.array(visitRecordSchema));
  },
  async addClinic(data: NewClinic) {
    return read(await client.clinics.$post({ json: data }), clinicSchema);
  },
  async saveVisit(id: string, data: Visit) {
    return read(
      await client.visits.$post({ json: { id, data } }),
      visitRecordSchema,
    );
  },
};
