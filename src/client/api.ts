import { hc } from "hono/client";
import { z } from "zod";
import type { Api } from "../server/api";
import {
  clinicSchema,
  userSchema,
  visitRecordSchema,
  type NewClinic,
  type Visit,
} from "../shared/schemas";

const client = hc<Api>("/api");
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
async function read<T>(
  response: Pick<Response, "ok" | "status" | "json">,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  const data: unknown = await response.json();
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("session-expired"));
    const error = z.object({ error: z.string() }).safeParse(data);
    throw new ApiError(
      response.status,
      error.success ? error.data.error : "No se pudo completar la operación.",
    );
  }
  return schema.parse(data);
}

export const api = {
  async me() {
    return read(await client.auth.me.$get(), userSchema);
  },
  async login(email: string, password: string) {
    return read(
      await client.auth.login.$post({ json: { email, password } }),
      userSchema,
    );
  },
  async logout() {
    return read(
      await client.auth.logout.$post(),
      z.object({ ok: z.boolean() }),
    );
  },
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
