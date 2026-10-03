import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { minigameScores, players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";

let ensured = false;

/**
 * Crea la tabla de marcas si no existe. Se llama al vuelo para que los
 * minijuegos funcionen aunque todavía no se haya pulsado «/setup» tras un despliegue.
 */
export async function ensureMinigameTable(): Promise<void> {
  if (ensured) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "minigame_scores" (
      "id" serial PRIMARY KEY NOT NULL,
      "game_id" integer NOT NULL,
      "player_id" integer NOT NULL,
      "slug" varchar(24) NOT NULL,
      "best_score" integer DEFAULT 0 NOT NULL,
      "last_score" integer DEFAULT 0 NOT NULL,
      "attempts" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    )`);
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "minigame_scores_player_slug_idx" ON "minigame_scores" ("player_id","slug")`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS "minigame_scores_game_idx" ON "minigame_scores" ("game_id")`,
  );
  ensured = true;
}

/** Milisegundos admisibles para cada minijuego (protección básica contra marcas imposibles). */
export const SCORE_RANGE: Record<string, { min: number; max: number }> = {
  reaccion: { min: 80, max: 5000 },
  numeros: { min: 1200, max: 120000 },
};

export type MinigameScoreRow = {
  playerId: number;
  slug: string;
  bestScore: number;
  lastScore: number;
  attempts: number;
};

/** Guarda una marca conservando SIEMPRE la mejor (menos ms = mejor). */
export async function submitScore(
  playerId: number,
  slug: string,
  score: number,
): Promise<{ isNewBest: boolean; bestScore: number; attempts: number }> {
  await ensureMinigameTable();
  const game = await ensureFixedGame();

  const existing = await db
    .select()
    .from(minigameScores)
    .where(
      and(
        eq(minigameScores.gameId, game.id),
        eq(minigameScores.playerId, playerId),
        eq(minigameScores.slug, slug),
      ),
    )
    .limit(1);
  const row = existing[0];

  if (!row) {
    await db.insert(minigameScores).values({
      gameId: game.id,
      playerId,
      slug,
      bestScore: score,
      lastScore: score,
      attempts: 1,
      updatedAt: new Date(),
    });
    return { isNewBest: true, bestScore: score, attempts: 1 };
  }

  const isNewBest = score < row.bestScore;
  await db
    .update(minigameScores)
    .set({
      bestScore: isNewBest ? score : row.bestScore,
      lastScore: score,
      attempts: sql`${minigameScores.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(minigameScores.id, row.id));

  return {
    isNewBest,
    bestScore: isNewBest ? score : row.bestScore,
    attempts: row.attempts + 1,
  };
}

export type RankingRow = {
  slot: number;
  name: string;
  emoji: string;
  solved: number;
  finishedAt: string | null;
  mainTimeMs: number | null;
  reaccion: number | null;
  numeros: number | null;
  attempts: number;
};

/** Clasificación. Si algo falla devuelve la lista de jugadores sin marcas. */
export async function listRanking(): Promise<RankingRow[]> {
  const game = await ensureFixedGame();

  const playerRows = await db
    .select()
    .from(players)
    .where(eq(players.gameId, game.id));

  const taskRows = await db.select().from(tasks).where(eq(tasks.gameId, game.id));

  const base: RankingRow[] = playerRows.map((player) => ({
    slot: player.slot,
    name: player.name,
    emoji: player.emoji,
    solved: taskRows.filter((t) => t.playerId === player.id && t.solvedAt).length,
    finishedAt: player.finishedAt?.toISOString() ?? null,
    mainTimeMs:
      player.startedAt && player.finishedAt
        ? new Date(player.finishedAt).getTime() - new Date(player.startedAt).getTime()
        : null,
    reaccion: null,
    numeros: null,
    attempts: 0,
  }));

  try {
    await ensureMinigameTable();
    const rows = await db
      .select()
      .from(minigameScores)
      .where(eq(minigameScores.gameId, game.id));

    // Relaciona cada marca con su jugador por id.
    const byPlayer = new Map<number, typeof rows>();
    for (const row of rows) {
      const list = byPlayer.get(row.playerId) ?? [];
      list.push(row);
      byPlayer.set(row.playerId, list);
    }
    for (const player of playerRows) {
      const target = base.find((b) => b.name === player.name);
      if (!target) continue;
      const mine = byPlayer.get(player.id) ?? [];
      const reaccion = mine.find((s) => s.slug === "reaccion");
      const numeros = mine.find((s) => s.slug === "numeros");
      target.reaccion = reaccion?.bestScore ?? null;
      target.numeros = numeros?.bestScore ?? null;
      target.attempts = (reaccion?.attempts ?? 0) + (numeros?.attempts ?? 0);
    }
  } catch {
    // Sin tabla de marcas todavía: el ranking se muestra vacío, no rompe la página.
  }

  return base.sort((a, b) => a.slot - b.slot);
}
