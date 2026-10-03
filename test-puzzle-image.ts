/** Prueba local: npx tsx scripts/test-puzzle-image.ts (preview en puerto 3000). */
import "dotenv/config";
import assert from "node:assert/strict";
import sharp from "sharp";
import { asc, eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { games, players, tasks } from "../src/db/schema";

const BASE = "http://127.0.0.1:3000";

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? "").hostname;
  assert.ok(["localhost", "127.0.0.1"].includes(host), "Esta prueba solo puede ejecutarse en una base de datos LOCAL, nunca en Neon/producción.");
  const before = await db.select().from(tasks).orderBy(asc(tasks.id));
  const playerBefore = await db.select().from(players).orderBy(asc(players.id));
  const gameBefore = await db.select().from(games).orderBy(asc(games.id));
  const puzzles = before.filter((task) => task.typeSlug === "puzzle" && task.meta.puzzle);
  assert.equal(puzzles.length, 28, "Prepara el juego local antes de ejecutar esta prueba.");

  async function upload(bytes: Uint8Array, type = "image/png") {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(bytes)], { type }), "foto-prueba.png");
    return fetch(`${BASE}/api/judge/puzzle-image`, { method: "POST", body: form });
  }

  try {
    const meta = puzzles[0].meta;
    assert.ok(meta.puzzle);
    await db.update(tasks).set({ meta: { ...meta, puzzle: { ...meta.puzzle, image: "/images/puzzle/__foto_ausente__.jpg" } } }).where(eq(tasks.id, puzzles[0].id));
    const missing = await fetch(`${BASE}/api/puzzle-image/${puzzles[0].id}`);
    assert.equal(missing.status, 404);
    console.log("✓ Imagen ausente detectada sin sustituirla por otra foto.");

    const wrongType = await upload(new TextEncoder().encode("<svg></svg>"), "image/svg+xml");
    assert.equal(wrongType.status, 415);
    const corrupt = await upload(new TextEncoder().encode("no es un JPEG"), "image/jpeg");
    assert.equal(corrupt.status, 400);
    const tooBig = await upload(new Uint8Array(3 * 1024 * 1024 + 1));
    assert.equal(tooBig.status, 413);
    console.log("✓ Archivos incorrectos, SVG y archivos demasiado grandes rechazados.");

    const photo = await sharp({ create: { width: 600, height: 800, channels: 3, background: "#53a9da" } }).png().toBuffer();
    const response = await upload(photo);
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    assert.equal(result.count, 28);
    assert.equal(result.width, 600);
    assert.equal(result.height, 800);
    const loaded = await fetch(`${BASE}${result.imageUrl}`);
    assert.equal(loaded.status, 200);
    assert.equal(loaded.headers.get("content-type"), "image/jpeg");
    const decoded = await sharp(Buffer.from(await loaded.arrayBuffer())).metadata();
    assert.equal(decoded.width, 600);
    assert.equal(decoded.height, 800);
    console.log("✓ Foto subida, guardada y servida conservando la proporción vertical 3:4.");

    const stateResponse = await fetch(`${BASE}/api/fixed-state`);
    const json = await stateResponse.text();
    assert.equal(stateResponse.status, 200);
    assert.ok(!json.includes("data:image/"), "Las fotos no se deben duplicar dentro del JSON del panel.");
    assert.ok(json.length < 1_000_000);
    const state = JSON.parse(json);
    for (const player of state.players) {
      const puzzle = player.tasks.find((task: { typeSlug: string }) => task.typeSlug === "puzzle");
      assert.match(puzzle.meta.puzzle.image, /^\/api\/puzzle-image\/\d+$/);
    }
    console.log("✓ Las fotos se cargan por separado; el JSON del panel sigue siendo pequeño.");

    const after = await db.select().from(tasks).orderBy(asc(tasks.id));
    assert.equal(after.length, before.length);
    after.forEach((row, index) => {
      const original = before[index];
      if (original.meta.puzzle) {
        assert.ok(row.meta.puzzle?.image.startsWith("data:image/jpeg;base64,"));
        row.meta.puzzle = { ...row.meta.puzzle!, image: original.meta.puzzle.image };
      }
      assert.deepEqual(row, original);
    });
    assert.deepEqual(await db.select().from(players).orderBy(asc(players.id)), playerBefore);
    assert.deepEqual(await db.select().from(games).orderBy(asc(games.id)), gameBefore);
    console.log("✓ Las 420 asignaciones, todas las respuestas, las ediciones y el progreso permanecen idénticos.");
  } finally {
    await db.transaction(async (tx) => {
      for (const task of puzzles) await tx.update(tasks).set({ meta: task.meta }).where(eq(tasks.id, task.id));
    });
    assert.deepEqual(await db.select().from(tasks).orderBy(asc(tasks.id)), before);
    console.log("✓ Imágenes originales de ensayo restauradas; no se reinició la partida.");
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
