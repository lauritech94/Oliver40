/** npx tsx scripts/test-puzzle-module.ts — sin base de datos ni servidor. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { isPuzzleSolved, placePuzzleTiles, scrambledPuzzleTiles, swapPuzzleTiles } from "../src/components/Puzzle";
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
// de @/lib/puzzle-board, fallaría aquí igual que en el despliegue incompleto.
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
assert.equal(legacy.placePuzzleTiles, placePuzzleTiles);
assert.equal(legacy.scrambledPuzzleTiles, scrambledPuzzleTiles);
assert.equal(legacy.swapPuzzleTiles, swapPuzzleTiles);
console.log("✓ Los imports antiguos siguen siendo compatibles sin duplicar la lógica.");

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
assert.deepEqual(placePuzzleTiles(ordered), ordered);
assert.equal(isPuzzleSolved(placePuzzleTiles(swapped)), true);

for (let run = 0; run < 1000; run += 1) {
  let tiles = scrambledPuzzleTiles(64);
  assert.equal(new Set(tiles).size, 64);
  assert.ok(tiles.every((tile) => Number.isInteger(tile) && tile >= 0 && tile < 64));
  assert.equal(isPuzzleSolved(tiles), false);
  for (let hint = 0; hint < 64 && !isPuzzleSolved(tiles); hint += 1) {
    tiles = placePuzzleTiles(tiles, 3);
    assert.equal(new Set(tiles).size, 64);
  }
  assert.equal(isPuzzleSolved(tiles), true);
}
console.log("✓ 1000 tableros: 64 piezas distintas, intercambios válidos y siempre resolubles.");
