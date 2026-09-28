import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __dbClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;

export const hasDb = Boolean(connectionString);

// Reuse connection if Postgres is available
const client = connectionString
  ? global.__dbClient ??
    postgres(connectionString, {
      max: process.env.NODE_ENV === "production" ? 5 : 1,
      ssl: "require",
    })
  : null;

if (process.env.NODE_ENV !== "production" && client) {
  global.__dbClient = client;
}

export const db = client ? drizzle(client, { schema }) : (null as any);

