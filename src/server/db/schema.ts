import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
  integer,
} from "drizzle-orm/pg-core";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in-progress",
  "done",
  "canceled",
]);

export const taskLabelEnum = pgEnum("task_label", [
  "bug",
  "feature",
  "enhancement",
  "documentation",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id", { length: 30 }).primaryKey(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    title: text("title").notNull(),
    status: taskStatusEnum("status").notNull().default("todo"),
    label: taskLabelEnum("label").notNull().default("bug"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    estimatedHours: integer("estimated_hours").notNull().default(0),
    archived: integer("archived").notNull().default(0), // 0 = false, 1 = true (portable across pg/mysql)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("tasks_status_idx").on(table.status),
    labelIdx: index("tasks_label_idx").on(table.label),
    priorityIdx: index("tasks_priority_idx").on(table.priority),
    createdAtIdx: index("tasks_created_at_idx").on(table.createdAt),
  })
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
