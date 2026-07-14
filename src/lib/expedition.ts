import type { FieldTask } from "@/lib/types";

type TaskProgress = Pick<FieldTask, "progress" | "target">;

export function getExpeditionProgress(tasks: TaskProgress[]): number {
  if (tasks.length === 0) return 0;

  const combinedPercent = tasks.reduce((sum, task) => {
    if (task.target <= 0) return sum + 100;
    const progress = Math.min(Math.max(0, task.progress), task.target);
    return sum + (progress / task.target) * 100;
  }, 0);

  return Math.round(combinedPercent / tasks.length);
}
