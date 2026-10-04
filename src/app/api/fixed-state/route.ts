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

    // La columna `edited` de la base de datos es la fuente de verdad: es la que se
    // conserva aunque cambie la versión del plan.
    const players = state.players;

    return Response.json({
      game: {
        name: state.game.name,
        cardPoolSize: state.game.cardPoolSize,
        planVersion: state.game.planVersion,
        editedCount: players.reduce((n, p) => n + p.tasks.filter((t) => t.edited).length, 0),
      },
      players,
    });
  } catch (error) {
    return setupErrorResponse(error);
  }
}
