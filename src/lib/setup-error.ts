/** Detecta el típico "la tabla no existe" de PostgreSQL (código 42P01). */
export function isMissingTablesError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  if (code === "42P01") return true;
  const message = (error as { message?: string }).message ?? "";
  return /relation .* does not exist/i.test(message);
}

export const SETUP_MESSAGE =
  "La base de datos todavía no está preparada. Ejecuta `npm run db:setup` apuntando a la DATABASE_URL de producción.";

/** Convierte un fallo de arranque en una respuesta JSON entendible. */
export function setupErrorResponse(error: unknown): Response {
  if (isMissingTablesError(error)) {
    return Response.json({ error: SETUP_MESSAGE, needsSetup: true }, { status: 503 });
  }
  const message = error instanceof Error ? error.message : "Error inesperado";
  return Response.json({ error: message }, { status: 500 });
}
