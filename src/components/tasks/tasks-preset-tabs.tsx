"use client";

import * as React from "react";
import { useQueryState } from "nuqs";
import { tasksSearchParams } from "@/lib/search-params";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { FacetsResponse } from "@/types";

interface TasksPresetTabsProps {
  facets?: FacetsResponse;
  total?: number;
}

export function TasksPresetTabs({ facets, total = 0 }: TasksPresetTabsProps) {
  const [status, setStatus] = useQueryState(
    "status",
    tasksSearchParams.status.withOptions({ shallow: false })
  );
  const [priority, setPriority] = useQueryState(
    "priority",
    tasksSearchParams.priority.withOptions({ shallow: false })
  );

  const activeTab = React.useMemo(() => {
    if (status === "in-progress") return "in-progress";
    if (status === "done") return "done";
    if (status === "todo") return "todo";
    if (priority === "high") return "high-priority";
    return "all";
  }, [status, priority]);

  const handleTabChange = (val: string) => {
    if (val === "all") {
      setStatus(null);
      setPriority(null);
    } else if (val === "in-progress") {
      setStatus("in-progress");
      setPriority(null);
    } else if (val === "done") {
      setStatus("done");
      setPriority(null);
    } else if (val === "todo") {
      setStatus("todo");
      setPriority(null);
    } else if (val === "high-priority") {
      setStatus(null);
      setPriority("high");
    }
  };

  const statusMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    facets?.status?.forEach((s) => (map[s.value] = s.count));
    return map;
  }, [facets]);

  const priorityMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    facets?.priority?.forEach((p) => (map[p.value] = p.count));
    return map;
  }, [facets]);

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="h-9 bg-muted/60 p-1 flex-wrap">
        <TabsTrigger value="all" className="text-xs px-3 gap-1.5">
          All Tasks
          <Badge variant="secondary" className="px-1 text-[10px] rounded-sm font-mono">
            {total}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="in-progress" className="text-xs px-3 gap-1.5">
          In Progress
          <Badge variant="secondary" className="px-1 text-[10px] rounded-sm font-mono">
            {statusMap["in-progress"] ?? 0}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="todo" className="text-xs px-3 gap-1.5">
          Todo
          <Badge variant="secondary" className="px-1 text-[10px] rounded-sm font-mono">
            {statusMap["todo"] ?? 0}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="high-priority" className="text-xs px-3 gap-1.5">
          High Priority
          <Badge variant="secondary" className="px-1 text-[10px] rounded-sm font-mono">
            {priorityMap["high"] ?? 0}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="done" className="text-xs px-3 gap-1.5">
          Done
          <Badge variant="secondary" className="px-1 text-[10px] rounded-sm font-mono">
            {statusMap["done"] ?? 0}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
