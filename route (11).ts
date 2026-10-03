import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Sirve solo la imagen; nunca envía la respuesta ni otros datos de la prueba. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ error: "Imagen no encontrada." }, { status: 404 });
  }

  try {
    const [row] = await db
      .select({ image: sql<string | null>`${tasks.meta}->'puzzle'->>'image'` })
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    const image = row?.image;
    if (!image) return Response.json({ error: "Esta tarjeta no tiene foto." }, { status: 404 });

    const inline = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image);
    if (inline) {
      return new Response(new Uint8Array(Buffer.from(inline[2], "base64")), {
        headers: {
          "Content-Type": inline[1],
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Compatibilidad con las fotos de las tarjetas ya existentes: no hay migración
    // ni cambio del plan. Las URLs /images/... corresponden a la carpeta public/.
    if (/^\/images\/puzzle\/[A-Za-z0-9_./-]+\.(jpg|jpeg|png|webp)$/i.test(image) && !image.includes("..")) {
      return new Response(null, {
        status: 307,
        headers: {
          Location: new URL(image, request.url).toString(),
          "Cache-Control": "no-store",
        },
      });
    }
    return Response.json({ error: "La ruta de la foto no es válida. Cárgala desde el editor de jueces." }, { status: 404 });
  } catch (error) {
    console.error("No se pudo servir la foto del puzzle", error);
    return Response.json({ error: "No se pudo cargar la foto. Inténtalo de nuevo." }, { status: 503 });
  }
}
