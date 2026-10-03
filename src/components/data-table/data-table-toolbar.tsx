"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Download, RefreshCw, X, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableAdvancedFilter } from "./data-table-advanced-filter";
import { exportTableToCSV, exportTableToJSON } from "@/lib/export";
import { seedTasksAction } from "@/app/actions/tasks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FacetsResponse } from "@/types";

const statusOptions = [
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
  { label: "Canceled", value: "canceled" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const labelOptions = [
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
  { label: "Enhancement", value: "enhancement" },
  { label: "Documentation", value: "documentation" },
];

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  facets?: FacetsResponse;
}

export function DataTableToolbar<TData>({
  table,
  facets,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [isSeedPending, startSeedTransition] = React.useTransition();

  function withCounts(
    options: { label: string; value: string }[],
    facet?: { value: string; count: number }[]
  ) {
    return options.map((opt) => ({
      ...opt,
      count: facet?.find((f) => f.value === opt.value)?.count,
    }));
  }

  const handleSeed = () => {
    startSeedTransition(async () => {
      try {
        await seedTasksAction();
        toast.success("Dataset re-seeded successfully!");
      } catch {
        toast.error("Failed to re-seed dataset.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 p-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[240px]"
        />

        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={withCounts(statusOptions, facets?.status)}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={withCounts(priorityOptions, facets?.priority)}
          />
        )}
        {table.getColumn("label") && (
          <DataTableFacetedFilter
            column={table.getColumn("label")}
            title="Label"
            options={withCounts(labelOptions, facets?.label)}
          />
        )}

        <DataTableAdvancedFilter />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3 text-xs"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={handleSeed}
          disabled={isSeedPending}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSeedPending && "animate-spin")} />
          <span>Reset Data</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => exportTableToCSV(table)}>
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Export CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportTableToJSON(table)}>
              <FileJson className="mr-2 h-4 w-4 text-blue-600" />
              <span>Export JSON</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
