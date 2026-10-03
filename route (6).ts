import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, minigameScores, players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";

export const dynamic = "force-dynamic";

/**
 * Conserva las 420 pruebas fijas; reinicia solo el progreso para hacer ensayos.
 *
 * El borrado de marcas de la fase final es tolerante: si esa tabla aún no existe
 * (porque todavía no se ha vuelto a pulsar «/setup» tras un despliegue), el
 * reinicio principal NO se rompe.
 */
export async function POST() {
  try {
    const game = await ensureFixedGame();

    await db.transaction(async (tx) => {
      await tx
        .update(tasks)
        .set({
          attempts: 0,
          peeks: 0,
          hintUsed: false,
          openedAt: null,
          solvedAt: null,
          solvedByJudge: false,
        })
        .where(eq(tasks.gameId, game.id));
      await tx
        .update(players)
        .set({ currentStep: 0, startedAt: new Date(), finishedAt: null })
        .where(eq(players.gameId, game.id));
      await tx
        .update(games)
        .set({ status: "running", startedAt: new Date() })
        .where(eq(games.id, game.id));
    });

    // Aparte, para que un fallo aquí no tumbe el reinicio de arriba.
    let clearedScores = true;
    try {
      await db.delete(minigameScores).where(eq(minigameScores.gameId, game.id));
    } catch {
      clearedScores = false;
    }

    return Response.json({
      ok: true,
      clearedScores,
      message: clearedScores
        ? "Progreso y marcas de la fase final reiniciados. El recorrido fijo no ha cambiado."
        : "Progreso reiniciado. La tabla de minijuegos aún no existe: vuelve a pulsar «Preparar base de datos» en /setup.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al reiniciar";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
