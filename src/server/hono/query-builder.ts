import {
  and,
  or,
  eq,
  ne,
  ilike,
  notIlike,
  inArray,
  notInArray,
  gte,
  lte,
  gt,
  lt,
  between,
  isNull,
  isNotNull,
  asc,
  desc,
  type SQL,
} from "drizzle-orm";
import { tasks } from "../db/schema";
import type { z } from "zod";
import type { filterItemSchema, getTasksQuerySchema } from "./validators";
import { getWhitelistedColumn } from "../db/repository/postgres-task-repository";

type FilterItem = z.infer<typeof filterItemSchema>;

/** Translate a single advanced-filter item into a Drizzle SQL condition safely using whitelisted columns. */
export function buildFilterCondition(filter: FilterItem): SQL | undefined {
  const column = getWhitelistedColumn(filter.id) as any;
  if (!column) return undefined;

  const value = filter.value;

  switch (filter.operator) {
    case "iLike":
      return typeof value === "string"
        ? ilike(column, `%${value}%`)
        : undefined;
    case "notILike":
      return typeof value === "string"
        ? notIlike(column, `%${value}%`)
        : undefined;
    case "eq":
      if (Array.isArray(value)) return undefined;
      return eq(column, value);
    case "ne":
      if (Array.isArray(value)) return undefined;
      return ne(column, value);
    case "inArray": {
      const arr = Array.isArray(value) ? value : String(value).split(",");
      return arr.length ? inArray(column, arr) : undefined;
    }
    case "notInArray": {
      const arr = Array.isArray(value) ? value : String(value).split(",");
      return arr.length ? notInArray(column, arr) : undefined;
    }
    case "lt":
      return lt(column, value);
    case "lte":
      return lte(column, value);
    case "gt":
      return gt(column, value);
    case "gte":
      return gte(column, value);
    case "isBetween": {
      const [start, end] = Array.isArray(value) ? value : String(value).split(",");
      if (!start || !end) return undefined;
      const isDateColumn = filter.variant === "date" || filter.variant === "dateRange";
      const startVal = isDateColumn ? new Date(Number(start)) : Number(start);
      const endVal = isDateColumn ? new Date(Number(end)) : Number(end);
      return between(column, startVal, endVal as any);
    }
    case "isEmpty":
      return isNull(column);
    case "isNotEmpty":
      return isNotNull(column);
    case "isRelativeToToday": {
      if (typeof value !== "string") return undefined;
      const days = Number(value);
      const date = new Date();
      date.setDate(date.getDate() + days);
      return gte(column, date);
    }
    default:
      return undefined;
  }
}

/** Build the combined WHERE clause for the tasks list query. */
export function buildTasksWhere(
  query: z.infer<typeof getTasksQuerySchema>
): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];

  if (query.title) {
    conditions.push(ilike(tasks.title, `%${query.title}%`));
  }
  if (query.status) {
    const values = query.status.split(",").filter(Boolean);
    if (values.length) conditions.push(inArray(tasks.status, values as any));
  }
  if (query.label) {
    const values = query.label.split(",").filter(Boolean);
    if (values.length) conditions.push(inArray(tasks.label, values as any));
  }
  if (query.priority) {
    const values = query.priority.split(",").filter(Boolean);
    if (values.length) conditions.push(inArray(tasks.priority, values as any));
  }
  if (query.from) {
    conditions.push(gte(tasks.createdAt, new Date(query.from)));
  }
  if (query.to) {
    conditions.push(lte(tasks.createdAt, new Date(query.to)));
  }

  if (query.filters?.length) {
    const advanced = query.filters
      .map(buildFilterCondition)
      .filter((c): c is SQL => Boolean(c));

    if (advanced.length) {
      conditions.push(
        query.joinOperator === "or" ? or(...advanced) : and(...advanced)
      );
    }
  }

  const finalConditions = conditions.filter((c): c is SQL => Boolean(c));
  if (!finalConditions.length) return undefined;
  return and(...finalConditions);
}

/** Build ORDER BY clauses from the sort param safely using whitelisted columns. */
export function buildTasksOrderBy(query: z.infer<typeof getTasksQuerySchema>) {
  if (!query.sort?.length) {
    return [desc(tasks.createdAt)];
  }
  return query.sort
    .map((s) => {
      const column = getWhitelistedColumn(s.id);
      if (!column) return null;
      return s.desc ? desc(column) : asc(column);
    })
    .filter((c): c is SQL => Boolean(c));
}
