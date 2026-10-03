import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, minigameScores, players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";

export const dynamic = "force-dynamic";

/** Conserva las 420 pruebas fijas; reinicia solamente el progreso para hacer ensayos. */
export async function POST() {
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
    await tx.delete(minigameScores).where(eq(minigameScores.gameId, game.id));
    await tx.update(games).set({ status: "running", startedAt: new Date() }).where(eq(games.id, game.id));
  });
  return Response.json({
    ok: true,
    message: "Progreso y marcas de la fase final reiniciados; el recorrido fijo no ha cambiado.",
  });
}
