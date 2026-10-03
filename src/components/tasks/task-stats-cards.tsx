"use client";

import { CheckCircle2, Clock, Flame, ListTodo } from "lucide-react";
import type { Task, FacetsResponse } from "@/types";

interface TaskStatsCardsProps {
  facets?: FacetsResponse;
  totalTasks?: number;
  data?: Task[];
}

export function TaskStatsCards({
  facets,
  totalTasks = 0,
  data = [],
}: TaskStatsCardsProps) {
  const statusCounts: Record<string, number> = {};
  facets?.status?.forEach((s) => {
    statusCounts[s.value] = s.count;
  });

  const priorityCounts: Record<string, number> = {};
  facets?.priority?.forEach((p) => {
    priorityCounts[p.value] = p.count;
  });

  const inProgress = statusCounts["in-progress"] ?? 0;
  const done = statusCounts["done"] ?? 0;
  const highPriority = priorityCounts["high"] ?? 0;
  const totalEstHours = data.reduce((acc, curr) => acc + (curr.estimatedHours ?? 0), 0);

  const cards = [
    {
      title: "Total Tasks",
      value: totalTasks,
      subtext: `${done} completed`,
      icon: ListTodo,
      color: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      title: "In Progress",
      value: inProgress,
      subtext: `${totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0}% of active workload`,
      icon: Clock,
      color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      title: "High Priority",
      value: highPriority,
      subtext: "Requires immediate attention",
      icon: Flame,
      color: "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20",
    },
    {
      title: "Est. Hours (Page)",
      value: `${totalEstHours}h`,
      subtext: `Avg ${data.length > 0 ? Math.round(totalEstHours / data.length) : 0}h per task`,
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              <p className="text-[11px] text-muted-foreground">{card.subtext}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${card.color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
