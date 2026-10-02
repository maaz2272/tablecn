import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { tasksSearchParamsCache } from "@/lib/search-params";
import { getTaskFacets, getTasks } from "@/app/actions/tasks";
import { TasksTable } from "@/components/tasks/tasks-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskStatsCards } from "@/components/tasks/task-stats-cards";
import { TasksPresetTabs } from "@/components/tasks/tasks-preset-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface TasksPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function TasksPage(props: TasksPageProps) {
  const searchParams = await props.searchParams;
  const query = tasksSearchParamsCache.parse(searchParams ?? {});

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Tasks
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              v1.0
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            A full-stack, server-driven data table built with Next.js App Router, Hono, TanStack Table v8, & Shadcn UI.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <NewTaskButton />
        </div>
      </header>

      <Suspense key={JSON.stringify(query)} fallback={<DataTableSkeleton columnCount={9} />}>
        <TasksTableFetcher query={query} />
      </Suspense>
    </main>
  );
}

async function TasksTableFetcher({ query }: { query: any }) {
  const [tasksRes, facetsRes] = await Promise.all([
    getTasks(query),
    getTaskFacets(query),
  ]);

  if (tasksRes.error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Failed to load tasks from server</p>
          <p className="text-xs opacity-90">{tasksRes.error}</p>
        </div>
      </div>
    );
  }

  const data = tasksRes.data;
  const pageCount = tasksRes.pageCount;
  const total = tasksRes.total;
  const facets = facetsRes;

  return (
    <div className="flex flex-col gap-6">
      <TaskStatsCards facets={facets} totalTasks={total} data={data} />
      <TasksPresetTabs facets={facets} total={total} />
      <TasksTable data={data} pageCount={pageCount} facets={facets} />
    </div>
  );
}
