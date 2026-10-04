import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { games, players, tasks, type Game } from "@/db/schema";
import { PLAYER_EMOJIS, makeToken } from "@/lib/utils";
import { FIXED_CARD_COUNT, FIXED_GAME_CODE, FIXED_GAME_NAME, FIXED_PLAN, FIXED_PLAN_VERSION, FIXED_PLAYER_NAMES } from "@/lib/fixed-plan";

/**
 * Devuelve el texto ORIGINAL de una prueba tal y como está en el plan fijo,
 * para poder deshacer las ediciones hechas desde /judge/edit.
 */
export function originalTaskFor(
  slot: number,
  stepIndex: number,
): (typeof FIXED_PLAN)[number] | undefined {
  return FIXED_PLAN.find((task) => task.playerId === slot && task.stepIndex === stepIndex);
}

type PreservedTask = {
  title: string;
  prompt: string;
  answer: string;
  judgeNote: string;
  edited: boolean;
  typeSlug: string;
  image: string | null;
};

/** Crea la única partida y sus 420 tareas de forma idempotente y segura ante concurrencia. */
export async function ensureFixedGame(): Promise<Game> {
  return db.transaction(async (tx) => {
    // Una sola petición inicializa el plan aunque los 28 jugadores escaneen el QR a la vez.
    await tx.execute(sql`select pg_advisory_xact_lock(28154201)`);

    // La columna que marca las ediciones de los jueces. Se crea sin borrar nada,
    // para que funcione también en bases de datos creadas antes de esta mejora.
    await tx.execute(
      sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS edited boolean NOT NULL DEFAULT false`,
    );

    let [game] = await tx.select().from(games).where(eq(games.code, FIXED_GAME_CODE)).limit(1);

    // Ediciones y fotos subidas que hay que CONSERVAR si el plan cambia de versión.
    const preserved = new Map<string, PreservedTask>();

    if (!game) {
      [game] = await tx
        .insert(games)
        .values({
          code: FIXED_GAME_CODE,
          name: FIXED_GAME_NAME,
          status: "running",
          planVersion: FIXED_PLAN_VERSION,
          cardPoolSize: FIXED_CARD_COUNT,
          startedAt: new Date(),
        })
        .returning();
    } else if (game.planVersion && game.planVersion !== FIXED_PLAN_VERSION) {
      // El plan se ha rediseñado en el código. Antes de regenerar, se guardan las
      // ediciones de los jueces y las fotos subidas para volver a aplicarlas.
      // Los números de tarjeta por jugador NO cambian (semilla fija), así que lo
      // impreso sigue siendo válido; solo cambia el contenido no editado.
      const existing = await tx
        .select({
          slot: players.slot,
          stepIndex: tasks.stepIndex,
          typeSlug: tasks.typeSlug,
          title: tasks.title,
          prompt: tasks.prompt,
          answer: tasks.answer,
          judgeNote: tasks.judgeNote,
          edited: tasks.edited,
          image: sql<string | null>`${tasks.meta}->'puzzle'->>'image'`,
        })
        .from(tasks)
        .innerJoin(players, eq(tasks.playerId, players.id))
        .where(eq(tasks.gameId, game.id));
      for (const row of existing) {
        const uploaded = row.image && row.image.startsWith("data:image/") ? row.image : null;
        if (row.edited || uploaded) {
          preserved.set(`${row.slot}:${row.stepIndex}`, {
            title: row.title,
            prompt: row.prompt,
            answer: row.answer,
            judgeNote: row.judgeNote,
            edited: row.edited,
            typeSlug: row.typeSlug,
            image: uploaded,
          });
        }
      }

      await tx.delete(tasks).where(eq(tasks.gameId, game.id));
      [game] = await tx
        .update(games)
        .set({ planVersion: FIXED_PLAN_VERSION, cardPoolSize: FIXED_CARD_COUNT })
        .where(eq(games.id, game.id))
        .returning();
    } else if (!game.planVersion) {
      const [taskCount] = await tx
        .select({ total: count() })
        .from(tasks)
        .where(eq(tasks.gameId, game.id));
      if (taskCount.total > 0) {
        throw new Error(
          "La partida ya contiene tarjetas de otro plan. No se sobrescribirá el recorrido guardado.",
        );
      }
      [game] = await tx
        .update(games)
        .set({
          name: FIXED_GAME_NAME,
          status: "running",
          planVersion: FIXED_PLAN_VERSION,
          cardPoolSize: FIXED_CARD_COUNT,
          startedAt: game.startedAt ?? new Date(),
        })
        .where(eq(games.id, game.id))
        .returning();
    }

    let playerRows = await tx
      .select()
      .from(players)
      .where(eq(players.gameId, game.id))
      .orderBy(asc(players.slot));

    const rosterMatches =
      playerRows.length === FIXED_PLAYER_NAMES.length &&
      FIXED_PLAYER_NAMES.every(
        (name, index) => playerRows[index]?.slot === index + 1 && playerRows[index]?.name === name,
      );

    if (!rosterMatches && playerRows.length > 0) {
      const [existingTasks] = await tx
        .select({ total: count() })
        .from(tasks)
        .where(eq(tasks.gameId, game.id));
      if (existingTasks.total > 0) {
        throw new Error(
          "La lista de jugadores de la partida fija no coincide con el plan impreso. No se cambiará automáticamente.",
        );
      }
      await tx.delete(players).where(eq(players.gameId, game.id));
      playerRows = [];
    }

    if (playerRows.length === 0) {
      await tx.insert(players).values(
        FIXED_PLAYER_NAMES.map((name, index) => ({
          gameId: game.id,
          name,
          emoji: PLAYER_EMOJIS[index % PLAYER_EMOJIS.length],
          token: makeToken(),
          slot: index + 1,
          profile: {},
        })),
      );
      playerRows = await tx
        .select()
        .from(players)
        .where(eq(players.gameId, game.id))
        .orderBy(asc(players.slot));
    }

    const [existingTasks] = await tx
      .select({ total: count() })
      .from(tasks)
      .where(eq(tasks.gameId, game.id));

    if (existingTasks.total === 0) {
      const playersBySlot = new Map(playerRows.map((player) => [player.slot, player]));
      const rows = FIXED_PLAN.map((task) => {
        const player = playersBySlot.get(task.playerId);
        if (!player) throw new Error(`No existe el jugador del puesto ${task.playerId}.`);
        let meta = task.meta;
        if (task.meta.profile) {
          const target = playersBySlot.get(task.meta.profile.targetPlayerId);
          if (!target) throw new Error(`No existe el objetivo social del puesto ${task.meta.profile.targetPlayerId}.`);
          meta = { ...task.meta, profile: { ...task.meta.profile, targetPlayerId: target.id } };
        }

        // Volver a aplicar la edición del juez o la foto subida de esta posición,
        // pero solo si el tipo de prueba sigue siendo el mismo.
        const saved = preserved.get(`${task.playerId}:${task.stepIndex}`);
        const keep = saved && saved.typeSlug === task.typeSlug ? saved : undefined;
        if (keep?.image && meta.puzzle) {
          meta = { ...meta, puzzle: { ...meta.puzzle, image: keep.image } };
        }

        return {
          gameId: game.id,
          playerId: player.id,
          stepIndex: task.stepIndex,
          cardNumber: task.cardNumber,
          typeSlug: task.typeSlug,
          typeName: task.typeName,
          icon: task.icon,
          title: keep?.edited ? keep.title : task.title,
          prompt: keep?.edited ? keep.prompt : task.prompt,
          answer: keep?.edited ? keep.answer : task.answer,
          hint: task.hint,
          judgeNote: keep?.edited ? keep.judgeNote : task.judgeNote,
          requiresJudge: task.requiresJudge,
          needsSetup: task.needsSetup,
          meta,
          edited: keep?.edited ?? false,
        };
      });
      await tx.insert(tasks).values(rows);
    } else if (existingTasks.total !== FIXED_PLAN.length) {
      throw new Error(
        `La partida fija tiene ${existingTasks.total} tareas, pero el plan oficial tiene ${FIXED_PLAN.length}. Revisa la base de datos antes de jugar.`,
      );
    }

    // Ninguna prueba lleva pista. Se vacían las que queden en una partida ya creada
    // sin tocar preguntas, respuestas, ediciones, tarjetas ni progreso.
    await tx
      .update(tasks)
      .set({ hint: "", hintUsed: false })
      .where(and(eq(tasks.gameId, game.id), ne(tasks.hint, "")));

    const [updated] = await tx
      .update(games)
      .set({ status: "running", cardPoolSize: FIXED_CARD_COUNT })
      .where(eq(games.id, game.id))
      .returning();
    return updated;
  });
}

