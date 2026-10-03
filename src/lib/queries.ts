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

/**
 * Una prueba tal y como la ve el panel de jueces.
 * - `answer`: lo guardado en la base de datos (el editor trabaja sobre este campo).
 * - `effectiveAnswer`: lo que se usará para validar. En las pruebas sociales sale de la
 *   ficha del jugador objetivo, salvo que el juez haya escrito una respuesta fija.
 */
export type TaskView = Task & { effectiveAnswer: string };

export type PlayerRow = PublicPlayer & { tasks: TaskView[] };

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

  // Una respuesta fija escrita por el juez siempre manda sobre la ficha.
  const resolve = (task: Task): TaskView => {
    const link = task.meta?.profile;
    if (!link || task.answer.trim()) {
      return { ...task, effectiveAnswer: task.answer };
    }
    const target = playerRows.find((p) => p.id === link.targetPlayerId);
    const value = (target?.profile?.[link.field] ?? "").trim();
    return { ...task, effectiveAnswer: value, needsSetup: !value };
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

/**
 * Respuesta esperada de una prueba.
 *
 * En las pruebas sociales se toma de la ficha del jugador al que hay que preguntar,
 * PERO si un juez escribió una respuesta fija en /judge/edit, esa tiene prioridad.
 * Así el cambio es reversible: borra la respuesta fija y vuelve a usar la ficha.
 */
export async function resolveExpected(task: Task): Promise<string> {
  if (task.answer.trim()) return task.answer;

  const link = task.meta?.profile;
  if (!link) return "";

  const rows = await db
    .select({ profile: players.profile })
    .from(players)
    .where(eq(players.id, link.targetPlayerId))
    .limit(1);
  return (rows[0]?.profile?.[link.field] ?? "").trim();
}
