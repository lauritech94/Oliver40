import { and, asc, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { puzzleImageUrl } from "@/lib/puzzle-images";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_UPLOAD = 3 * 1024 * 1024;
const MAX_STORED = 300 * 1024;

export async function GET() {
  try {
    const game = await ensureFixedGame();
    const rows = await db
      .select({ id: tasks.id, uploaded: sql<boolean>`${tasks.meta}->'puzzle'->>'image' like 'data:image/%'` })
      .from(tasks)
      .where(and(eq(tasks.gameId, game.id), eq(tasks.typeSlug, "puzzle")))
      .orderBy(asc(tasks.id));
    return Response.json({
      count: rows.length,
      uploadedCount: rows.filter((row) => row.uploaded).length,
      imageUrl: rows[0] ? puzzleImageUrl(rows[0].id) : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("No se pudo consultar la foto del puzzle", error);
    return Response.json({ error: "No se pudo cargar la configuración de la foto." }, { status: 503 });
  }
}

/**
 * Un único archivo elegido explícitamente por el juez para todos los puzzles.
 * Solo modifica meta.puzzle.image: conserva preguntas, respuestas, NFC y progreso.
 * No escribe archivos en el disco efímero de Vercel y no necesita tablas nuevas.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Abre el editor en el mismo dominio del juego." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > MAX_UPLOAD + 128 * 1024) {
    return Response.json({ error: "La foto debe ocupar como máximo 3 MB." }, { status: 413 });
  }

  let file: File;
  try {
    const form = await request.formData();
    const image = form.get("image");
    if (!(image instanceof File) || !image.size) {
      return Response.json({ error: "Selecciona una foto JPG, PNG o WebP." }, { status: 400 });
    }
    file = image;
  } catch {
    return Response.json({ error: "No se pudo leer el archivo enviado." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD) {
    return Response.json({ error: "La foto debe ocupar como máximo 3 MB." }, { status: 413 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return Response.json({ error: "Formato no admitido. Usa JPG, PNG o WebP." }, { status: 415 });
  }

  let dataUrl: string;
  let dimensions: { width: number; height: number };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 256 || (metadata.pages ?? 1) > 1) {
      return Response.json({ error: "Usa una foto sin animación de al menos 256 × 256 píxeles." }, { status: 400 });
    }
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
      return Response.json({ error: "El contenido del archivo no es una imagen admitida." }, { status: 415 });
    }
    const { data, info } = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .timeout({ seconds: 10 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > MAX_STORED) {
      return Response.json({ error: "La imagen es demasiado pesada. Exporta una versión JPG más pequeña y vuelve a probar." }, { status: 413 });
    }
    dataUrl = `data:image/jpeg;base64,${data.toString("base64")}`;
    dimensions = { width: info.width, height: info.height };
  } catch {
    return Response.json({ error: "No se pudo abrir la foto. Comprueba que el JPG, PNG o WebP no esté dañado." }, { status: 400 });
  }

  try {
    const game = await ensureFixedGame();
    const updated = await db.update(tasks)
      .set({ meta: sql`jsonb_set(${tasks.meta}, '{puzzle,image}', to_jsonb(${dataUrl}::text), true)` })
      .where(and(eq(tasks.gameId, game.id), eq(tasks.typeSlug, "puzzle"), sql`jsonb_typeof(${tasks.meta}->'puzzle') = 'object'`))
      .returning({ id: tasks.id });
    if (!updated.length) return Response.json({ error: "No hay puzzles en esta partida." }, { status: 409 });
    return Response.json({
      ok: true,
      count: updated.length,
      imageUrl: puzzleImageUrl(updated[0].id),
      ...dimensions,
      message: `Foto guardada en los ${updated.length} puzzles. No se ha cambiado el progreso ni ninguna tarjeta.`,
    });
  } catch (error) {
    console.error("No se pudo guardar la foto del puzzle", error);
    return Response.json({ error: "No se pudo guardar la foto. Vuelve a intentarlo; no reinicies la partida." }, { status: 503 });
  }
}
