import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, players, tasks, type Game, type Task } from "@/db/schema";

export async function getGameByCode(code: string): Promise<Game | null> {
  const rows = await db
    .select()
    .from(games)
    .where(eq(games.code, code.toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

/** Jugador sin el token de sesión (nunca se envía al navegador). */
export type PublicPlayer = {
  id: number;
  gameId: number;
  name: string;
  emoji: string;
  slot: number;
  profile: Record<string, string>;
  currentStep: number;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type PlayerRow = PublicPlayer & { tasks: Task[] };

export type GameState = {
  game: Game;
  players: PlayerRow[];
};

export async function getGameState(code: string): Promise<GameState | null> {
  const game = await getGameByCode(code);
  if (!game) return null;

  const playerRows = await db
    .select()
    .from(players)
    .where(eq(players.gameId, game.id))
    .orderBy(asc(players.id));

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.gameId, game.id))
    .orderBy(asc(tasks.playerId), asc(tasks.stepIndex));

  // Las pruebas sociales se resuelven con la ficha actual del jugador objetivo.
  const resolve = (task: Task): Task => {
    const link = task.meta?.profile;
    if (!link) return task;
    const target = playerRows.find((p) => p.id === link.targetPlayerId);
    const value = (target?.profile?.[link.field] ?? "").trim();
    return { ...task, answer: value, needsSetup: !value };
  };

  return {
    game,
    players: playerRows.map((p) => ({
      id: p.id,
      gameId: p.gameId,
      name: p.name,
      emoji: p.emoji,
      slot: p.slot,
      profile: p.profile ?? {},
      currentStep: p.currentStep,
      startedAt: p.startedAt,
      finishedAt: p.finishedAt,
      tasks: taskRows.filter((t) => t.playerId === p.id).map(resolve),
    })),
  };
}

export async function getPlayerTasks(playerId: number): Promise<Task[]> {
  return db.select().from(tasks).where(eq(tasks.playerId, playerId)).orderBy(asc(tasks.stepIndex));
}

export async function getTaskByCard(gameId: number, cardNumber: number): Promise<Task | null> {
  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.gameId, gameId), eq(tasks.cardNumber, cardNumber)))
    .limit(1);
  return rows[0] ?? null;
}

/** Respuesta esperada de una prueba (resuelve las que dependen de una ficha). */
export async function resolveExpected(task: Task): Promise<string> {
  const link = task.meta?.profile;
  if (!link) return task.answer;
  const rows = await db
    .select({ profile: players.profile })
    .from(players)
    .where(eq(players.id, link.targetPlayerId))
    .limit(1);
  return (rows[0]?.profile?.[link.field] ?? "").trim();
}
