"use client";

import * as React from "react";
import { useQueryState } from "nuqs";
import { Plus, Trash2, SlidersHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { tasksSearchParams } from "@/lib/search-params";
import type { FilterItem, FilterVariant, FilterOperator } from "@/types";

const COLUMN_OPTIONS = [
  { label: "Title", value: "title", type: "text" },
  { label: "Status", value: "status", type: "select" },
  { label: "Priority", value: "priority", type: "select" },
  { label: "Label", value: "label", type: "select" },
  { label: "Est. Hours", value: "estimatedHours", type: "number" },
];

const OPERATORS_BY_TYPE: Record<
  string,
  { label: string; value: FilterItem["operator"] }[]
> = {
  text: [
    { label: "contains", value: "iLike" },
    { label: "does not contain", value: "notILike" },
    { label: "equals", value: "eq" },
    { label: "is not equal to", value: "ne" },
    { label: "is empty", value: "isEmpty" },
    { label: "is not empty", value: "isNotEmpty" },
  ],
  select: [
    { label: "is", value: "eq" },
    { label: "is not", value: "ne" },
    { label: "in", value: "inArray" },
    { label: "not in", value: "notInArray" },
  ],
  number: [
    { label: "equals", value: "eq" },
    { label: "is not equal", value: "ne" },
    { label: "greater than", value: "gt" },
    { label: "greater or equal", value: "gte" },
    { label: "less than", value: "lt" },
    { label: "less or equal", value: "lte" },
  ],
};

const VALUE_OPTIONS: Record<string, { label: string; value: string }[]> = {
  status: [
    { label: "Todo", value: "todo" },
    { label: "In Progress", value: "in-progress" },
    { label: "Done", value: "done" },
    { label: "Canceled", value: "canceled" },
  ],
  priority: [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
  ],
  label: [
    { label: "Bug", value: "bug" },
    { label: "Feature", value: "feature" },
    { label: "Enhancement", value: "enhancement" },
    { label: "Documentation", value: "documentation" },
  ],
};

export function DataTableAdvancedFilter() {
  const [filters, setFilters] = useQueryState(
    "filters",
    tasksSearchParams.filters.withOptions({ shallow: false })
  );
  const [joinOperator, setJoinOperator] = useQueryState(
    "joinOperator",
    tasksSearchParams.joinOperator.withOptions({ shallow: false })
  );

  const [open, setOpen] = React.useState(false);

  const currentFilters = filters ?? [];

  const addFilterRule = () => {
    const defaultCol = COLUMN_OPTIONS[0];
    const newRule: FilterItem = {
      id: defaultCol.value,
      value: "",
      variant: defaultCol.type as FilterVariant,
      operator: "iLike",
      filterId: Math.random().toString(36).substring(2, 9),
    };
    setFilters([...currentFilters, newRule]);
  };

  const removeFilterRule = (index: number) => {
    const updated = [...currentFilters];
    updated.splice(index, 1);
    setFilters(updated.length > 0 ? updated : null);
  };

  const updateFilterRule = (index: number, updates: Partial<FilterItem>) => {
    const updated = [...currentFilters];
    const current = updated[index];
    if (!current) return;

    // If column changed, reset operator and value
    if (updates.id && updates.id !== current.id) {
      const colMeta = COLUMN_OPTIONS.find((c) => c.value === updates.id);
      const newVariant = (colMeta?.type ?? "text") as FilterVariant;
      const defaultOperator = OPERATORS_BY_TYPE[newVariant]?.[0]?.value ?? "eq";
      updated[index] = {
        ...current,
        id: updates.id,
        variant: newVariant,
        operator: defaultOperator,
        value: "",
      };
    } else {
      updated[index] = { ...current, ...updates };
    }
    setFilters(updated);
  };

  const clearAllFilters = () => {
    setFilters(null);
  };

  const activeCount = currentFilters.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filter</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 rounded-sm px-1 font-mono text-xs font-normal"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[480px] p-4" align="start">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Filter Rules</span>
            {activeCount > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                {activeCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 1 && (
              <Select
                value={joinOperator ?? "and"}
                onValueChange={(val: "and" | "or") => setJoinOperator(val)}
              >
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">AND</SelectItem>
                  <SelectItem value="or">OR</SelectItem>
                </SelectContent>
              </Select>
            )}
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {activeCount === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No filter conditions added yet. Click &quot;Add Condition&quot; below.
            </div>
          ) : (
            currentFilters.map((rule, idx) => {
              const colMeta = COLUMN_OPTIONS.find((c) => c.value === rule.id);
              const colType = colMeta?.type ?? "text";
              const operators = OPERATORS_BY_TYPE[colType] ?? [];
              const valueOptions = VALUE_OPTIONS[rule.id];

              return (
                <div
                  key={rule.filterId || idx}
                  className="flex items-center gap-2 rounded-md border p-2 bg-muted/20"
                >
                  {/* Column Select */}
                  <Select
                    value={rule.id}
                    onValueChange={(val) => updateFilterRule(idx, { id: val })}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_OPTIONS.map((col) => (
                        <SelectItem key={col.value} value={col.value} className="text-xs">
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operator Select */}
                  <Select
                    value={rule.operator}
                    onValueChange={(val: FilterOperator) =>
                      updateFilterRule(idx, { operator: val })
                    }
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value} className="text-xs">
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Value Input / Select */}
                  {rule.operator === "isEmpty" || rule.operator === "isNotEmpty" ? (
                    <div className="h-8 flex-1 flex items-center px-2 text-xs text-muted-foreground italic border rounded bg-background">
                      N/A
                    </div>
                  ) : valueOptions ? (
                    <Select
                      value={typeof rule.value === "string" ? rule.value : ""}
                      onValueChange={(val) => updateFilterRule(idx, { value: val })}
                    >
                      <SelectTrigger className="h-8 flex-1 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {valueOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={colType === "number" ? "number" : "text"}
                      placeholder="Value..."
                      value={typeof rule.value === "string" ? rule.value : ""}
                      onChange={(e) =>
                        updateFilterRule(idx, { value: e.target.value })
                      }
                      className="h-8 flex-1 text-xs"
                    />
                  )}

                  {/* Remove Rule */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeFilterRule(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={addFilterRule}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Condition
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => setOpen(false)}
          >
            <Check className="h-3.5 w-3.5" />
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
