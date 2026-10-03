import { eq } from "drizzle-orm";
import { db } from "@/db";
import { minigameScores, players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";

export const dynamic = "force-dynamic";

export type RankingRow = {
  slot: number;
  name: string;
  emoji: string;
  solved: number;
  finishedAt: string | null;
  /** Milisegundos que ha tardado en completar las 15 pruebas (null si aún no). */
  mainTimeMs: number | null;
  reaccion: number | null;
  numeros: number | null;
  attempts: number;
};

export async function GET() {
  const game = await ensureFixedGame();

  const playerRows = await db
    .select()
    .from(players)
    .where(eq(players.gameId, game.id));

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.gameId, game.id));

  const scoreRows = await db
    .select()
    .from(minigameScores)
    .where(eq(minigameScores.gameId, game.id));

  const rows: RankingRow[] = playerRows.map((player) => {
    const mine = taskRows.filter((t) => t.playerId === player.id);
    const solved = mine.filter((t) => t.solvedAt).length;
    const mainTimeMs =
      player.startedAt && player.finishedAt
        ? new Date(player.finishedAt).getTime() - new Date(player.startedAt).getTime()
        : null;

    const mineScores = scoreRows.filter((s) => s.playerId === player.id);
    const reaccion = mineScores.find((s) => s.slug === "reaccion") ?? null;
    const numeros = mineScores.find((s) => s.slug === "numeros") ?? null;

    return {
      slot: player.slot,
      name: player.name,
      emoji: player.emoji,
      solved,
      finishedAt: player.finishedAt?.toISOString() ?? null,
      mainTimeMs,
      reaccion: reaccion?.bestScore ?? null,
      numeros: numeros?.bestScore ?? null,
      attempts: (reaccion?.attempts ?? 0) + (numeros?.attempts ?? 0),
    };
  });

  rows.sort((a, b) => a.slot - b.slot);

  return Response.json({ game: game.name, planVersion: game.planVersion, players: rows });
}
