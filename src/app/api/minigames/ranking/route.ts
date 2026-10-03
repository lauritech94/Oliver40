import { ensureFixedGame } from "@/lib/fixed-game";
import { listRanking } from "@/lib/minigames";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const game = await ensureFixedGame();
    const players = await listRanking();
    return Response.json({
      game: game.name,
      planVersion: game.planVersion,
      players,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la clasificación.";
    return Response.json({ error: message, players: [] }, { status: 500 });
  }
}
