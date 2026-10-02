import type { NewTask } from "./schema";

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
] as const;

const STATUSES = ["todo", "in-progress", "done", "canceled"] as const;
const LABELS = ["bug", "feature", "enhancement", "documentation"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

/**
 * Deterministic seed dataset for development, demo, and database resets.
 * Uses deterministic modulo offsets instead of Math.random().
 */
export function getDeterministicSeedTasks(count = 120): NewTask[] {
  const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();
  const dayMs = 86400000;

  return Array.from({ length: count }).map((_, i) => {
    const titleIndex = i % TITLES.length;
    const statusIndex = i % STATUSES.length;
    const labelIndex = (i * 3) % LABELS.length;
    const priorityIndex = (i * 2) % PRIORITIES.length;
    const hours = (i % 38) + 1;
    const dayOffset = (i * 7) % 90;
    const createdAt = new Date(baseTime + dayOffset * dayMs);

    return {
      id: `task_${1001 + i}`,
      code: `TASK-${1001 + i}`,
      title: `${TITLES[titleIndex]} #${i + 1}`,
      status: STATUSES[statusIndex],
      label: LABELS[labelIndex],
      priority: PRIORITIES[priorityIndex],
      estimatedHours: hours,
      archived: 0,
      createdAt,
      updatedAt: createdAt,
    };
  });
}
