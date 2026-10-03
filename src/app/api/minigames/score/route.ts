import { getCurrentPlayer } from "@/lib/session";
import { SCORE_RANGE, submitScore } from "@/lib/minigames";

export const dynamic = "force-dynamic";

/** Registra automáticamente una marca. No hace falta ningún botón. */
export async function POST(request: Request) {
  try {
    const session = await getCurrentPlayer();
    if (!session) {
      return Response.json(
        { error: "Entra con tu nombre para registrar tu marca." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { slug?: unknown; score?: unknown };
    const slug = typeof body.slug === "string" ? body.slug : "";
    const score = Math.round(Number(body.score));

    const range = SCORE_RANGE[slug];
    if (!range) {
      return Response.json({ error: "Minijuego desconocido." }, { status: 400 });
    }
    if (!Number.isFinite(score) || score < range.min || score > range.max) {
      return Response.json(
        { error: `Marca fuera de rango (${range.min}–${range.max} ms).` },
        { status: 400 },
      );
    }

    const result = await submitScore(session.player.id, slug, score);
    return Response.json({ ok: true, score, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la marca.";
    return Response.json({ error: message }, { status: 500 });
  }
}
