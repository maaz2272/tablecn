import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getTaskRepository } from "../db/repository";
import {
  createTaskSchema,
  deleteTasksSchema,
  getTasksQuerySchema,
  updateTaskSchema,
} from "./validators";

export const app = new Hono().basePath("/api");

app.use("*", logger());
app.use("*", cors());

/** Health check endpoint */
app.get("/health", (c) => {
  const repo = getTaskRepository();
  return c.json({
    ok: true,
    activeRepository: repo.name,
    isPersistent: repo.isPersistent,
    time: new Date().toISOString(),
  });
});

/** Reset/Re-seed task dataset endpoint for active repository source of truth */
app.post("/tasks/seed", async (c) => {
  try {
    const repo = getTaskRepository();
    const result = await repo.seedData();
    return c.json({ ok: true, ...result });
  } catch (err: any) {
    return c.json({ error: "Failed to re-seed task dataset", details: err?.message }, 500);
  }
});

/**
 * GET /api/tasks
 * Server-side pagination + multi-column sort + whitelisted advanced filters
 */
app.get("/tasks", async (c) => {
  try {
    const raw = Object.fromEntries(new URL(c.req.url).searchParams);
    const parsed = getTasksQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return c.json({ error: "Invalid query parameters", issues: parsed.error.issues }, 400);
    }

    const repo = getTaskRepository();
    const result = await repo.getTasks(parsed.data);
    return c.json(result);
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return c.json({ error: "Failed to fetch tasks from repository", details: err?.message }, 500);
  }
});

/**
 * GET /api/tasks/facets
 * Counts per status/label/priority for faceted filter dropdowns
 */
app.get("/tasks/facets", async (c) => {
  try {
    const raw = Object.fromEntries(new URL(c.req.url).searchParams);
    const parsed = getTasksQuerySchema.partial().safeParse(raw);
    const query = parsed.success ? parsed.data : {};

    const repo = getTaskRepository();
    const result = await repo.getTaskFacets(query as any);
    return c.json(result);
  } catch (err: any) {
    console.error("GET /api/tasks/facets error:", err);
    return c.json({ error: "Failed to fetch task facets", details: err?.message }, 500);
  }
});

/** GET /api/tasks/:id */
app.get("/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const repo = getTaskRepository();
    const item = await repo.getTaskById(id);

    if (!item) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ data: item });
  } catch (err: any) {
    return c.json({ error: "Failed to fetch task", details: err?.message }, 500);
  }
});

/** POST /api/tasks */
app.post("/tasks", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid task body", issues: parsed.error.issues }, 400);
    }

    const repo = getTaskRepository();
    const inserted = await repo.createTask(parsed.data);
    return c.json({ data: inserted }, 201);
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return c.json({ error: "Failed to create task", details: err?.message }, 500);
  }
});

/** PATCH /api/tasks/:id */
app.patch("/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid update body", issues: parsed.error.issues }, 400);
    }

    const repo = getTaskRepository();
    const updated = await repo.updateTask(id, parsed.data);

    if (!updated) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ data: updated });
  } catch (err: any) {
    return c.json({ error: "Failed to update task", details: err?.message }, 500);
  }
});

/** DELETE /api/tasks/:id */
app.delete("/tasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const repo = getTaskRepository();
    const deleted = await repo.deleteTask(id);

    if (!deleted) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ data: deleted });
  } catch (err: any) {
    return c.json({ error: "Failed to delete task", details: err?.message }, 500);
  }
});

/** POST /api/tasks/bulk-delete */
app.post("/tasks/bulk-delete", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const parsed = deleteTasksSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid bulk delete request", issues: parsed.error.issues }, 400);
    }

    const repo = getTaskRepository();
    const count = await repo.bulkDeleteTasks(parsed.data.ids);
    return c.json({ count });
  } catch (err: any) {
    return c.json({ error: "Failed to bulk delete tasks", details: err?.message }, 500);
  }
});

/** POST /api/tasks/bulk-update */
app.post("/tasks/bulk-update", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    const schema = deleteTasksSchema.and(updateTaskSchema);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Invalid bulk update request", issues: parsed.error.issues }, 400);
    }

    const { ids, ...rest } = parsed.data as any;
    const repo = getTaskRepository();
    const count = await repo.bulkUpdateTasks(ids, rest);
    return c.json({ count });
  } catch (err: any) {
    return c.json({ error: "Failed to bulk update tasks", details: err?.message }, 500);
  }
});

export type AppType = typeof app;
