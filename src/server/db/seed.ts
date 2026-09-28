import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tasks, taskLabelEnum, taskPriorityEnum, taskStatusEnum } from "./schema";

// Tiny inline nanoid-like generator so we don't need an extra dependency.
function generateId(prefix: string, len = 12) {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}_${out}`;
}

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

const STATUSES = taskStatusEnum.enumValues;
const LABELS = taskLabelEnum.enumValues;
const PRIORITIES = taskPriorityEnum.enumValues;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const sql = postgres(connectionString, { max: 1, ssl: "require" });
  const db = drizzle(sql);

  const COUNT = Number(process.env.SEED_COUNT ?? 500);
  console.log(`Seeding ${COUNT} tasks...`);

  const rows = Array.from({ length: COUNT }).map((_, i) => {
    const daysAgo = Math.floor(Math.random() * 180);
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    return {
      id: generateId("task"),
      code: `TASK-${1000 + i}`,
      title: `${pick(TITLES)} #${i + 1}`,
      status: pick(STATUSES),
      label: pick(LABELS),
      priority: pick(PRIORITIES),
      estimatedHours: Math.floor(Math.random() * 40),
      archived: Math.random() < 0.05 ? 1 : 0,
      createdAt,
      updatedAt: createdAt,
    };
  });

  // Insert in chunks to avoid parameter limits.
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(tasks).values(rows.slice(i, i + CHUNK));
    console.log(`Inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  console.log("Done.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
