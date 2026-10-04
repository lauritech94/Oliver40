/** npx tsx scripts/test-edit-preservation.ts — requiere la BD local. NO usar en producción. */
import "dotenv/config";
import assert from "node:assert/strict";
import { and, asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { games, players, tasks } from "../src/db/schema";
import { ensureFixedGame } from "../src/lib/fixed-game";
import { FIXED_GAME_CODE } from "../src/lib/fixed-plan";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  assert.ok(["localhost", "127.0.0.1"].includes(host), "Solo en base de datos LOCAL.");

  await ensureFixedGame();
  const [game] = await db.select().from(games).where(eq(games.code, FIXED_GAME_CODE)).limit(1);
  const [oli] = await db.select().from(players).where(and(eq(players.gameId, game.id), eq(players.slot, 1))).limit(1);

  // El juez edita una pregunta cualquiera de Oli (texto y respuesta propios).
  const [victim] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.playerId, oli.id), eq(tasks.stepIndex, 0)))
    .limit(1);
  const MY_TITLE = "PREGUNTA EDITADA POR EL JUEZ";
  const MY_PROMPT = "Este enunciado lo escribí yo a mano.";
  const MY_ANSWER = "mi-respuesta-personalizada";
  await db
    .update(tasks)
    .set({ title: MY_TITLE, prompt: MY_PROMPT, answer: MY_ANSWER, edited: true })
    .where(eq(tasks.id, victim.id));

  // Un puzzle con foto subida por el juez (data URL simulada).
  const [puzzle] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.gameId, game.id), eq(tasks.typeSlug, "puzzle")))
    .limit(1);
  const MY_PHOTO = "data:image/jpeg;base64,/9j/EDITADA";
  await db
    .update(tasks)
    .set({ meta: { ...puzzle.meta, puzzle: { ...puzzle.meta.puzzle!, image: MY_PHOTO } } })
    .where(eq(tasks.id, puzzle.id));

  // SIMULA una subida de código con nueva versión del plan: cambiamos la versión
  // guardada en la BD para forzar la ruta de regeneración de ensureFixedGame.
  await db.update(games).set({ planVersion: "simulacion-version-antigua" }).where(eq(games.id, game.id));
  console.log("→ Simulada una versión anterior en la base de datos. Desplegando el código nuevo…");

  await ensureFixedGame(); // esto es lo que ocurre al abrir la web tras subir el código

  // Al regenerar, las filas reciben IDs nuevos: se buscan por posición (jugador + paso).
  const findByPosition = async (playerId: number, stepIndex: number) => {
    const [row] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.playerId, playerId), eq(tasks.stepIndex, stepIndex)))
      .limit(1);
    return row;
  };

  // 1. La edición de texto se conserva.
  const afterVictim = await findByPosition(victim.playerId, victim.stepIndex);
  assert.equal(afterVictim.title, MY_TITLE, "Se perdió el título editado");
  assert.equal(afterVictim.prompt, MY_PROMPT, "Se perdió el enunciado editado");
  assert.equal(afterVictim.answer, MY_ANSWER, "Se perdió la respuesta editada");
  assert.equal(afterVictim.edited, true, "La prueba editada debería seguir marcada");
  console.log("✓ La pregunta editada a mano se conserva tras cambiar la versión del plan.");

  // 2. La foto subida se conserva.
  const afterPuzzle = await findByPosition(puzzle.playerId, puzzle.stepIndex);
  assert.equal(afterPuzzle.meta.puzzle?.image, MY_PHOTO, "Se perdió la foto subida del puzzle");
  console.log("✓ La foto del puzzle subida por el juez se conserva.");

  // 3. Las pruebas NO editadas sí se actualizan al plan nuevo (siguen presentes y correctas).
  const total = await db.select().from(tasks).where(eq(tasks.gameId, game.id));
  assert.equal(total.length, 420, "Deben seguir existiendo las 420 pruebas");
  const editedCount = total.filter((t) => t.edited).length;
  assert.equal(editedCount, 1, `Debe haber exactamente 1 prueba marcada como editada, hay ${editedCount}`);
  const [afterGame] = await db.select().from(games).where(eq(games.id, game.id)).limit(1);
  assert.ok(afterGame.planVersion.startsWith("gymkhana-28"), "La versión del plan debe quedar actualizada a la del código");
  console.log("✓ Siguen existiendo las 420 pruebas y solo la editada queda marcada.");

  // Restaurar al estado de catálogo para no dejar datos de prueba.
  await db
    .update(tasks)
    .set({ title: victim.title, prompt: victim.prompt, answer: victim.answer, edited: false })
    .where(and(eq(tasks.playerId, victim.playerId), eq(tasks.stepIndex, victim.stepIndex)));
  await db
    .update(tasks)
    .set({ meta: puzzle.meta })
    .where(and(eq(tasks.playerId, puzzle.playerId), eq(tasks.stepIndex, puzzle.stepIndex)));
  console.log("✓ Datos de prueba restaurados.");
  console.log("\n✅ Subir el código NO borra las ediciones ni las fotos de los jueces.");
}

void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
