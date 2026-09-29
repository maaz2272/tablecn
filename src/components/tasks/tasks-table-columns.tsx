"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { StatusBadge, PriorityBadge, LabelBadge } from "@/components/tasks/task-badges";
import { TaskRowActions } from "@/components/tasks/task-row-actions";
import { formatDate } from "@/lib/utils";
import type { Task } from "@/types";

export const taskColumns: ColumnDef<Task>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "code",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Task" table={table} />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("code")}
      </span>
    ),
    size: 100,
  },
  {
    accessorKey: "title",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Title" table={table} />
    ),
    cell: ({ row }) => (
      <span className="max-w-[31.25rem] truncate font-medium">
        {row.getValue("title")}
      </span>
    ),
    size: 320,
    meta: { label: "Title", variant: "text" },
    enableColumnFilter: true,
  },
  {
    accessorKey: "status",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Status" table={table} />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value: string[]) =>
      value.includes(row.getValue(id)),
    size: 140,
  },
  {
    accessorKey: "label",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Label" table={table} />
    ),
    cell: ({ row }) => <LabelBadge label={row.getValue("label")} />,
    filterFn: (row, id, value: string[]) =>
      value.includes(row.getValue(id)),
    size: 140,
  },
  {
    accessorKey: "priority",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Priority" table={table} />
    ),
    cell: ({ row }) => <PriorityBadge priority={row.getValue("priority")} />,
    filterFn: (row, id, value: string[]) =>
      value.includes(row.getValue(id)),
    size: 130,
  },
  {
    accessorKey: "estimatedHours",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Est. Hours" table={table} />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{row.getValue("estimatedHours")}h</span>
    ),
    size: 100,
  },
  {
    accessorKey: "createdAt",
    header: ({ column, table }) => (
      <DataTableColumnHeader column={column} title="Created" table={table} />
    ),
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
    size: 120,
  },
  {
    id: "actions",
    cell: ({ row }) => <TaskRowActions task={row.original} />,
    size: 50,
    enableHiding: false,
  },
];
