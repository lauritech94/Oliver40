/** npx tsx scripts/test-trap-questions.ts — valida las 28 preguntas trampa fáciles. */
import assert from "node:assert/strict";
import { TRAMPAS, trampaDrafts } from "../src/lib/content/extras";
import { FIXED_PLAN, FIXED_PLAYER_NAMES } from "../src/lib/fixed-plan";
import { answersMatch } from "../src/lib/utils";

assert.equal(TRAMPAS.length, 28, `Deben existir exactamente 28 preguntas, hay ${TRAMPAS.length}.`);
assert.equal(new Set(TRAMPAS.map((item) => item.q.trim().toLocaleLowerCase("es"))).size, 28, "Las 28 preguntas deben ser diferentes.");
for (const [index, item] of TRAMPAS.entries()) {
  assert.ok(item.q.trim().endsWith("?"), `La pregunta ${index + 1} debe ser una pregunta completa.`);
  assert.ok(item.a.trim(), `La pregunta ${index + 1} no tiene respuesta.`);
  assert.ok(answersMatch(item.a, item.a), `La respuesta ${index + 1} no se valida a sí misma.`);
  assert.ok(!("h" in item), `La pregunta ${index + 1} no puede tener pista.`);
}
console.log("✓ Banco: 28 preguntas diferentes, breves, con respuesta y sin pistas.");

const generated = trampaDrafts(FIXED_PLAYER_NAMES.length);
assert.equal(generated.length, 28);
assert.equal(new Set(generated.map((draft) => draft.prompt)).size, 28, "Cada persona debe recibir una pregunta diferente.");
assert.ok(generated.every((draft) => draft.answer.trim() && !draft.hint));
console.log("✓ Generador: las 28 personas reciben 28 preguntas diferentes.");

const plan = FIXED_PLAN.filter((task) => task.typeSlug === "trampa");
assert.equal(plan.length, 28, `El plan fijo debe contener 28 preguntas trampa, hay ${plan.length}.`);
assert.equal(new Set(plan.map((task) => task.prompt)).size, 28, "El plan fijo no puede repetir preguntas trampa.");
assert.ok(plan.every((task) => task.answer.trim() && !task.hint));
for (const task of plan) assert.ok(answersMatch(task.answer, task.answer));
console.log("✓ Plan v6: 28 preguntas trampa únicas, una por jugador, todas autovalidables.");
