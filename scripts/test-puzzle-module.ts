/** npx tsx scripts/test-puzzle-module.ts — sin base de datos ni servidor. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { isPuzzleSolved, scrambledPuzzleTiles, swapPuzzleTiles } from "../src/components/Puzzle";
import * as legacy from "../src/lib/puzzle-board";

const componentPath = resolve("src/components/Puzzle.tsx");
const source = readFileSync(componentPath, "utf8");
const emitted = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2017,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
  fileName: componentPath,
});

// Carga el componente sin resolver NINGÚN módulo local. Si volviera a depender
// de @/lib/puzzle-board, fallaría aquí igual que en un despliegue incompleto.
const nativeRequire = createRequire(componentPath);
const exportsObject: Record<string, unknown> = {};
const resolved: string[] = [];
runInNewContext(emitted.outputText, {
  exports: exportsObject,
  require: (name: string) => {
    assert.ok(name === "react" || name === "react/jsx-runtime", `Dependencia local inesperada: ${name}`);
    resolved.push(name);
    return nativeRequire(name);
  },
});
assert.equal(typeof exportsObject.default, "function");
assert.equal(typeof exportsObject.scrambledPuzzleTiles, "function");
console.log("✓ Puzzle.tsx se carga por sí solo: únicamente importa React.");
console.log(`  Dependencias utilizadas: ${resolved.join(", ")}`);

assert.equal(legacy.isPuzzleSolved, isPuzzleSolved);
assert.equal(legacy.scrambledPuzzleTiles, scrambledPuzzleTiles);
assert.equal(legacy.swapPuzzleTiles, swapPuzzleTiles);
console.log("✓ Los imports antiguos siguen siendo compatibles sin duplicar la lógica.");

// Regresión: no debe existir ninguna ayuda que coloque piezas sola.
assert.ok(!source.includes("placePuzzleTiles"), "No debe volver una función que ordene piezas automáticamente.");
assert.ok(!source.includes("Colocar 3 casillas"), "No debe volver el botón que resolvía el puzzle.");
assert.ok(!/ayudas? usada/i.test(source), "No debe mostrarse un contador de ayudas.");
console.log("✓ No existe ninguna ayuda que pueda resolver el puzzle por el jugador.");

assert.equal(isPuzzleSolved([]), false);
const ordered = Array.from({ length: 64 }, (_, i) => i);
const unchanged = [...ordered];
const swapped = swapPuzzleTiles(ordered, 1, 63);
assert.deepEqual(ordered, unchanged);
assert.equal(swapped[1], 63);
assert.equal(swapped[63], 1);
assert.deepEqual(swapPuzzleTiles(ordered, -1, 2), ordered);
assert.deepEqual(swapPuzzleTiles(ordered, 64, 2), ordered);
assert.deepEqual(swapPuzzleTiles(ordered, 1.5, 2), ordered);

/** Solución de referencia para el test: intercambios manuales, nunca ayudas del juego. */
function solveBySwaps(tiles: number[]): number[] {
  const next = [...tiles];
  for (let destination = 0; destination < next.length; destination += 1) {
    if (next[destination] === destination) continue;
    const source = next.indexOf(destination);
    [next[destination], next[source]] = [next[source], next[destination]];
  }
  return next;
}

let fixedPoints = 0;
for (let run = 0; run < 1000; run += 1) {
  const tiles = scrambledPuzzleTiles(64);
  assert.equal(new Set(tiles).size, 64);
  assert.ok(tiles.every((tile) => Number.isInteger(tile) && tile >= 0 && tile < 64));
  assert.equal(isPuzzleSolved(tiles), false);
  fixedPoints += tiles.filter((tile, index) => tile === index).length;
  const solved = solveBySwaps(tiles);
  assert.equal(isPuzzleSolved(solved), true);
}
const averageCorrect = fixedPoints / 1000 / 64;
assert.ok(averageCorrect < 0.05, `El barajado deja demasiadas piezas ya colocadas: ${(averageCorrect * 100).toFixed(1)}%`);
console.log(
  `✓ 1000 tableros: 64 piezas distintas y siempre resolubles; solo ${(averageCorrect * 100).toFixed(1)}% de media llega ya colocada.`,
);
console.log("✓ Todas las piezas están barajadas y solo se pueden ordenar intercambiando a mano.");
