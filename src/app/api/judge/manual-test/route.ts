import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { resolveExpected } from "@/lib/queries";
import { answersMatch } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Modo ensayo de jueces. No usa cookies de jugador y NO escribe progreso.
 * Las respuestas solo se entregan después de comprobar o pulsar «Ver respuesta».
 */
export async function GET() {
  try {
    const game = await ensureFixedGame();
    const [playerRows, taskRows] = await Promise.all([
      db.select().from(players).where(eq(players.gameId, game.id)).orderBy(asc(players.slot)),
      db
        .select()
        .from(tasks)
        .where(eq(tasks.gameId, game.id))
        .orderBy(asc(tasks.playerId), asc(tasks.stepIndex)),
    ]);

    return Response.json({
      planVersion: game.planVersion,
      players: playerRows.map((player) => ({
        id: player.id,
        slot: player.slot,
        name: player.name,
        emoji: player.emoji,
        tasks: taskRows
          .filter((task) => task.playerId === player.id)
          .map((task) => ({
            id: task.id,
            stepIndex: task.stepIndex,
            cardNumber: task.cardNumber,
            typeSlug: task.typeSlug,
            typeName: task.typeName,
            icon: task.icon,
            title: task.title,
            prompt: task.prompt,
            requiresJudge: task.requiresJudge,
            puzzle: task.meta.puzzle
              ? {
                  ...task.meta.puzzle,
                  image: `/api/puzzle-image/${task.id}`,
                  // La palabra no se envía: Puzzle la obtiene solo al completar.
                  word: `manual-puzzle-${task.id}`,
                }
              : null,
            minigame: task.meta.minigame ?? null,
            memory: task.meta.memorize
              ? { text: task.meta.memorize.text, seconds: task.meta.memorize.seconds }
              : null,
          })),
      })),
    });
  } catch (error) {
    console.error("No se pudo cargar el ensayo manual", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar el ensayo." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { taskId?: unknown; answer?: unknown; action?: unknown }
      | null;
    const taskId = Number(body?.taskId);
    if (!Number.isSafeInteger(taskId) || taskId < 1) {
      return Response.json({ error: "Prueba no válida." }, { status: 400 });
    }

    const game = await ensureFixedGame();
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.gameId, game.id)))
      .limit(1);
    if (!task) return Response.json({ error: "Prueba no encontrada." }, { status: 404 });

    const expected = await resolveExpected(task);
    if (!expected.trim()) {
      return Response.json({ error: "Esta prueba no tiene respuesta guardada. Edítala antes de probarla." }, { status: 409 });
    }

    if (body?.action === "reveal") {
      return Response.json({ ok: true, revealed: true, expected });
    }
    if (body?.action === "complete-puzzle") {
      if (!task.meta.puzzle) return Response.json({ error: "Esta prueba no es un puzzle." }, { status: 400 });
      return Response.json({ ok: true, correct: true, expected });
    }
    if (body?.action === "complete-minigame") {
      if (!task.meta.minigame) return Response.json({ error: "Esta prueba no es un minijuego." }, { status: 400 });
      return Response.json({ ok: true, correct: true, expected });
    }
    if (body?.action === "judge-pass") {
      if (!task.requiresJudge) return Response.json({ error: "Esta prueba no necesita juez." }, { status: 400 });
      return Response.json({ ok: true, correct: true, expected });
    }

    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
    if (!answer) return Response.json({ error: "Escribe una respuesta." }, { status: 400 });
    return Response.json({
      ok: true,
      correct: answersMatch(answer, expected),
      expected: answersMatch(answer, expected) ? expected : undefined,
    });
  } catch (error) {
    console.error("No se pudo comprobar la respuesta del ensayo", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo comprobar." },
      { status: 500 },
    );
  }
}
