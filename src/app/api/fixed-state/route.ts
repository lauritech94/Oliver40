import { ensureFixedGame } from "@/lib/fixed-game";
import { FIXED_GAME_CODE } from "@/lib/fixed-plan";
import { getGameState } from "@/lib/queries";
import { setupErrorResponse } from "@/lib/setup-error";

export const dynamic = "force-dynamic";

/** Datos del panel de jueces de la única partida fija (incluye sus respuestas). */
export async function GET() {
  try {
    await ensureFixedGame();
    const state = await getGameState(FIXED_GAME_CODE);
    if (!state) {
      return Response.json({ error: "No se pudo cargar la partida fija" }, { status: 500 });
    }

    return Response.json({
      game: {
        name: state.game.name,
        cardPoolSize: state.game.cardPoolSize,
        planVersion: state.game.planVersion,
      },
      players: state.players,
    });
  } catch (error) {
    return setupErrorResponse(error);
  }
}
