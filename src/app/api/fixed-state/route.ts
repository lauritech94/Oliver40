import { ensureFixedGame, originalTaskFor } from "@/lib/fixed-game";
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

    // Marca las pruebas cuyo texto se editó desde /judge/edit.
    const players = state.players.map((player) => ({
      ...player,
      tasks: player.tasks.map((task) => {
        const original = originalTaskFor(player.slot, task.stepIndex);
        const edited = original
          ? original.title !== task.title ||
            original.prompt !== task.prompt ||
            original.answer !== task.answer ||
            original.hint !== task.hint
          : false;
        return { ...task, edited };
      }),
    }));

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
