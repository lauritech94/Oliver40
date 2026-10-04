import { ensureFixedGame } from "@/lib/fixed-game";
import { FIXED_GAME_CODE } from "@/lib/fixed-plan";
import { getPanelState } from "@/lib/queries";
import { setupErrorResponse } from "@/lib/setup-error";

export const dynamic = "force-dynamic";

/** Datos ligeros del panel de jueces: sin enunciados ni datos de juegos interactivos. */
export async function GET() {
  try {
    await ensureFixedGame();
    const state = await getPanelState(FIXED_GAME_CODE);
    if (!state) {
      return Response.json({ error: "No se pudo cargar la partida fija" }, { status: 500 });
    }

    return Response.json({
      game: {
        name: state.game.name,
        cardPoolSize: state.game.cardPoolSize,
        planVersion: state.game.planVersion,
        editedCount: state.players.reduce((n, p) => n + p.tasks.filter((t) => t.edited).length, 0),
      },
      players: state.players,
    });
  } catch (error) {
    return setupErrorResponse(error);
  }
}
