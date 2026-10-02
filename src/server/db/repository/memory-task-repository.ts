import type { Task } from "../schema";
import { getDeterministicSeedTasks } from "../seed-data";
import type {
  CreateTaskInput,
  ITaskRepository,
  TasksQueryInput,
  UpdateTaskInput,
} from "./task-repository.interface";
import type { FacetsResponse, TasksResponse } from "@/types";
import { getWhitelistedColumn } from "./postgres-task-repository";

export class MemoryTaskRepository implements ITaskRepository {
  readonly name = "Memory (Dev/Test Fallback)";
  readonly isPersistent = false;

  private tasksList: Task[];

  constructor() {
    this.tasksList = getDeterministicSeedTasks(120) as Task[];
  }

  private generateId(prefix = "task", len = 12): string {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    let out = "";
    for (let i = 0; i < len; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `${prefix}_${out}`;
  }

  private generateNextTaskCode(): string {
    let maxNum = 1000;
    for (const t of this.tasksList) {
      const match = t.code.match(/TASK-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `TASK-${maxNum + 1}`;
  }

  private matchesFilter(task: Task, filter: any): boolean {
    // Column whitelisting validation
    if (!getWhitelistedColumn(filter.id)) return true;

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
        const arr = Array.isArray(target) ? target : String(target).split(",");
        return arr.includes(String(val));
      }
      case "notInArray": {
        const arr = Array.isArray(target) ? target : String(target).split(",");
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
        const [start, end] = Array.isArray(target) ? target : String(target).split(",");
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

  async getTasks(query: TasksQueryInput): Promise<TasksResponse> {
    let list = [...this.tasksList];

    if (query.title) {
      const search = query.title.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(search));
    }

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

    if (query.filters?.length) {
      if (query.joinOperator === "or") {
        list = list.filter((task) =>
          query.filters!.some((filter) => this.matchesFilter(task, filter))
        );
      } else {
        list = list.filter((task) =>
          query.filters!.every((filter) => this.matchesFilter(task, filter))
        );
      }
    }

    if (query.sort?.length) {
      list.sort((a, b) => {
        for (const s of query.sort!) {
          if (!getWhitelistedColumn(s.id)) continue;
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

  async getTaskFacets(query: Partial<TasksQueryInput>): Promise<FacetsResponse> {
    const { data: filtered } = await this.getTasks({
      page: 1,
      perPage: 10000,
      ...query,
    } as TasksQueryInput);

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

  async getTaskById(id: string): Promise<Task | null> {
    const item = this.tasksList.find((t) => t.id === id);
    return item ?? null;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const newTask: Task = {
      id: this.generateId("task"),
      code: this.generateNextTaskCode(),
      title: input.title,
      status: input.status,
      label: input.label,
      priority: input.priority,
      estimatedHours: input.estimatedHours,
      archived: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasksList.unshift(newTask);
    return newTask;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const index = this.tasksList.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.tasksList[index] = {
      ...this.tasksList[index],
      ...input,
      updatedAt: new Date(),
    };
    return this.tasksList[index];
  }

  async deleteTask(id: string): Promise<Task | null> {
    const index = this.tasksList.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const [deleted] = this.tasksList.splice(index, 1);
    return deleted;
  }

  async bulkDeleteTasks(ids: string[]): Promise<number> {
    const initialLen = this.tasksList.length;
    this.tasksList = this.tasksList.filter((t) => !ids.includes(t.id));
    return initialLen - this.tasksList.length;
  }

  async bulkUpdateTasks(ids: string[], input: UpdateTaskInput): Promise<number> {
    let count = 0;
    for (const t of this.tasksList) {
      if (ids.includes(t.id)) {
        Object.assign(t, input, { updatedAt: new Date() });
        count++;
      }
    }
    return count;
  }

  async seedData(): Promise<{ count: number; message: string }> {
    this.tasksList = getDeterministicSeedTasks(120) as Task[];
    return {
      count: this.tasksList.length,
      message: `Memory store fallback re-seeded with ${this.tasksList.length} tasks.`,
    };
  }
}
