import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";

export const dynamic = "force-dynamic";

/** Campos que se pueden editar desde /judge/edit. */
// Sin campo de pista: ninguna prueba debe poder tener ayuda.
const EDITABLE = ["title", "prompt", "answer", "judgeNote"] as const;

/**
 * Edita una prueba concreta de la partida fija.
 * Guardar aquí NO cambia los recorridos ni los números de tarjeta:
 * solo el texto de la pregunta y su respuesta.
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return Response.json({ error: "Id inválido" }, { status: 400 });
  }

  const game = await ensureFixedGame();
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.gameId, game.id)))
    .limit(1);
  const task = rows[0];
  if (!task) return Response.json({ error: "Prueba no encontrada" }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, string | boolean> = {};

  for (const field of EDITABLE) {
    const value = body[field];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    // Una prueba social puede quedarse sin respuesta fija: volvería a usar la ficha.
    // Cualquier otra prueba necesita respuesta, si no sería imposible de superar.
    if (field === "answer" && !trimmed && !task.meta?.profile) continue;
    patch[field] = trimmed;
  }

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "Nada que guardar" }, { status: 400 });
  }

  // La respuesta fija tiene prioridad sobre la ficha; si se vacía, vuelve a la ficha.
  if (task.meta?.profile && typeof patch.answer === "string") {
    patch.needsSetup = patch.answer === "";
  }

  // Marca la prueba como editada: así se conserva aunque cambie la versión del plan.
  patch.edited = true;

  const [updated] = await db.update(tasks).set(patch).where(eq(tasks.id, taskId)).returning();

  return Response.json({
    ok: true,
    task: {
      id: updated.id,
      title: updated.title,
      prompt: updated.prompt,
      answer: updated.answer,
      judgeNote: updated.judgeNote,
      needsSetup: updated.needsSetup,
      meta: updated.meta,
    },
  });
}
