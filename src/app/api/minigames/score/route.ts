import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { minigameScores } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { getCurrentPlayer } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Milisegundos mínimos y máximos admisibles para cada minijuego (protección básica). */
export const SCORE_RANGE: Record<string, { min: number; max: number }> = {
  reaccion: { min: 80, max: 5000 },
  numeros: { min: 1200, max: 120000 },
};

export async function POST(request: Request) {
  const session = await getCurrentPlayer();
  if (!session) {
    return Response.json({ error: "Entra con tu nombre para registrar tu récord." }, { status: 401 });
  }

  const body = (await request.json()) as { slug?: unknown; score?: unknown };
  const slug = typeof body.slug === "string" ? body.slug : "";
  const score = Math.round(Number(body.score));

  const range = SCORE_RANGE[slug];
  if (!range) {
    return Response.json({ error: "Minijuego desconocido." }, { status: 400 });
  }
  if (!Number.isFinite(score) || score < range.min || score > range.max) {
    return Response.json(
      { error: `Marca fuera de rango (debe estar entre ${range.min} y ${range.max} ms).` },
      { status: 400 },
    );
  }

  const game = await ensureFixedGame();

  const existing = await db
    .select()
    .from(minigameScores)
    .where(
      and(
        eq(minigameScores.gameId, game.id),
        eq(minigameScores.playerId, session.player.id),
        eq(minigameScores.slug, slug),
      ),
    )
    .limit(1);

  const row = existing[0];

  if (!row) {
    await db.insert(minigameScores).values({
      gameId: game.id,
      playerId: session.player.id,
      slug,
      bestScore: score,
      lastScore: score,
      attempts: 1,
      updatedAt: new Date(),
    });
    return Response.json({ ok: true, isNewBest: true, bestScore: score, attempts: 1, score });
  }

  // En ambos juegos, menor tiempo = mejor marca.
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

  return Response.json({
    ok: true,
    isNewBest,
    bestScore: isNewBest ? score : row.bestScore,
    attempts: row.attempts + 1,
    score,
  });
}
