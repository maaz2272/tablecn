"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskSheet } from "./task-sheet";

export function NewTaskButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New task
      </Button>
      <TaskSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
