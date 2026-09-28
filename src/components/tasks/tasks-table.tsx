"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useQueryStates } from "nuqs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { taskColumns } from "./tasks-table-columns";
import { tasksSearchParams } from "@/lib/search-params";
import { bulkDeleteTasks, bulkUpdateTasks } from "@/app/actions/tasks";
import type { FacetsResponse, Task } from "@/types";

interface TasksTableProps {
  data: Task[];
  pageCount: number;
  facets: FacetsResponse;
}

export function TasksTable({ data, pageCount, facets }: TasksTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [params, setParams] = useQueryStates(tasksSearchParams, {
    shallow: false, // triggers a server round-trip so RSC re-fetches
    startTransition,
  });

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const sorting: SortingState = params.sort;
  const columnFilters: ColumnFiltersState = React.useMemo(() => {
    const filters: ColumnFiltersState = [];
    if (params.title) filters.push({ id: "title", value: params.title });
    if (params.status)
      filters.push({ id: "status", value: params.status.split(",") });
    if (params.label)
      filters.push({ id: "label", value: params.label.split(",") });
    if (params.priority)
      filters.push({ id: "priority", value: params.priority.split(",") });
    return filters;
  }, [params.title, params.status, params.label, params.priority]);

  const table = useReactTable({
    data: data ?? [],
    columns: taskColumns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: params.page - 1,
        pageSize: params.perPage,
      },
    },
    enableRowSelection: true,
    columnResizeMode: "onChange",
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      void setParams({ sort: next, page: 1 });
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(columnFilters) : updater;
      const getVal = (id: string) =>
        next.find((f) => f.id === id)?.value as string | string[] | undefined;

      const title = getVal("title");
      const status = getVal("status");
      const label = getVal("label");
      const priority = getVal("priority");

      void setParams({
        title: typeof title === "string" ? title : "",
        status: Array.isArray(status) ? status.join(",") : "",
        label: Array.isArray(label) ? label.join(",") : "",
        priority: Array.isArray(priority) ? priority.join(",") : "",
        page: 1,
      });
    },
    onPaginationChange: (updater) => {
      const current = { pageIndex: params.page - 1, pageSize: params.perPage };
      const next = typeof updater === "function" ? updater(current) : updater;
      void setParams({ page: next.pageIndex + 1, perPage: next.pageSize });
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  function handleBulkDelete(ids: string[]) {
    startTransition(async () => {
      const res = await bulkDeleteTasks(ids);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Deleted ${res.count} task(s)`);
        table.toggleAllRowsSelected(false);
        router.refresh();
      }
    });
  }

  function handleBulkStatus(ids: string[], status: string) {
    startTransition(async () => {
      const res = await bulkUpdateTasks(ids, { status });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Updated ${res.count} task(s)`);
        table.toggleAllRowsSelected(false);
        router.refresh();
      }
    });
  }

  return (
    <DataTable
      table={table}
      toolbar={
        <DataTableToolbar
          table={table}
          facets={facets}
        />
      }
      actionBar={
        <DataTableActionBar
          table={table}
          onDelete={handleBulkDelete}
          onUpdateStatus={handleBulkStatus}
          isPending={isPending}
        />
      }
    />
  );
}
