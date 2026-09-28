"use server";

import { revalidatePath } from "next/cache";
import { $fetch } from "@/lib/api-client";
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

export async function getTasks(
  query: Partial<TasksQuery>
): Promise<TasksResponse> {
  const params = buildSearchParams(query);
  const { data, error } = await $fetch<TasksResponse>(
    `/api/tasks?${params.toString()}`,
    { method: "GET" }
  );

  if (error || !data) {
    console.error("getTasks failed", error);
    return { data: [], pageCount: 0, total: 0 };
  }
  return data;
}

export async function getTaskFacets(
  query: Partial<TasksQuery>
): Promise<FacetsResponse> {
  const params = buildSearchParams(query);
  const { data, error } = await $fetch<FacetsResponse>(
    `/api/tasks/facets?${params.toString()}`,
    { method: "GET" }
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
  const { data, error } = await $fetch<{ data: Task }>("/api/tasks", {
    method: "POST",
    body: input,
  });

  if (error) return { error: error.message ?? "Failed to create task" };
  revalidatePath("/tasks");
  return { data: data?.data };
}

export async function updateTask(id: string, input: Partial<CreateTaskInput>) {
  const { data, error } = await $fetch<{ data: Task }>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: input,
  });

  if (error) return { error: error.message ?? "Failed to update task" };
  revalidatePath("/tasks");
  return { data: data?.data };
}

export async function deleteTask(id: string) {
  const { error } = await $fetch(`/api/tasks/${id}`, { method: "DELETE" });
  if (error) return { error: error.message ?? "Failed to delete task" };
  revalidatePath("/tasks");
  return { success: true };
}

export async function bulkDeleteTasks(ids: string[]) {
  const { error, data } = await $fetch<{ count: number }>(
    "/api/tasks/bulk-delete",
    { method: "POST", body: { ids } }
  );
  if (error) return { error: error.message ?? "Failed to delete tasks" };
  revalidatePath("/tasks");
  return { success: true, count: data?.count ?? 0 };
}

export async function bulkUpdateTasks(
  ids: string[],
  input: Partial<CreateTaskInput>
) {
  const { error, data } = await $fetch<{ count: number }>(
    "/api/tasks/bulk-update",
    { method: "POST", body: { ids, ...input } }
  );
  if (error) return { error: error.message ?? "Failed to update tasks" };
  revalidatePath("/tasks");
  return { success: true, count: data?.count ?? 0 };
}

export async function seedTasksAction() {
  const { error } = await $fetch("/api/tasks/seed", { method: "POST" });
  if (error) return { error: error.message ?? "Failed to seed tasks" };
  revalidatePath("/tasks");
  return { success: true };
}
