import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DatabaseInstance = PostgresJsDatabase<typeof schema>;

const connectionString = process.env.DATABASE_URL;

class DatabaseClientManager {
  private static instance: DatabaseClientManager;
  private dbClient: ReturnType<typeof postgres> | null = null;
  private dbInstance: DatabaseInstance | null = null;

  private constructor() {
    if (connectionString) {
      // Reuse connection client during Next.js development hot reload
      const globalClient = (globalThis as unknown as { __pgClient?: ReturnType<typeof postgres> }).__pgClient;

      this.dbClient = globalClient ?? postgres(connectionString, {
        max: process.env.NODE_ENV === "production" ? 5 : 1,
        ssl: "require",
      });

      if (process.env.NODE_ENV !== "production") {
        (globalThis as unknown as { __pgClient?: ReturnType<typeof postgres> }).__pgClient = this.dbClient;
      }

      this.dbInstance = drizzle(this.dbClient, { schema });
    }
  }

  public static getInstance(): DatabaseClientManager {
    if (!DatabaseClientManager.instance) {
      DatabaseClientManager.instance = new DatabaseClientManager();
    }
    return DatabaseClientManager.instance;
  }

  public getDatabase(): DatabaseInstance | null {
    return this.dbInstance;
  }

  public hasConnection(): boolean {
    return this.dbInstance !== null;
  }
}

const dbManager = DatabaseClientManager.getInstance();

export const hasDb = dbManager.hasConnection();
export const db: DatabaseInstance | null = dbManager.getDatabase();
