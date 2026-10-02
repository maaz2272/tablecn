import type { Task } from "../schema";
import type { z } from "zod";
import type { getTasksQuerySchema, createTaskSchema, updateTaskSchema } from "../../hono/validators";
import type { FacetsResponse, TasksResponse } from "@/types";

export type TasksQueryInput = z.infer<typeof getTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export interface ITaskRepository {
  readonly name: string;
  readonly isPersistent: boolean;

  getTasks(query: TasksQueryInput): Promise<TasksResponse>;
  getTaskFacets(query: Partial<TasksQueryInput>): Promise<FacetsResponse>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task | null>;
  deleteTask(id: string): Promise<Task | null>;
  bulkDeleteTasks(ids: string[]): Promise<number>;
  bulkUpdateTasks(ids: string[], input: UpdateTaskInput): Promise<number>;
  seedData(): Promise<{ count: number; message: string }>;
}
