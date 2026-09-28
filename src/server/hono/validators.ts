import { z } from "zod";

export const sortItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum([
    "text",
    "number",
    "range",
    "date",
    "dateRange",
    "select",
    "multiSelect",
    "boolean",
  ]),
  operator: z.enum([
    "iLike",
    "notILike",
    "eq",
    "ne",
    "inArray",
    "notInArray",
    "isBetween",
    "isRelativeToToday",
    "isEmpty",
    "isNotEmpty",
    "lt",
    "lte",
    "gt",
    "gte",
  ]),
  filterId: z.string().optional(),
});

export const getTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
  sort: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [] as { id: string; desc: boolean }[];
      try {
        const parsed = JSON.parse(val);
        return z.array(sortItemSchema).parse(parsed);
      } catch {
        return [];
      }
    }),
  filters: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [] as z.infer<typeof filterItemSchema>[];
      try {
        const parsed = JSON.parse(val);
        return z.array(filterItemSchema).parse(parsed);
      } catch {
        return [];
      }
    }),
  joinOperator: z.enum(["and", "or"]).default("and"),
  title: z.string().optional(),
  status: z.string().optional(), // comma separated
  label: z.string().optional(), // comma separated
  priority: z.string().optional(), // comma separated
  from: z.string().optional(),
  to: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "in-progress", "done", "canceled"]).default("todo"),
  label: z
    .enum(["bug", "feature", "enhancement", "documentation"])
    .default("bug"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedHours: z.coerce.number().int().min(0).max(1000).default(0),
});

export const updateTaskSchema = createTaskSchema.partial();

export const deleteTasksSchema = z.object({
  ids: z.array(z.string()).min(1),
});
