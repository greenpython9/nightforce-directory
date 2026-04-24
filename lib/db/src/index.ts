import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type D1Binding = Parameters<typeof drizzle>[0];

export interface DatabaseEnv {
  DB: D1Binding;
}

export function getDb(env: DatabaseEnv) {
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;

export * from "./schema";