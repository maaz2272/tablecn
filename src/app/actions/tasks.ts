"use server";

import { revalidatePath } from "next/cache";
import { app } from "@/server/hono/app";
import type {
  FacetsResponse,
  Task,
  TasksQuery,
  TasksResponse,
} from "@/types";

function buildSearchParams(query: Partial<TasksQuery>) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.perPage) params.set("perPage", String(query.perPage));
  if (query.sort?.length) params.set("sort", JSON.stringify(query.sort));
  if (query.filters?.length)
    params.set("filters", JSON.stringify(query.filters));
  if (query.joinOperator) params.set("joinOperator", query.joinOperator);
  if (query.title) params.set("title", query.title);
  if (query.status) params.set("status", query.status);
  if (query.label) params.set("label", query.label);
  if (query.priority) params.set("priority", query.priority);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return params;
}

/** Direct in-memory dispatch to Hono routes (avoids network loopback issues on Vercel) */
async function callHono<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await app.request(`http://localhost${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: json?.error || `HTTP ${res.status}` };
    }
    return { data: json as T };
  } catch (err: any) {
    console.error(`Hono route execution error on ${path}:`, err);
    return { error: err?.message || "Server error" };
  }
}

export async function getTasks(
  query: Partial<TasksQuery>
): Promise<TasksResponse> {
  const params = buildSearchParams(query);
  const { data, error } = await callHono<TasksResponse>(
    `/api/tasks?${params.toString()}`
  );

  if (error || !data) {
    console.error("getTasks failed:", error);
    return { data: [], pageCount: 0, total: 0 };
  }
  return data;
}

export async function getTaskFacets(
  query: Partial<TasksQuery>
): Promise<FacetsResponse> {
  const params = buildSearchParams(query);
  const { data, error } = await callHono<FacetsResponse>(
    `/api/tasks/facets?${params.toString()}`
  );

  if (error || !data) {
    return { status: [], label: [], priority: [] };
  }
  return data;
}

export interface CreateTaskInput {
  title: string;
  status?: string;
  label?: string;
  priority?: string;
  estimatedHours?: number;
}

export async function createTask(input: CreateTaskInput) {
  const { data, error } = await callHono<{ data: Task }>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (error) return { error };
  revalidatePath("/tasks");
  return { data: data?.data };
}

export async function updateTask(id: string, input: Partial<CreateTaskInput>) {
  const { data, error } = await callHono<{ data: Task }>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  if (error) return { error };
  revalidatePath("/tasks");
  return { data: data?.data };
}

export async function deleteTask(id: string) {
  const { error } = await callHono(`/api/tasks/${id}`, { method: "DELETE" });
  if (error) return { error };
  revalidatePath("/tasks");
  return { success: true };
}

export async function bulkDeleteTasks(ids: string[]) {
  const { data, error } = await callHono<{ count: number }>(
    "/api/tasks/bulk-delete",
    {
      method: "POST",
      body: JSON.stringify({ ids }),
    }
  );

  if (error) return { error };
  revalidatePath("/tasks");
  return { success: true, count: data?.count ?? 0 };
}

export async function bulkUpdateTasks(
  ids: string[],
  input: Partial<CreateTaskInput>
) {
  const { data, error } = await callHono<{ count: number }>(
    "/api/tasks/bulk-update",
    {
      method: "POST",
      body: JSON.stringify({ ids, ...input }),
    }
  );

  if (error) return { error };
  revalidatePath("/tasks");
  return { success: true, count: data?.count ?? 0 };
}

export async function seedTasksAction() {
  const { error } = await callHono("/api/tasks/seed", { method: "POST" });
  if (error) return { error };
  revalidatePath("/tasks");
  return { success: true };
}
