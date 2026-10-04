import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { FIXED_GAME_CODE } from "@/lib/fixed-plan";
import { getGameByCode, resolveTaskViews, toEditorTask } from "@/lib/queries";
import { setupErrorResponse } from "@/lib/setup-error";

export const dynamic = "force-dynamic";

/**
 * Enunciados completos para el editor, en lotes pequeños.
 * Se carga por trozos para que la pantalla no descargue las 420 pruebas de golpe.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
    const limit = Math.min(80, Math.max(10, Number(url.searchParams.get("limit")) || 40));
    const playerId = url.searchParams.get("playerId");
    const typeSlug = url.searchParams.get("typeSlug") ?? "";

    await ensureFixedGame();
    const game = await getGameByCode(FIXED_GAME_CODE);
    if (!game) return Response.json({ error: "No se pudo cargar la partida fija." }, { status: 500 });

    const playerRows = await db
      .select()
      .from(players)
      .where(eq(players.gameId, game.id))
      .orderBy(asc(players.slot));
    const allowedIds = playerRows.map((p) => p.id);

    const conditions = [eq(tasks.gameId, game.id)];
    if (playerId && Number(playerId) > 0) conditions.push(eq(tasks.playerId, Number(playerId)));
    if (typeSlug && typeSlug !== "all") conditions.push(eq(tasks.typeSlug, typeSlug));

    const all = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.cardNumber));

    const resolved = resolveTaskViews(all, playerRows);
    const total = resolved.length;
    const slice = resolved.slice(offset, offset + limit).map(toEditorTask);

    return Response.json({
      total,
      offset,
      limit,
      tasks: slice,
      players: playerRows.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, slot: p.slot })),
      game: {
        planVersion: game.planVersion,
        editedCount: resolved.filter((t) => t.edited).length,
      },
    });
  } catch (error) {
    return setupErrorResponse(error);
  }
}
