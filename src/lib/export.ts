import type { Table } from "@tanstack/react-table";

/**
 * Exports visible (or selected) rows of a TanStack table to a downloaded CSV file.
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: { filename?: string; onlySelected?: boolean } = {}
) {
  const { filename = "tasks", onlySelected = false } = opts;

  const columns = table
    .getAllColumns()
    .filter((c) => c.getIsVisible() && c.id !== "select" && c.id !== "actions");

  const headers = columns.map((c) => c.id);

  const rows = (
    onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getFilteredRowModel().rows
  ).map((row) =>
    columns
      .map((column) => {
        const value = row.getValue(column.id);
        const cell = typeof value === "string" ? value : JSON.stringify(value ?? "");
        return `"${cell.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports visible (or selected) rows of a TanStack table to a downloaded JSON file.
 */
export function exportTableToJSON<TData>(
  table: Table<TData>,
  opts: { filename?: string; onlySelected?: boolean } = {}
) {
  const { filename = "tasks", onlySelected = false } = opts;

  const selectedRows = onlySelected
    ? table.getFilteredSelectedRowModel().rows
    : table.getFilteredRowModel().rows;

  const data = selectedRows.map((r) => r.original);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
