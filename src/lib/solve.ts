import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, tasks, type Task } from "@/db/schema";
import { getPlayerTasks } from "./queries";

export type SolveResult = {
  solved: true;
  finished: boolean;
  nextCard: number | null;
  nextStep: number;
  totalSteps: number;
};

export async function markTaskSolved(task: Task, byJudge: boolean): Promise<SolveResult> {
  const now = new Date();
  if (!task.solvedAt) {
    await db
      .update(tasks)
      .set({ solvedAt: now, solvedByJudge: byJudge })
      .where(eq(tasks.id, task.id));
  }

  const allTasks = await getPlayerTasks(task.playerId);
  const totalSteps = allTasks.length;
  const nextPending = allTasks.find((t) => t.id !== task.id && !t.solvedAt);

  const nextStep = nextPending ? nextPending.stepIndex : totalSteps;
  const finished = !nextPending;

  await db
    .update(players)
    .set({ currentStep: nextStep, finishedAt: finished ? now : null })
    .where(eq(players.id, task.playerId));

  if (nextPending && !nextPending.openedAt) {
    await db.update(tasks).set({ openedAt: now }).where(eq(tasks.id, nextPending.id));
  }

  return {
    solved: true,
    finished,
    nextCard: nextPending ? nextPending.cardNumber : null,
    nextStep,
    totalSteps,
  };
}

export async function getCurrentTask(playerId: number, stepIndex: number): Promise<Task | null> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.playerId, playerId), eq(tasks.stepIndex, stepIndex)))
    .limit(1);
  return rows[0] ?? null;
}
