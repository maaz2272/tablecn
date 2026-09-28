import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { count, inArray, eq } from "drizzle-orm";
import { db, hasDb } from "../db";
import { tasks } from "../db/schema";
import {
  createTaskSchema,
  deleteTasksSchema,
  getTasksQuerySchema,
  updateTaskSchema,
} from "./validators";
import { buildTasksOrderBy, buildTasksWhere } from "./query-builder";
import {
  queryMemoryTasks,
  getMemoryTaskFacets,
  createMemoryTask,
  updateMemoryTask,
  deleteMemoryTask,
  bulkDeleteMemoryTasks,
  bulkUpdateMemoryTasks,
} from "../db/memory-query-engine";
import { resetMemoryTasks } from "../db/memory-store";

// All routes are mounted under /api by the Next.js catch-all route handler.
export const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

function generateId(prefix: string, len = 12) {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}_${out}`;
}

app.get("/health", (c) => c.json({ ok: true, hasDb, time: new Date().toISOString() }));

/** Reset/Re-seed task dataset endpoint */
app.post("/tasks/seed", (c) => {
  resetMemoryTasks(120);
  return c.json({ ok: true, message: "Dataset re-seeded successfully." });
});

/**
 * GET /api/tasks
 * Server-side pagination + multi-column sort + advanced filters,
 * mirroring tablecn.com's data table query contract.
 */
app.get("/tasks", async (c) => {
  const raw = Object.fromEntries(new URL(c.req.url).searchParams);
  const parsed = getTasksQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return c.json({ error: "Invalid query", issues: parsed.error.issues }, 400);
  }

  const query = parsed.data;

  if (!hasDb) {
    const result = queryMemoryTasks(query);
    return c.json(result);
  }

  const where = buildTasksWhere(query);
  const orderBy = buildTasksOrderBy(query);
  const offset = (query.page - 1) * query.perPage;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(...orderBy)
      .limit(query.perPage)
      .offset(offset),
    db.select({ count: count() }).from(tasks).where(where),
  ]);

  const total = totalRows[0]?.count ?? 0;
  const pageCount = Math.ceil(total / query.perPage);

  return c.json({
    data: rows,
    pageCount,
    total,
  });
});

/**
 * GET /api/tasks/facets
 * Counts per status/label/priority for the faceted filter dropdowns,
 * respecting whatever other filters are currently active.
 */
app.get("/tasks/facets", async (c) => {
  const raw = Object.fromEntries(new URL(c.req.url).searchParams);
  const parsed = getTasksQuerySchema.partial().safeParse(raw);
  const query = parsed.success ? parsed.data : {};

  if (!hasDb) {
    const result = getMemoryTaskFacets(query);
    return c.json(result);
  }

  const where = buildTasksWhere(query as any);

  const [statusCounts, labelCounts, priorityCounts] = await Promise.all([
    db
      .select({ value: tasks.status, count: count() })
      .from(tasks)
      .where(where)
      .groupBy(tasks.status),
    db
      .select({ value: tasks.label, count: count() })
      .from(tasks)
      .where(where)
      .groupBy(tasks.label),
    db
      .select({ value: tasks.priority, count: count() })
      .from(tasks)
      .where(where)
      .groupBy(tasks.priority),
  ]);

  return c.json({
    status: statusCounts,
    label: labelCounts,
    priority: priorityCounts,
  });
});

app.get("/tasks/:id", async (c) => {
  const id = c.req.param("id");

  if (!hasDb) {
    const result = queryMemoryTasks({ page: 1, perPage: 1000 } as any);
    const item = result.data.find((t) => t.id === id);
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json({ data: item });
  }

  const row = await db.query.tasks.findFirst({ where: eq(tasks.id, id) });
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ data: row });
});

app.post("/tasks", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  if (!hasDb) {
    const inserted = createMemoryTask(parsed.data);
    return c.json({ data: inserted }, 201);
  }

  const id = generateId("task");
  const countRow = await db.select({ count: count() }).from(tasks);
  const code = `TASK-${1000 + (countRow[0]?.count ?? 0)}`;

  const [inserted] = await db
    .insert(tasks)
    .values({ id, code, ...parsed.data })
    .returning();

  return c.json({ data: inserted }, 201);
});

app.patch("/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  if (!hasDb) {
    const updated = updateMemoryTask(id, parsed.data);
    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ data: updated });
  }

  const [updated] = await db
    .update(tasks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ data: updated });
});

app.delete("/tasks/:id", async (c) => {
  const id = c.req.param("id");

  if (!hasDb) {
    const deleted = deleteMemoryTask(id);
    if (!deleted) return c.json({ error: "Not found" }, 404);
    return c.json({ data: deleted });
  }

  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ data: deleted });
});

/** Bulk delete for the data table's row-selection toolbar action. */
app.post("/tasks/bulk-delete", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = deleteTasksSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }

  if (!hasDb) {
    const count = bulkDeleteMemoryTasks(parsed.data.ids);
    return c.json({ count });
  }

  const deleted = await db
    .delete(tasks)
    .where(inArray(tasks.id, parsed.data.ids))
    .returning();

  return c.json({ data: deleted, count: deleted.length });
});

/** Bulk status/label/priority update for multi-select row actions. */
app.post("/tasks/bulk-update", async (c) => {
  const body = await c.req.json().catch(() => null);
  const schema = deleteTasksSchema.and(updateTaskSchema);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", issues: parsed.error.issues }, 400);
  }
  const { ids, ...rest } = parsed.data as any;

  if (!hasDb) {
    const count = bulkUpdateMemoryTasks(ids, rest);
    return c.json({ count });
  }

  const updated = await db
    .update(tasks)
    .set({ ...rest, updatedAt: new Date() })
    .where(inArray(tasks.id, ids))
    .returning();

  return c.json({ data: updated, count: updated.length });
});

export type AppType = typeof app;
