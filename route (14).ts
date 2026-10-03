import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, tasks } from "@/db/schema";
import { ensureFixedGame, originalTaskFor } from "@/lib/fixed-game";

export const dynamic = "force-dynamic";

/** Deshace las ediciones de una prueba y la devuelve al texto del plan fijo. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Id inválido" }, { status: 400 });
  }

  const game = await ensureFixedGame();

  const rows = await db
    .select({ task: tasks, playerSlot: players.slot })
    .from(tasks)
    .innerJoin(players, eq(tasks.playerId, players.id))
    .where(and(eq(tasks.id, taskId), eq(tasks.gameId, game.id)))
    .limit(1);

  const row = rows[0];
  if (!row) return Response.json({ error: "Prueba no encontrada" }, { status: 404 });

  const original = originalTaskFor(row.playerSlot, row.task.stepIndex);
  if (!original) {
    return Response.json({ error: "Esta prueba no existe en el plan fijo." }, { status: 404 });
  }

  // En el plan fijo el objetivo social se guarda como número de jugador (slot);
  // en la base de datos hay que usar su id real.
  let meta = original.meta;
  if (original.meta.profile) {
    const target = await db
      .select({ id: players.id })
      .from(players)
      .where(
        and(eq(players.gameId, game.id), eq(players.slot, original.meta.profile.targetPlayerId)),
      )
      .limit(1);
    if (!target[0]) {
      return Response.json({ error: "No se encontró el jugador objetivo." }, { status: 404 });
    }
    meta = { ...original.meta, profile: { ...original.meta.profile, targetPlayerId: target[0].id } };
  }

  const [updated] = await db
    .update(tasks)
    .set({
      title: original.title,
      prompt: original.prompt,
      answer: original.answer,
      hint: original.hint,
      judgeNote: original.judgeNote,
      meta,
      needsSetup: original.needsSetup,
    })
    .where(eq(tasks.id, taskId))
    .returning();

  return Response.json({
    ok: true,
    task: {
      id: updated.id,
      title: updated.title,
      prompt: updated.prompt,
      answer: updated.answer,
      hint: updated.hint,
      judgeNote: updated.judgeNote,
      needsSetup: updated.needsSetup,
      meta: updated.meta,
    },
  });
}
