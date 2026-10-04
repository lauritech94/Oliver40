import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { publicPuzzleMeta } from "./puzzle-images";
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

/** Campos comunes que necesitan las pantallas de jueces. */
export type TaskLite = {
  id: number;
  playerId: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  requiresJudge: boolean;
  needsSetup: boolean;
  attempts: number;
  peeks: number;
  hintUsed: boolean;
  solvedAt: Date | null;
  solvedByJudge: boolean;
  edited: boolean;
  effectiveAnswer: string;
  answer: string;
  judgeNote: string;
  meta: { profile?: Task["meta"]["profile"] };
};

export type PanelPlayer = PublicPlayer & { tasks: TaskLite[] };

/** Panel: sin enunciados ni datos interactivos; ahorra el 80% del peso. */
export function toTaskLite(task: TaskView): TaskLite {
  return {
    id: task.id,
    playerId: task.playerId,
    stepIndex: task.stepIndex,
    cardNumber: task.cardNumber,
    typeSlug: task.typeSlug,
    typeName: task.typeName,
    icon: task.icon,
    title: task.title,
    requiresJudge: task.requiresJudge,
    needsSetup: task.needsSetup,
    attempts: task.attempts,
    peeks: task.peeks,
    hintUsed: task.hintUsed,
    solvedAt: task.solvedAt,
    solvedByJudge: task.solvedByJudge,
    edited: task.edited,
    effectiveAnswer: task.effectiveAnswer,
    answer: task.answer,
    judgeNote: task.judgeNote,
    meta: { profile: task.meta?.profile },
  };
}

/** Editor: añade el enunciado completo y el contenido del juego. */
export function toEditorTask(task: TaskView) {
  return { ...toTaskLite(task), prompt: task.prompt, meta: publicPuzzleMeta(task.id, task.meta) };
}

/** Resuelve una lista de tareas, aplicando las fichas sociales de manera segura. */
export function resolveTaskViews(taskRows: Task[], playerRows: PublicPlayer[]): TaskView[] {
  return taskRows.map((stored) => {
    const task: Task = { ...stored, meta: publicPuzzleMeta(stored.id, stored.meta) };
    const link = task.meta?.profile;
    if (!link || task.answer.trim()) return { ...task, effectiveAnswer: task.answer };
    const target = playerRows.find((p) => p.id === link.targetPlayerId);
    const value = (target?.profile?.[link.field] ?? "").trim();
    return { ...task, effectiveAnswer: value, needsSetup: !value };
  });
}

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
  const resolved = resolveTaskViews(taskRows, playerRows);

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
      tasks: resolved.filter((t) => t.playerId === p.id),
    })),
  };
}

/** Solo lo necesario para pintar el panel: sin enunciados ni juegos completos. */
export type PanelState = {
  game: Game;
  players: PanelPlayer[];
};

export async function getPanelState(code: string): Promise<PanelState | null> {
  const state = await getGameState(code);
  if (!state) return null;
  return {
    game: state.game,
    players: state.players.map((player) => ({
      ...player,
      tasks: player.tasks.map(toTaskLite),
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
