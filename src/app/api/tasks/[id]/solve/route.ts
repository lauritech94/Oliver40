import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { markTaskSolved } from "@/lib/solve";

export const dynamic = "force-dynamic";

/** Validación manual por parte del juez; no existe PIN de partida. */
export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) return Response.json({ error: "Id inválido" }, { status: 400 });

  const game = await ensureFixedGame();
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.gameId, game.id)))
    .limit(1);
  const task = rows[0];
  if (!task) return Response.json({ error: "Tarjeta no encontrada" }, { status: 404 });

  return Response.json(await markTaskSolved(task, true));
}
