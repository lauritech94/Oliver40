/** Prueba local y destructiva con restauración: valida v5→v6 sin perder ediciones ni progreso. */
import "dotenv/config";
import assert from "node:assert/strict";
import { and, asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { games, players, tasks } from "../src/db/schema";
import { ensureFixedGame, originalTaskFor } from "../src/lib/fixed-game";
import { FIXED_GAME_CODE, FIXED_PLAN_VERSION } from "../src/lib/fixed-plan";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  assert.ok(["localhost", "127.0.0.1"].includes(host), "Solo puede ejecutarse en la BD local.");

  const [game] = await db.select().from(games).where(eq(games.code, FIXED_GAME_CODE)).limit(1);
  const trapRows = await db
    .select({ task: tasks, slot: players.slot })
    .from(tasks)
    .innerJoin(players, eq(tasks.playerId, players.id))
    .where(and(eq(tasks.gameId, game.id), eq(tasks.typeSlug, "trampa")))
    .orderBy(asc(players.slot));
  assert.equal(trapRows.length, 28);
  const editedRow = trapRows[0];
  const progressRow = trapRows[1];
  const fakeDate = new Date("2026-01-02T03:04:05.000Z");

  // Simula la producción todavía en v5.
  await db.update(games).set({ planVersion: "gymkhana-28-v5" }).where(eq(games.id, game.id));
  await db
    .update(tasks)
    .set({
      title: "MI PREGUNTA PERSONALIZADA",
      prompt: "Esta pregunta la escribió el juez y debe sobrevivir.",
      answer: "respuesta-del-juez",
      judgeNote: "nota del juez",
      edited: true,
    })
    .where(eq(tasks.id, editedRow.task.id));
  await db
    .update(tasks)
    .set({ solvedAt: fakeDate, attempts: 3, openedAt: fakeDate })
    .where(eq(tasks.id, progressRow.task.id));

  await ensureFixedGame();

  const [afterGame] = await db.select().from(games).where(eq(games.id, game.id)).limit(1);
  assert.equal(afterGame.planVersion, FIXED_PLAN_VERSION);

  const [editedAfter] = await db.select().from(tasks).where(eq(tasks.id, editedRow.task.id)).limit(1);
  assert.equal(editedAfter.prompt, "Esta pregunta la escribió el juez y debe sobrevivir.");
  assert.equal(editedAfter.answer, "respuesta-del-juez");
  assert.equal(editedAfter.edited, true);
  console.log("✓ Pregunta editada por el juez conservada íntegramente.");

  const [progressAfter] = await db.select().from(tasks).where(eq(tasks.id, progressRow.task.id)).limit(1);
  assert.equal(progressAfter.attempts, 3);
  assert.equal(progressAfter.solvedAt?.toISOString(), fakeDate.toISOString());
  assert.equal(progressAfter.openedAt?.toISOString(), fakeDate.toISOString());
  const expected = originalTaskFor(progressRow.slot, progressAfter.stepIndex)!;
  assert.equal(progressAfter.prompt, expected.prompt);
  assert.equal(progressAfter.answer, expected.answer);
  console.log("✓ Pregunta no editada actualizada a v6 sin perder solvedAt, openedAt ni intentos.");

  const all = await db.select().from(tasks).where(and(eq(tasks.gameId, game.id), eq(tasks.typeSlug, "trampa")));
  assert.equal(all.length, 28);
  assert.equal(new Set(all.map((task) => task.prompt)).size, 28);
  console.log("✓ La base de datos contiene las 28 nuevas preguntas diferentes.");

  // Limpia el ensayo pero deja la BD correctamente en v6.
  const editedOriginal = originalTaskFor(editedRow.slot, editedRow.task.stepIndex)!;
  await db
    .update(tasks)
    .set({
      title: editedOriginal.title,
      prompt: editedOriginal.prompt,
      answer: editedOriginal.answer,
      judgeNote: editedOriginal.judgeNote,
      edited: false,
    })
    .where(eq(tasks.id, editedRow.task.id));
  await db
    .update(tasks)
    .set({ solvedAt: null, openedAt: null, attempts: 0 })
    .where(eq(tasks.id, progressRow.task.id));
  console.log("✓ Datos del ensayo limpiados; la BD queda en v6 sin progreso artificial.");
}

void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
