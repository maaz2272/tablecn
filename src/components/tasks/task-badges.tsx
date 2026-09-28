import {
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleX,
  ArrowDown,
  ArrowRight,
  ArrowUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TaskLabel, TaskPriority, TaskStatus } from "@/types";

export const statusIcons: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  todo: CircleDashed,
  "in-progress": Circle,
  done: CheckCircle2,
  canceled: CircleX,
};

export const priorityIcons: Record<TaskPriority, React.ComponentType<{ className?: string }>> = {
  low: ArrowDown,
  medium: ArrowRight,
  high: ArrowUp,
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const Icon = statusIcons[status];
  return (
    <Badge variant="outline" className="capitalize">
      <Icon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
      {status.replace("-", " ")}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const Icon = priorityIcons[priority];
  return (
    <Badge variant="outline" className="capitalize">
      <Icon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
      {priority}
    </Badge>
  );
}

export function LabelBadge({ label }: { label: TaskLabel }) {
  return (
    <Badge variant="secondary" className="capitalize">
      {label}
    </Badge>
  );
}
