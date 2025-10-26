import React, { useState } from "react";
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
} from "../../../src/components/ai-elements/task";
import { CheckCircle2, Circle, AlertCircle, Loader } from "lucide-react";

interface PlanStep {
  id: number;
  title: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  description?: string;
}

interface Plan {
  steps: PlanStep[];
}

interface PlanProgressProps {
  plan: Plan | null;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "in-progress":
      return <Loader className="size-4 text-blue-500 animate-spin" />;
    case "failed":
      return <AlertCircle className="size-4 text-red-500" />;
    case "pending":
    default:
      return <Circle className="size-4 text-gray-400" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Pending";
  }
};

export function PlanProgress({ plan }: PlanProgressProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!plan || !plan.steps || plan.steps.length === 0) {
    return null;
  }

  const completed = plan.steps.filter((s) => s.status === "completed").length;
  const total = plan.steps.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="w-full space-y-2">
      <Task defaultOpen={isOpen}>
        <TaskTrigger
          title={`Plan Progress: ${completed}/${total} (${progress}%)`}
          onClick={() => setIsOpen(!isOpen)}
        />
        <TaskContent>
          <div className="space-y-3">
            {plan.steps.map((step) => (
              <TaskItem key={step.id}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {step.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getStatusText(step.status)}
                      </span>
                    </div>
                    {step.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </TaskItem>
            ))}
          </div>
        </TaskContent>
      </Task>
    </div>
  );
}
