import "dotenv/config";
import assert from "node:assert/strict";
import { and, asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { games, players, tasks } from "../src/db/schema";
import { EASY_CULTURE, OBVIOUS_CHARACTERS, generateMaze } from "../src/lib/content/card-minigames";
import { FIXED_GAME_CODE, FIXED_PLAN } from "../src/lib/fixed-plan";
import { answersMatch } from "../src/lib/utils";

const REPLACED: Record<string, string> = {
  acertijo: "laberinto",
  trampa: "intruso",
  logica: "cronometro",
};

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  assert.ok(["localhost", "127.0.0.1"].includes(host), "Solo en BD local.");
  const [game] = await db.select().from(games).where(eq(games.code, FIXED_GAME_CODE)).limit(1);
  const playerRows = await db.select().from(players).where(eq(players.gameId, game.id)).orderBy(asc(players.slot));
  const oldRows = await db.select().from(tasks).where(eq(tasks.gameId, game.id));
  assert.equal(oldRows.length, 420);

  // Las tarjetas y pasos son idénticos; solo cambia el tipo de los tres sustituidos.
  for (const player of playerRows) {
    const old = oldRows.filter((task) => task.playerId === player.id).sort((a, b) => a.stepIndex - b.stepIndex);
    const fresh = FIXED_PLAN.filter((task) => task.playerId === player.slot).sort((a, b) => a.stepIndex - b.stepIndex);
    assert.equal(fresh.length, 15);
    for (let i = 0; i < 15; i++) {
      assert.equal(fresh[i].cardNumber, old[i].cardNumber, `Cambió la tarjeta J${player.slot}, paso ${i + 1}`);
      assert.equal(fresh[i].stepIndex, old[i].stepIndex);
      assert.equal(fresh[i].typeSlug, REPLACED[old[i].typeSlug] ?? old[i].typeSlug);
    }
  }
  assert.equal(new Set(FIXED_PLAN.map((task) => task.cardNumber)).size, 420);
  console.log("✓ 420 números y 15 pasos por jugador idénticos; solo cambian los tres tipos pedidos.");

  const mazes = FIXED_PLAN.filter((task) => task.typeSlug === "laberinto");
  assert.equal(mazes.length, 28);
  for (const task of mazes) {
    const game = task.meta.minigame;
    assert.equal(game?.kind, "maze");
    if (game?.kind !== "maze") continue;
    assert.equal(game.size, 15);
    assert.equal(game.cells.length, 225);
    // BFS: salida alcanzable y todos los nodos conectados.
    const visited = new Set([game.start]);
    const distances = new Map<number, number>([[game.start, 0]]);
    const queue = [game.start];
    const dirs = [{ b: 1, d: -15 }, { b: 2, d: 1 }, { b: 4, d: 15 }, { b: 8, d: -1 }];
    while (queue.length) {
      const cell = queue.shift()!;
      for (const { b, d } of dirs) {
        if (!(game.cells[cell] & b)) continue;
        const next = cell + d;
        assert.ok(next >= 0 && next < 225);
        if (!visited.has(next)) {
          visited.add(next);
          distances.set(next, (distances.get(cell) ?? 0) + 1);
          queue.push(next);
        }
      }
    }
    assert.equal(visited.size, 225);
    assert.ok(visited.has(game.end));
    assert.ok((distances.get(game.end) ?? 0) >= 60, "El laberinto debe requerir al menos 60 movimientos mínimos");
  }
  console.log("✓ 28 laberintos 15×15: todos conectados y con salida alcanzable.");

  const intruders = FIXED_PLAN.filter((task) => task.typeSlug === "intruso");
  assert.equal(intruders.length, 28);
  for (const task of intruders) {
    const game = task.meta.minigame;
    assert.equal(game?.kind, "intruder");
    if (game?.kind === "intruder") {
      assert.equal(game.rounds.length, 3);
      for (const round of game.rounds) {
        assert.notEqual(round.base, round.odd);
        assert.ok(round.index >= 0 && round.index < 64);
      }
    }
  }
  console.log("✓ 28 juegos de intruso: 3 rondas válidas cada uno.");

  const watches = FIXED_PLAN.filter((task) => task.typeSlug === "cronometro");
  assert.equal(watches.length, 28);
  for (const task of watches) {
    const game = task.meta.minigame;
    assert.equal(game?.kind, "stopwatch");
    if (game?.kind === "stopwatch") {
      assert.ok([4000, 5000, 6000].includes(game.targetMs));
      assert.equal(game.attempts, 3);
    }
  }
  console.log("✓ 28 cronómetros: 3 intentos y objetivos válidos.");

  const puzzles = FIXED_PLAN.filter((task) => task.typeSlug === "puzzle");
  assert.equal(puzzles.length, 28);
  assert.ok(puzzles.every((task) => task.meta.puzzle?.size === 6));
  console.log("✓ Puzzle actualizado a 6×6 para las 28 personas.");

  assert.equal(EASY_CULTURE.length, 28);
  assert.equal(new Set(EASY_CULTURE.map((q) => q.question)).size, 28);
  assert.ok(EASY_CULTURE.every((q) => q.answer.trim() && answersMatch(q.answer, q.answer)));
  const cultures = FIXED_PLAN.filter((task) => task.typeSlug === "cultura");
  assert.equal(cultures.length, 28);
  assert.equal(new Set(cultures.map((task) => task.prompt)).size, 28);
  console.log("✓ Cultura: 28 preguntas sencillas y diferentes, todas autovalidables.");

  assert.equal(OBVIOUS_CHARACTERS.length, 28);
  assert.equal(new Set(OBVIOUS_CHARACTERS.map((q) => q.answer.split("|")[0])).size, 28);
  const who = FIXED_PLAN.filter((task) => task.typeSlug === "quien-soy");
  assert.equal(who.length, 28);
  assert.ok(who.every((task) => task.prompt.includes("•") && task.prompt.split("•").length === 4));
  console.log("✓ ¿Quién soy?: 28 personajes conocidos con las 3 pistas visibles.");

  const memory = FIXED_PLAN.filter((task) => task.typeSlug === "memoria");
  assert.equal(memory.length, 28);
  for (const task of memory) {
    assert.match(task.answer, /^\d{7}$/);
    assert.equal(task.meta.memorize?.seconds, 5);
    assert.match(task.meta.memorize?.text ?? "", /^\d( \d){6}$/);
  }
  console.log("✓ Memoria: 28 números de 7 cifras, todos visibles exactamente 5 segundos.");
}

void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
