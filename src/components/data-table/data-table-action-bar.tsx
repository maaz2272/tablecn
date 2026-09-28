"use client";

import type { Table } from "@tanstack/react-table";
import { Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportTableToCSV } from "@/lib/export";

interface DataTableActionBarProps<TData extends { id: string }> {
  table: Table<TData>;
  onDelete: (ids: string[]) => void;
  onUpdateStatus: (ids: string[], status: string) => void;
  isPending?: boolean;
}

export function DataTableActionBar<TData extends { id: string }>({
  table,
  onDelete,
  onUpdateStatus,
  isPending,
}: DataTableActionBarProps<TData>) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const ids = rows.map((r) => r.original.id);

  if (rows.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-2 rounded-lg border bg-background/95 backdrop-blur p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
      <span className="whitespace-nowrap px-2 text-xs font-semibold text-foreground">
        {rows.length} selected
      </span>
      <Separator orientation="vertical" className="h-5" />
      <Select onValueChange={(value) => onUpdateStatus(ids, value)}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Update status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo" className="text-xs">Todo</SelectItem>
          <SelectItem value="in-progress" className="text-xs">In Progress</SelectItem>
          <SelectItem value="done" className="text-xs">Done</SelectItem>
          <SelectItem value="canceled" className="text-xs">Canceled</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => exportTableToCSV(table, { onlySelected: true })}
      >
        <Download className="h-3.5 w-3.5 text-blue-500" />
        Export
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="h-8 text-xs gap-1.5"
        disabled={isPending}
        onClick={() => onDelete(ids)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
      <Separator orientation="vertical" className="h-5" />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => table.toggleAllRowsSelected(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
