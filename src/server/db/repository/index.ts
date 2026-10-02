import { db } from "../index";
import type { ITaskRepository } from "./task-repository.interface";
import { PostgresTaskRepository } from "./postgres-task-repository";
import { MemoryTaskRepository } from "./memory-task-repository";

class TaskRepositoryResolver {
  private static instance: ITaskRepository | null = null;

  public static getRepository(): ITaskRepository {
    if (this.instance) {
      return this.instance;
    }

    if (db) {
      console.log("[TaskRepository] Initialized PostgreSQL repository source of truth.");
      this.instance = new PostgresTaskRepository(db);
    } else {
      console.warn("[TaskRepository] DATABASE_URL missing. Initialized isolated Memory fallback repository.");
      this.instance = new MemoryTaskRepository();
    }

    return this.instance;
  }
}

export function getTaskRepository(): ITaskRepository {
  return TaskRepositoryResolver.getRepository();
}
