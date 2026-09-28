import {
  createParser,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  createSearchParamsCache,
} from "nuqs/server";
import type { FilterItem, SortItem } from "@/types";

const parseAsSort = createParser<SortItem[]>({
  parse(value) {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value);
  },
});

const parseAsFilters = createParser<FilterItem[]>({
  parse(value) {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  },
  serialize(value) {
    return JSON.stringify(value);
  },
});

export const tasksSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsSort.withDefault([{ id: "createdAt", desc: true }]),
  filters: parseAsFilters.withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  title: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  label: parseAsString.withDefault(""),
  priority: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
};

export const tasksSearchParamsCache = createSearchParamsCache(tasksSearchParams);
