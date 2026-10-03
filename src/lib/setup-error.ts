/**
 * Detecta el típico "la tabla no existe" de PostgreSQL (código 42P01).
 *
 * Drizzle envuelve los errores en DrizzleQueryError y pierde el código, así que hay
 * que recorrer la cadena de `cause` para llegar al error original del driver.
 */
export function isMissingTablesError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current; depth += 1) {
    if (typeof current === "object") {
      const candidate = current as { code?: string; message?: string; cause?: unknown };
      if (candidate.code === "42P01") return true;
      const message = candidate.message ?? "";
      if (/relation "[^"]+" does not exist/i.test(message)) return true;
      if (/does not exist/i.test(message) && /relation|table/i.test(message)) return true;
      current = candidate.cause;
    } else {
      break;
    }
  }
  return false;
}

export const SETUP_MESSAGE =
  "La base de datos todavía no está preparada. Ábrela en /setup y pulsa el botón, o ejecuta `npm run db:setup`.";

/** Convierte un fallo de arranque en una respuesta JSON entendible. */
export function setupErrorResponse(error: unknown): Response {
  if (isMissingTablesError(error)) {
    return Response.json(
      { error: SETUP_MESSAGE, needsSetup: true, setupUrl: "/setup" },
      { status: 503 },
    );
  }
  const message = error instanceof Error ? error.message : "Error inesperado";
  return Response.json({ error: message }, { status: 500 });
}
