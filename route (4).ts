import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { getCurrentPlayer, setPlayerCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * El jugador solo elige su nombre de la lista fija; no hay código ni PIN.
 * Una vez elegido, queda bloqueado: si vuelve atrás no puede entrar como otra
 * persona. Solo el panel de jueces puede cambiar de jugador (switchPlayer).
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { playerId?: number; switchPlayer?: boolean };
  const playerId = Number(body.playerId);
  if (!Number.isInteger(playerId)) {
    return Response.json({ error: "Elige tu nombre de la lista." }, { status: 400 });
  }

  const game = await ensureFixedGame();

  const existing = await getCurrentPlayer();
  if (existing && existing.player.id !== playerId && !body.switchPlayer) {
    return Response.json(
      {
        error: `Ya estás jugando como ${existing.player.name}. No puedes cambiar de jugador.`,
        currentName: existing.player.name,
        locked: true,
      },
      { status: 409 },
    );
  }

  const rows = await db
    .select({ id: players.id, token: players.token, name: players.name })
    .from(players)
    .where(and(eq(players.gameId, game.id), eq(players.id, playerId)))
    .limit(1);
  const player = rows[0];
  if (!player) {
    return Response.json({ error: "Ese nombre no pertenece a la lista fija." }, { status: 404 });
  }

  await setPlayerCookie(player.token);
  return Response.json({ ok: true, name: player.name });
}
