/**
 * Prepara la base de datos de la gymkhana.
 *
 *   npm run db:setup
 *
 * Hace dos cosas, y las dos se pueden repetir sin romper nada:
 *   1. Crea las tablas (migraciones de la carpeta ./drizzle).
 *   2. Siembra la única partida: 28 jugadores y sus 420 tarjetas fijas.
 *
 * Si la partida ya existe con el mismo plan, NO toca ninguna asignación.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("\n❌ Falta DATABASE_URL.");
    console.error("   Crea un archivo .env (copia .env.example) con la cadena de tu base de datos.\n");
    process.exit(1);
  }

  const safeHost = (() => {
    try {
      return new URL(connectionString).host;
    } catch {
      return "(no se pudo leer el host)";
    }
  })();

  console.log(`\n🔌 Conectando a ${safeHost}…`);
  const pool = new Pool({ connectionString });

  try {
    const db = drizzle(pool);

    console.log("📦 Creando las tablas si no existen…");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("   ✓ Tablas listas.");

    console.log("🎲 Sembrando la partida fija (28 jugadores · 420 tarjetas)…");
    const { ensureFixedGame } = await import("../src/lib/fixed-game");
    const game = await ensureFixedGame();
    console.log(`   ✓ Partida «${game.name}» · plan ${game.planVersion}`);

    const { rows } = await pool.query<{ players: string; tasks: string; cards: string }>(
      `select
         (select count(*) from players where game_id = $1)::text as players,
         (select count(*) from tasks where game_id = $1)::text as tasks,
         (select count(distinct card_number) from tasks where game_id = $1)::text as cards`,
      [game.id],
    );
    const stats = rows[0];

    console.log("\n✅ Todo listo:");
    console.log(`   · ${stats.players} jugadores`);
    console.log(`   · ${stats.tasks} pruebas`);
    console.log(`   · ${stats.cards} tarjetas NFC distintas`);

    if (stats.tasks !== "420" || stats.cards !== "420") {
      console.error("\n⚠️  Se esperaban 420 pruebas y 420 tarjetas. Revisa la base de datos.");
      process.exitCode = 1;
    }
    console.log("\n👉 Siguiente paso: abre /judge/print en tu web desplegada.\n");
  } catch (error) {
    console.error("\n❌ Error preparando la base de datos:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
