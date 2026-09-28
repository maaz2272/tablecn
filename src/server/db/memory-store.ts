import type { Task } from "./schema";

const TITLES = [
  "Refactor authentication flow",
  "Fix memory leak in worker pool",
  "Add dark mode toggle",
  "Improve table pagination performance",
  "Write onboarding documentation",
  "Resolve CORS issue on API gateway",
  "Design new empty states",
  "Migrate database to Postgres 16",
  "Add column resizing to data table",
  "Investigate flaky e2e tests",
  "Optimize bundle size",
  "Implement CSV export",
  "Add row selection bulk actions",
  "Support keyboard navigation in table",
  "Fix timezone bug in date filter",
  "Add faceted filters for status",
  "Improve accessibility of dropdown menu",
  "Set up CI pipeline caching",
  "Add server-side sorting",
  "Create task detail sheet",
  "Fix hydration mismatch warning",
  "Add optimistic UI updates",
  "Improve error boundary messaging",
  "Add rate limiting to API routes",
  "Write unit tests for reducers",
  "Add multi-column sort support",
  "Improve mobile responsive layout",
  "Add skeleton loading states",
  "Fix N+1 query in task list",
  "Add debounced search input",
];

const STATUSES: ("todo" | "in-progress" | "done" | "canceled")[] = [
  "todo",
  "in-progress",
  "done",
  "canceled",
];

const LABELS: ("bug" | "feature" | "enhancement" | "documentation")[] = [
  "bug",
  "feature",
  "enhancement",
  "documentation",
];

const PRIORITIES: ("low" | "medium" | "high")[] = ["low", "medium", "high"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(prefix: string, len = 12) {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}_${out}`;
}

export function createInitialSeedTasks(count = 120): Task[] {
  return Array.from({ length: count }).map((_, i) => {
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    return {
      id: generateId("task"),
      code: `TASK-${1000 + i}`,
      title: `${pick(TITLES)} #${i + 1}`,
      status: pick(STATUSES),
      label: pick(LABELS),
      priority: pick(PRIORITIES),
      estimatedHours: Math.floor(Math.random() * 40) + 1,
      archived: 0,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __memoryTasks: Task[] | undefined;
}

export function getMemoryTasks(): Task[] {
  if (!global.__memoryTasks) {
    global.__memoryTasks = createInitialSeedTasks(120);
  }
  return global.__memoryTasks;
}

export function resetMemoryTasks(count = 120): Task[] {
  global.__memoryTasks = createInitialSeedTasks(count);
  return global.__memoryTasks;
}
