import "dotenv/config";
import assert from "node:assert/strict";
import { and, asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { games, players, tasks } from "../src/db/schema";
import { ensureFixedGame } from "../src/lib/fixed-game";
import { FIXED_GAME_CODE, FIXED_PLAN, FIXED_PLAN_VERSION } from "../src/lib/fixed-plan";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  assert.ok(["localhost", "127.0.0.1"].includes(host), "Solo en BD local.");
  const [game] = await db.select().from(games).where(eq(games.code, FIXED_GAME_CODE)).limit(1);
  assert.equal(game.planVersion, "gymkhana-28-v6", "Esta prueba necesita una base local v6 sin migrar.");
  const playerRows = await db.select().from(players).where(eq(players.gameId, game.id)).orderBy(asc(players.slot));
  const before = await db.select().from(tasks).where(eq(tasks.gameId, game.id));
  const idsByCard = new Map(before.map((task) => [task.cardNumber, task.id]));

  const culture = before.find((task) => task.typeSlug === "cultura")!;
  const puzzle = before.find((task) => task.typeSlug === "puzzle")!;
  const oldLogic = before.find((task) => task.typeSlug === "logica")!;
  const customPhoto = "data:image/jpeg;base64,/9j/FOTO-JUEZ";
  const solvedAt = new Date("2026-02-03T04:05:06Z");

  await db.update(tasks).set({
    title: "CULTURA EDITADA POR EL JUEZ",
    prompt: "Mi pregunta sencilla personalizada",
    answer: "mi respuesta",
    judgeNote: "mi nota",
    edited: true,
  }).where(eq(tasks.id, culture.id));
  await db.update(tasks).set({
    meta: { ...puzzle.meta, puzzle: { ...puzzle.meta.puzzle!, image: customPhoto } },
  }).where(eq(tasks.id, puzzle.id));
  await db.update(tasks).set({ solvedAt, openedAt: solvedAt, attempts: 2 }).where(eq(tasks.id, oldLogic.id));

  await ensureFixedGame();

  const [afterGame] = await db.select().from(games).where(eq(games.id, game.id)).limit(1);
  assert.equal(afterGame.planVersion, FIXED_PLAN_VERSION);
  const after = await db.select().from(tasks).where(eq(tasks.gameId, game.id));
  assert.equal(after.length, 420);
  assert.equal(new Set(after.map((task) => task.cardNumber)).size, 420);
  for (const row of after) assert.equal(row.id, idsByCard.get(row.cardNumber), `Cambió el ID de tarjeta #${row.cardNumber}`);
  console.log("✓ Migración en la misma fila: 420 IDs, tarjetas y pasos conservados.");

  const cultureAfter = after.find((task) => task.id === culture.id)!;
  assert.equal(cultureAfter.prompt, "Mi pregunta sencilla personalizada");
  assert.equal(cultureAfter.answer, "mi respuesta");
  assert.equal(cultureAfter.edited, true);
  console.log("✓ Cultura editada por el juez conservada.");

  const puzzleAfter = after.find((task) => task.id === puzzle.id)!;
  assert.equal(puzzleAfter.meta.puzzle?.image, customPhoto);
  assert.equal(puzzleAfter.meta.puzzle?.size, 6);
  console.log("✓ Foto subida conservada y mecánica actualizada a puzzle 6×6.");

  const logicAfter = after.find((task) => task.id === oldLogic.id)!;
  assert.equal(logicAfter.typeSlug, "cronometro");
  assert.equal(logicAfter.meta.minigame?.kind, "stopwatch");
  assert.equal(logicAfter.solvedAt?.toISOString(), solvedAt.toISOString());
  assert.equal(logicAfter.openedAt?.toISOString(), solvedAt.toISOString());
  assert.equal(logicAfter.attempts, 2);
  console.log("✓ Lógica → cronómetro sin perder solvedAt, openedAt ni intentos.");

  const expectedTypes = new Set(FIXED_PLAN.map((task) => task.typeSlug));
  assert.ok(!expectedTypes.has("acertijo") && !expectedTypes.has("logica") && !expectedTypes.has("trampa"));
  assert.ok(expectedTypes.has("laberinto") && expectedTypes.has("intruso") && expectedTypes.has("cronometro"));
  console.log("✓ Los tres tipos antiguos ya no existen; los tres minijuegos ocupan sus tarjetas.");

  // Limpieza de datos artificiales, conservando la partida ya migrada a v7.
  const cultureFresh = FIXED_PLAN.find((task) => task.cardNumber === culture.cardNumber)!;
  const puzzleFresh = FIXED_PLAN.find((task) => task.cardNumber === puzzle.cardNumber)!;
  await db.update(tasks).set({
    title: cultureFresh.title,
    prompt: cultureFresh.prompt,
    answer: cultureFresh.answer,
    judgeNote: cultureFresh.judgeNote,
    edited: false,
  }).where(eq(tasks.id, culture.id));
  await db.update(tasks).set({ meta: puzzleFresh.meta }).where(eq(tasks.id, puzzle.id));
  await db.update(tasks).set({ solvedAt: null, openedAt: null, attempts: 0 }).where(eq(tasks.id, oldLogic.id));
  console.log("✓ Datos artificiales limpiados; la BD local queda en v7.");
}

void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
