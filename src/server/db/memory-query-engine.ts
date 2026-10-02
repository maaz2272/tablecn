import { getMemoryTasks } from "./memory-store";
import type { Task } from "./schema";
import type { z } from "zod";
import type { filterItemSchema, getTasksQuerySchema } from "../hono/validators";

type FilterItem = z.infer<typeof filterItemSchema>;

function matchesFilter(task: Task, filter: FilterItem): boolean {
  const val = (task as any)[filter.id];
  const target = filter.value;

  switch (filter.operator) {
    case "iLike":
      return typeof target === "string"
        ? String(val ?? "").toLowerCase().includes(target.toLowerCase())
        : true;
    case "notILike":
      return typeof target === "string"
        ? !String(val ?? "").toLowerCase().includes(target.toLowerCase())
        : true;
    case "eq":
      return String(val) === String(target);
    case "ne":
      return String(val) !== String(target);
    case "inArray": {
      const arr = Array.isArray(target) ? target : target.split(",");
      return arr.includes(String(val));
    }
    case "notInArray": {
      const arr = Array.isArray(target) ? target : target.split(",");
      return !arr.includes(String(val));
    }
    case "lt":
      return Number(val) < Number(target);
    case "lte":
      return Number(val) <= Number(target);
    case "gt":
      return Number(val) > Number(target);
    case "gte":
      return Number(val) >= Number(target);
    case "isBetween": {
      const [start, end] = Array.isArray(target) ? target : target.split(",");
      if (!start || !end) return true;
      if (filter.variant === "date" || filter.variant === "dateRange") {
        const time = new Date(val).getTime();
        return time >= Number(start) && time <= Number(end);
      }
      const num = Number(val);
      return num >= Number(start) && num <= Number(end);
    }
    case "isEmpty":
      return val === null || val === undefined || val === "";
    case "isNotEmpty":
      return val !== null && val !== undefined && val !== "";
    case "isRelativeToToday": {
      const days = Number(target);
      const targetTime = Date.now() + days * 86400000;
      return new Date(val).getTime() >= targetTime;
    }
    default:
      return true;
  }
}

export function queryMemoryTasks(query: z.infer<typeof getTasksQuerySchema>) {
  let list = [...getMemoryTasks()];

  // Filter title search
  if (query.title) {
    const search = query.title.toLowerCase();
    list = list.filter((t) => t.title.toLowerCase().includes(search));
  }

  // Facet query param filters
  if (query.status) {
    const statuses = query.status.split(",").filter(Boolean);
    if (statuses.length) list = list.filter((t) => statuses.includes(t.status));
  }

  if (query.label) {
    const labels = query.label.split(",").filter(Boolean);
    if (labels.length) list = list.filter((t) => labels.includes(t.label));
  }

  if (query.priority) {
    const priorities = query.priority.split(",").filter(Boolean);
    if (priorities.length) list = list.filter((t) => priorities.includes(t.priority));
  }

  if (query.from) {
    const fromTime = new Date(query.from).getTime();
    list = list.filter((t) => new Date(t.createdAt).getTime() >= fromTime);
  }

  if (query.to) {
    const toTime = new Date(query.to).getTime();
    list = list.filter((t) => new Date(t.createdAt).getTime() <= toTime);
  }

  // Advanced filters
  if (query.filters?.length) {
    if (query.joinOperator === "or") {
      list = list.filter((task) =>
        query.filters!.some((filter) => matchesFilter(task, filter))
      );
    } else {
      list = list.filter((task) =>
        query.filters!.every((filter) => matchesFilter(task, filter))
      );
    }
  }

  // Sorting
  if (query.sort?.length) {
    list.sort((a, b) => {
      for (const s of query.sort!) {
        const valA = (a as any)[s.id];
        const valB = (b as any)[s.id];
        if (valA === valB) continue;

        let cmp: number;
        if (valA instanceof Date || valB instanceof Date) {
          cmp = new Date(valA).getTime() - new Date(valB).getTime();
        } else if (typeof valA === "number" && typeof valB === "number") {
          cmp = valA - valB;
        } else {
          cmp = String(valA ?? "").localeCompare(String(valB ?? ""));
        }

        return s.desc ? -cmp : cmp;
      }
      return 0;
    });
  } else {
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  const total = list.length;
  const pageCount = Math.ceil(total / query.perPage);
  const offset = (query.page - 1) * query.perPage;
  const paginated = list.slice(offset, offset + query.perPage);

  return {
    data: paginated,
    pageCount,
    total,
  };
}

export function getMemoryTaskFacets(query: Partial<z.infer<typeof getTasksQuerySchema>>) {
  const { data: filtered } = queryMemoryTasks({
    page: 1,
    perPage: 10000,
    ...query,
  } as any);

  const statusMap = new Map<string, number>();
  const labelMap = new Map<string, number>();
  const priorityMap = new Map<string, number>();

  for (const t of filtered) {
    statusMap.set(t.status, (statusMap.get(t.status) ?? 0) + 1);
    labelMap.set(t.label, (labelMap.get(t.label) ?? 0) + 1);
    priorityMap.set(t.priority, (priorityMap.get(t.priority) ?? 0) + 1);
  }

  return {
    status: Array.from(statusMap.entries()).map(([value, count]) => ({
      value,
      count,
    })),
    label: Array.from(labelMap.entries()).map(([value, count]) => ({
      value,
      count,
    })),
    priority: Array.from(priorityMap.entries()).map(([value, count]) => ({
      value,
      count,
    })),
  };
}

export function createMemoryTask(input: Partial<Task>): Task {
  const list = getMemoryTasks();
  const newTask: Task = {
    id: `task_${Math.random().toString(36).substring(2, 10)}`,
    code: `TASK-${1000 + list.length}`,
    title: input.title || "Untitled Task",
    status: (input.status as any) || "todo",
    label: (input.label as any) || "bug",
    priority: (input.priority as any) || "medium",
    estimatedHours: input.estimatedHours ?? 0,
    archived: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  list.unshift(newTask);
  return newTask;
}

export function updateMemoryTask(id: string, input: Partial<Task>): Task | null {
  const list = getMemoryTasks();
  const index = list.findIndex((t) => t.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...input,
    updatedAt: new Date(),
  };
  return list[index];
}

export function deleteMemoryTask(id: string): Task | null {
  const list = getMemoryTasks();
  const index = list.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const [deleted] = list.splice(index, 1);
  return deleted;
}

export function bulkDeleteMemoryTasks(ids: string[]): number {
  const list = getMemoryTasks();
  const initialLen = list.length;
  global.__memoryTasks = list.filter((t) => !ids.includes(t.id));
  return initialLen - global.__memoryTasks.length;
}

export function bulkUpdateMemoryTasks(ids: string[], input: Partial<Task>): number {
  const list = getMemoryTasks();
  let count = 0;
  for (const t of list) {
    if (ids.includes(t.id)) {
      Object.assign(t, input, { updatedAt: new Date() });
      count++;
    }
  }
  return count;
}
