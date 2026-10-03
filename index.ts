import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

let _pool: Pool | undefined;
let _db: NodePgDatabase | undefined;

function init(): NodePgDatabase {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. Añádela como variable de entorno en Vercel y ejecuta `npm run db:setup`.",
    );
  }
  _pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: url });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = _pool;
  }
  _db = drizzle(_pool);
  return _db;
}

/**
 * Cliente Drizzle. A nivel de código se usa como `db.select()`, `db.update()`, etc.
 * Internamente la conexión se crea en la primera consulta real, no al importar el módulo.
 * Esto permite que el build de Next.js se haga sin DATABASE_URL.
 */
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    const real = init();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    init();
    const real = _pool!;
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});