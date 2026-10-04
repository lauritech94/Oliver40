import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks, type Task } from "@/db/schema";
import { getTaskByCard, resolveExpected } from "@/lib/queries";
import { getCurrentTask, markTaskSolved } from "@/lib/solve";
import { getCurrentPlayer } from "@/lib/session";
import { answersMatch } from "@/lib/utils";
import { CHALLENGE_TYPES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

async function loadContext(cardParam: string) {
  const cardNumber = Number(cardParam);
  const session = await getCurrentPlayer();
  if (!session) {
    return { error: Response.json({ state: "no-session" }, { status: 401 }) } as const;
  }
  if (!Number.isInteger(cardNumber)) {
    return { error: Response.json({ state: "bad-card" }, { status: 400 }) } as const;
  }
  const { player, game } = session;
  if (game.status !== "running") {
    return {
      error: Response.json({ state: "not-started", game: game.name }, { status: 409 }),
    } as const;
  }
  const task = await getTaskByCard(game.id, cardNumber);
  return { player, game, task, cardNumber } as const;
}

export async function GET(_request: Request, ctx: { params: Promise<{ card: string }> }) {
  const { card } = await ctx.params;
  const context = await loadContext(card);
  if ("error" in context) return context.error;

  const { player, task, cardNumber } = context;
  const current = await getCurrentTask(player.id, player.currentStep);

  const base = {
    player: { name: player.name, emoji: player.emoji, currentStep: player.currentStep },
    yourCard: current?.cardNumber ?? null,
    cardNumber,
  };

  if (!task) return Response.json({ ...base, state: "unknown-card" });
  if (task.playerId !== player.id) return Response.json({ ...base, state: "not-yours" });
  if (task.solvedAt) return Response.json({ ...base, state: "already-solved" });
  if (task.stepIndex !== player.currentStep) {
    return Response.json({ ...base, state: "out-of-order" });
  }

  if (!task.openedAt) {
    await db.update(tasks).set({ openedAt: new Date() }).where(eq(tasks.id, task.id));
  }

  return Response.json({
    ...base,
    state: "active",
    task: publicTask(task),
    totalSteps: CHALLENGE_TYPES.length,
  });
}

export async function POST(request: Request, ctx: { params: Promise<{ card: string }> }) {
  const { card } = await ctx.params;
  const context = await loadContext(card);
  if ("error" in context) return context.error;

  const { player, task } = context;
  if (!task || task.playerId !== player.id) {
    return Response.json({ state: "not-yours" }, { status: 403 });
  }
  if (task.solvedAt) return Response.json({ state: "already-solved" }, { status: 409 });
  if (task.stepIndex !== player.currentStep) {
    return Response.json({ state: "out-of-order" }, { status: 409 });
  }

  const body = (await request.json()) as { answer?: string; action?: string };

  if (body.action === "memorize") {
    const memo = task.meta?.memorize;
    if (!memo) return Response.json({ error: "Esta prueba no tiene secuencia" }, { status: 400 });
    await db
      .update(tasks)
      .set({ peeks: sql`${tasks.peeks} + 1` })
      .where(eq(tasks.id, task.id));
    return Response.json({ text: memo.text, seconds: memo.seconds });
  }

  if (body.action === "complete-minigame") {
    if (!task.meta?.minigame) {
      return Response.json({ error: "Esta prueba no es un minijuego." }, { status: 400 });
    }
    const result = await markTaskSolved(task, false);
    return Response.json({ correct: true, ...result });
  }

  const answer = (body.answer ?? "").trim();
  const expected = await resolveExpected(task);
  if (!expected) {
    // La ficha del otro jugador está vacía: no se puede comprobar.
    return Response.json({ correct: false, pending: true });
  }

  await db
    .update(tasks)
    .set({ attempts: sql`${tasks.attempts} + 1` })
    .where(eq(tasks.id, task.id));

  if (!answersMatch(answer, expected)) {
    return Response.json({ correct: false, attempts: task.attempts + 1 });
  }

  const result = await markTaskSolved(task, false);
  return Response.json({ correct: true, ...result });
}

/** Lo que ve el jugador: nunca incluye la respuesta ni el texto de memoria. */
function publicTask(task: Task) {
  return {
    id: task.id,
    stepIndex: task.stepIndex,
    cardNumber: task.cardNumber,
    typeSlug: task.typeSlug,
    typeName: task.typeName,
    icon: task.icon,
    title: task.title,
    prompt: task.prompt,

    requiresJudge: task.requiresJudge,
    attempts: task.attempts,
    nonogram: task.meta?.nonogram ?? null,
    puzzle: task.meta?.puzzle
      ? { ...task.meta.puzzle, image: `/api/puzzle-image/${task.id}`, word: task.answer.split("|")[0] }
      : null,
    minigame: task.meta?.minigame ?? null,
    memorize: task.meta?.memorize ? { seconds: task.meta.memorize.seconds } : null,
  };
}
