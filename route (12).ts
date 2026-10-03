import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { FIXED_GAME_NAME } from "@/lib/fixed-plan";
import { setupErrorResponse } from "@/lib/setup-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const game = await ensureFixedGame();
    const roster = await db
      .select({ id: players.id, name: players.name, emoji: players.emoji, slot: players.slot })
      .from(players)
      .where(eq(players.gameId, game.id))
      .orderBy(asc(players.slot));

    return Response.json({ gameName: FIXED_GAME_NAME, players: roster });
  } catch (error) {
    return setupErrorResponse(error);
  }
}
