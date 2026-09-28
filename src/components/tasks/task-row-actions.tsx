"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createTask, deleteTask } from "@/app/actions/tasks";
import type { Task } from "@/types";
import { TaskSheet } from "./task-sheet";

export function TaskRowActions({ task }: { task: Task }) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      const res = await createTask({
        title: `${task.title} (copy)`,
        status: task.status,
        label: task.label,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
      });
      if (res.error) toast.error(res.error);
      else toast.success("Task duplicated");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res.error) toast.error(res.error);
      else toast.success("Task deleted");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isPending} onSelect={handleDuplicate}>
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isPending}
            onSelect={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TaskSheet task={task} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </>
  );
}
