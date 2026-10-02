import { count, eq, inArray, sql, asc, desc, type SQL } from "drizzle-orm";
import type { DatabaseInstance } from "../index";
import { tasks, type Task } from "../schema";
import { getDeterministicSeedTasks } from "../seed-data";
import type {
  CreateTaskInput,
  ITaskRepository,
  TasksQueryInput,
  UpdateTaskInput,
} from "./task-repository.interface";
import type { FacetsResponse, TasksResponse } from "@/types";
import { buildFilterCondition } from "../../hono/query-builder";

// Whitelisted columns for safe SQL operations
const ALLOWED_COLUMNS = {
  id: tasks.id,
  code: tasks.code,
  title: tasks.title,
  status: tasks.status,
  label: tasks.label,
  priority: tasks.priority,
  estimatedHours: tasks.estimatedHours,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
} as const;

export type WhitelistedColumnKey = keyof typeof ALLOWED_COLUMNS;

export function getWhitelistedColumn(colId: string) {
  return ALLOWED_COLUMNS[colId as WhitelistedColumnKey] ?? null;
}

export class PostgresTaskRepository implements ITaskRepository {
  readonly name = "PostgreSQL";
  readonly isPersistent = true;

  constructor(private db: DatabaseInstance) {}

  private generateId(prefix = "task", len = 12): string {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    let out = "";
    for (let i = 0; i < len; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `${prefix}_${out}`;
  }

  /**
   * Collision-safe Task Code Generation:
   * Finds the maximum existing integer suffix in codes like "TASK-1005" and returns "TASK-1006".
   */
  private async generateNextTaskCode(): Promise<string> {
    const result = await this.db.select({
      maxCode: sql<string>`MAX(${tasks.code})`,
    }).from(tasks);

    const maxCodeStr = result[0]?.maxCode;
    let nextNum = 1001;

    if (maxCodeStr) {
      const match = maxCodeStr.match(/TASK-(\d+)/);
      if (match && match[1]) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `TASK-${nextNum}`;
  }

  private buildWhere(query: TasksQueryInput): SQL | undefined {
    const conditions: (SQL | undefined)[] = [];

    if (query.title) {
      conditions.push(sql`LOWER(${tasks.title}) LIKE LOWER(${`%${query.title}%`})`);
    }
    if (query.status) {
      const values = query.status.split(",").filter(Boolean);
      if (values.length) conditions.push(inArray(tasks.status, values as any));
    }
    if (query.label) {
      const values = query.label.split(",").filter(Boolean);
      if (values.length) conditions.push(inArray(tasks.label, values as any));
    }
    if (query.priority) {
      const values = query.priority.split(",").filter(Boolean);
      if (values.length) conditions.push(inArray(tasks.priority, values as any));
    }
    if (query.from) {
      conditions.push(sql`${tasks.createdAt} >= ${new Date(query.from)}`);
    }
    if (query.to) {
      conditions.push(sql`${tasks.createdAt} <= ${new Date(query.to)}`);
    }

    if (query.filters?.length) {
      const advanced = query.filters
        .map(buildFilterCondition)
        .filter((c): c is SQL => Boolean(c));

      if (advanced.length) {
        conditions.push(
          query.joinOperator === "or" ? sql.join(advanced, sql` OR `) : sql.join(advanced, sql` AND `)
        );
      }
    }

    const validConditions = conditions.filter((c): c is SQL => Boolean(c));
    if (!validConditions.length) return undefined;
    return sql.join(validConditions, sql` AND `);
  }

  private buildOrderBy(query: TasksQueryInput): SQL[] {
    if (!query.sort?.length) {
      return [desc(tasks.createdAt)];
    }
    const orderBys: SQL[] = [];
    for (const s of query.sort) {
      const col = getWhitelistedColumn(s.id);
      if (col) {
        orderBys.push(s.desc ? desc(col) : asc(col));
      }
    }
    return orderBys.length > 0 ? orderBys : [desc(tasks.createdAt)];
  }

  async getTasks(query: TasksQueryInput): Promise<TasksResponse> {
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);
    const offset = (query.page - 1) * query.perPage;

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(tasks)
        .where(where)
        .orderBy(...orderBy)
        .limit(query.perPage)
        .offset(offset),
      this.db.select({ count: count() }).from(tasks).where(where),
    ]);

    const total = totalRows[0]?.count ?? 0;
    const pageCount = Math.ceil(total / query.perPage);

    return {
      data: rows,
      pageCount,
      total,
    };
  }

  async getTaskFacets(query: Partial<TasksQueryInput>): Promise<FacetsResponse> {
    const where = this.buildWhere(query as TasksQueryInput);

    const [statusCounts, labelCounts, priorityCounts] = await Promise.all([
      this.db
        .select({ value: tasks.status, count: count() })
        .from(tasks)
        .where(where)
        .groupBy(tasks.status),
      this.db
        .select({ value: tasks.label, count: count() })
        .from(tasks)
        .where(where)
        .groupBy(tasks.label),
      this.db
        .select({ value: tasks.priority, count: count() })
        .from(tasks)
        .where(where)
        .groupBy(tasks.priority),
    ]);

    return {
      status: statusCounts,
      label: labelCounts,
      priority: priorityCounts,
    };
  }

  async getTaskById(id: string): Promise<Task | null> {
    const row = await this.db.query.tasks.findFirst({ where: eq(tasks.id, id) });
    return row ?? null;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const id = this.generateId("task");
    const code = await this.generateNextTaskCode();

    const [inserted] = await this.db
      .insert(tasks)
      .values({
        id,
        code,
        title: input.title,
        status: input.status,
        label: input.label,
        priority: input.priority,
        estimatedHours: input.estimatedHours,
      })
      .returning();

    return inserted;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const [updated] = await this.db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return updated ?? null;
  }

  async deleteTask(id: string): Promise<Task | null> {
    const [deleted] = await this.db.delete(tasks).where(eq(tasks.id, id)).returning();
    return deleted ?? null;
  }

  async bulkDeleteTasks(ids: string[]): Promise<number> {
    if (!ids.length) return 0;
    const deleted = await this.db.delete(tasks).where(inArray(tasks.id, ids)).returning();
    return deleted.length;
  }

  async bulkUpdateTasks(ids: string[], input: UpdateTaskInput): Promise<number> {
    if (!ids.length) return 0;
    const updated = await this.db
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(inArray(tasks.id, ids))
      .returning();

    return updated.length;
  }

  async seedData(): Promise<{ count: number; message: string }> {
    // Truncate existing tasks in PostgreSQL and re-insert deterministic seed tasks
    await this.db.delete(tasks);
    const seedTasks = getDeterministicSeedTasks(120);

    const CHUNK = 50;
    for (let i = 0; i < seedTasks.length; i += CHUNK) {
      await this.db.insert(tasks).values(seedTasks.slice(i, i + CHUNK));
    }

    return {
      count: seedTasks.length,
      message: `PostgreSQL database reset & seeded with ${seedTasks.length} tasks.`,
    };
  }
}
