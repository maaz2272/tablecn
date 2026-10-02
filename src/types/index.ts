export type TaskStatus = "todo" | "in-progress" | "done" | "canceled";
export type TaskLabel = "bug" | "feature" | "enhancement" | "documentation";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  code: string;
  title: string;
  status: TaskStatus;
  label: TaskLabel;
  priority: TaskPriority;
  estimatedHours: number;
  archived: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SortItem {
  id: string;
  desc: boolean;
}

export type FilterVariant =
  | "text"
  | "number"
  | "range"
  | "date"
  | "dateRange"
  | "select"
  | "multiSelect"
  | "boolean";

export type FilterOperator =
  | "iLike"
  | "notILike"
  | "eq"
  | "ne"
  | "inArray"
  | "notInArray"
  | "isBetween"
  | "isRelativeToToday"
  | "isEmpty"
  | "isNotEmpty"
  | "lt"
  | "lte"
  | "gt"
  | "gte";

export interface FilterItem {
  id: string;
  value: string | string[];
  variant: FilterVariant;
  operator: FilterOperator;
  filterId?: string;
}

export interface TasksQuery {
  page: number;
  perPage: number;
  sort: SortItem[];
  filters: FilterItem[];
  joinOperator: "and" | "or";
  title?: string;
  status?: string;
  label?: string;
  priority?: string;
  from?: string;
  to?: string;
}

export interface TasksResponse {
  data: Task[];
  pageCount: number;
  total: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface FacetsResponse {
  status: FacetCount[];
  label: FacetCount[];
  priority: FacetCount[];
}
