import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

/**
 * Comprueba antes del build que GitHub contiene todos los archivos del proyecto.
 * Si falta uno, Vercel solo informa del primer import roto; esta guía lista todos.
 */
const projectRoot = resolve(process.argv[2] ?? ".");

const REQUIRED = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "drizzle.config.ts",
  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/db/index.ts",
  "src/db/schema.ts",
  "src/lib/content/words.ts",
  "src/lib/content/static.ts",
  "src/lib/content/extras.ts",
  "src/lib/content/nonograms.json",
  "src/lib/catalog.ts",
  "src/lib/generators.ts",
  "src/lib/rand.ts",
  "src/lib/types.ts",
  "src/lib/fixed-plan.ts",
  "src/lib/fixed-game.ts",
  "src/components/Puzzle.tsx",
];

function walk(directory) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(path));
    else if ([".ts", ".tsx", ".mjs", ".js", ".jsx"].includes(extname(entry.name))) result.push(path);
  }
  return result;
}

function findModule(request, importer) {
  const base = request.startsWith("@/")
    ? join(projectRoot, "src", request.slice(2))
    : request.startsWith(".")
      ? resolve(dirname(importer), request)
      : null;
  if (!base) return null;
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.jsx`,
    `${base}.json`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
    join(base, "index.js"),
    join(base, "index.mjs"),
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? false;
}

const missingRequired = REQUIRED.filter((path) => !existsSync(join(projectRoot, path)));
const sourceRoot = join(projectRoot, "src");
const files = existsSync(sourceRoot) ? walk(sourceRoot) : [];
const missingImports = [];
const importPattern = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const request = match[1];
    if (!request.startsWith(".") && !request.startsWith("@/")) continue;
    const resolvedModule = findModule(request, file);
    if (resolvedModule === false) {
      missingImports.push(`${relative(projectRoot, file)} → ${request}`);
    }
  }
}

if (!missingRequired.length && !missingImports.length) {
  console.log(`✓ Estructura completa: ${files.length} archivos TypeScript/JavaScript revisados.`);
  process.exit(0);
}

console.error("\n❌ El repositorio no contiene todos los archivos del proyecto.\n");
if (missingRequired.length) {
  console.error("Archivos obligatorios que faltan:");
  for (const path of missingRequired) console.error(`  · ${path}`);
}
if (missingImports.length) {
  console.error("\nImports que no encuentran su archivo:");
  for (const item of missingImports) console.error(`  · ${item}`);
}
console.error(`
Cómo corregirlo:
  1. En GitHub, abre la ruta exacta que aparece arriba, por ejemplo:
     src/lib/content/words.ts
  2. Crea cada carpeta intermedia (src → lib → content) y copia el archivo completo.
  3. No coloques los archivos de src/ en la raíz ni los renombres.
  4. Vuelve a hacer commit en la rama que despliega Vercel.

Lo más fiable es subir la carpeta COMPLETA del proyecto (src, public, scripts,
drizzle y los archivos de la raíz) o hacer git push desde esta copia.
`);
process.exit(1);
