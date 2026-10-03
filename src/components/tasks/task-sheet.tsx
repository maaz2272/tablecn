"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createTask, updateTask } from "@/app/actions/tasks";
import type { Task, TaskStatus, TaskPriority, TaskLabel } from "@/types";

interface TaskSheetProps {
  task?: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskSheet({ task, open, onOpenChange }: TaskSheetProps) {
  const [isPending, startTransition] = React.useTransition();
  const [form, setForm] = React.useState({
    title: task?.title ?? "",
    status: task?.status ?? "todo",
    label: task?.label ?? "bug",
    priority: task?.priority ?? "medium",
    estimatedHours: task?.estimatedHours ?? 0,
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        title: task?.title ?? "",
        status: task?.status ?? "todo",
        label: task?.label ?? "bug",
        priority: task?.priority ?? "medium",
        estimatedHours: task?.estimatedHours ?? 0,
      });
    }
  }, [open, task]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = task
        ? await updateTask(task.id, form)
        : await createTask(form);

      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(task ? "Task updated" : "Task created");
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>{task ? "Edit task" : "Create task"}</SheetTitle>
            <SheetDescription>
              {task
                ? "Make changes to this task."
                : "Add a new task to the list."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                required
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Do something..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as TaskPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Select
                  value={form.label}
                  onValueChange={(v) => setForm((f) => ({ ...f, label: v as TaskLabel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="enhancement">Enhancement</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Est. hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min={0}
                  value={form.estimatedHours}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      estimatedHours: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : task ? "Save changes" : "Create task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
