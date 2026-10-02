import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { games, players, type Game, type Player } from "@/db/schema";

export const PLAYER_COOKIE = "gymkhana_player";

export async function setPlayerCookie(token: string) {
  const store = await cookies();
  store.set(PLAYER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearPlayerCookie() {
  const store = await cookies();
  store.delete(PLAYER_COOKIE);
}

export async function getCurrentPlayer(): Promise<{ player: Player; game: Game } | null> {
  const store = await cookies();
  const token = store.get(PLAYER_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ player: players, game: games })
    .from(players)
    .innerJoin(games, eq(players.gameId, games.id))
    .where(eq(players.token, token))
    .limit(1);

  return rows[0] ?? null;
}
