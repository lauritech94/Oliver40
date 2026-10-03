/** npx tsx scripts/test-no-hints.ts — reglas de dificultad: ninguna prueba lleva pista. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FIXED_PLAN } from "../src/lib/fixed-plan";

// 1. El plan que se siembra en la base de datos no contiene ninguna pista.
const hints = FIXED_PLAN.map((task, index) => ({ index, hint: (task.hint ?? "").trim() })).filter(
  (task) => task.hint,
);
assert.equal(
  hints.length,
  0,
  `Hay ${hints.length} pruebas con pista en el plan: ${hints.slice(0, 5).map((h) => `#${h.index} "${h.hint}"`).join(", ")}`,
);
console.log(`✓ Plan fijo: 0 pistas en las ${FIXED_PLAN.length} pruebas.`);

// 2. El plan nunca puede generarse con pista aunque un generador intente devolver una.
const gameSource = readFileSync(resolve("src/lib/game.ts"), "utf8");
assert.ok(
  /hint:\s*""/.test(gameSource) && !/hint:\s*draft\.hint/.test(gameSource),
  "generateRun debe forzar hint vacío; si se reutiliza draft.hint las pistas volverán.",
);
console.log("✓ generateRun descarta cualquier pista producida por los generadores.");

// 3. La app del jugador no tiene botón ni texto de pista, y el servidor no las sirve.
const cardPage = readFileSync(resolve("src/app/c/[card]/page.tsx"), "utf8");
assert.ok(!cardPage.includes("Pedir pista"), "No debe volver el botón de pedir pista.");
assert.ok(!cardPage.includes("hasHint"), "El jugador no debe recibir datos de pista.");
assert.ok(!/💡[^<]*pista/i.test(cardPage), "No debe mostrarse un texto de pista.");

const cardApi = readFileSync(resolve("src/app/api/cards/[card]/route.ts"), "utf8");
assert.ok(!/action === "hint"/.test(cardApi), "La API no debe poder devolver pistas.");
assert.ok(!cardApi.includes("hasHint"), "La API no debe exponer si hay pista.");

// 4. Nadie puede reintroducir una pista desde el editor de jueces.
const editor = readFileSync(resolve("src/app/judge/edit/page.tsx"), "utf8");
assert.ok(!editor.includes("Pista (opcional)"), "El editor no debe tener campo de pista.");
assert.ok(!/draft\.hint/.test(editor), "El editor no debe editar pistas.");

const taskApi = readFileSync(resolve("src/app/api/tasks/[id]/route.ts"), "utf8");
assert.ok(
  !/"hint"/.test(taskApi),
  "El endpoint de edición no debe aceptar guardar pistas.",
);

console.log("✓ Interfaz, API y editor: ninguna vía para pedir, ver o guardar pistas.");
console.log("✓ Dificultad máxima confirmada: ninguna prueba de la gymkhana lleva pista.");
