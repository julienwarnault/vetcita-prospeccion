import type { User } from "../shared/schemas";
export type AppEnv = {
  Variables: { user: User };
  Bindings: { DB: D1Database; ASSETS: Fetcher };
};
