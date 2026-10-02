import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { getCurrentPlayer } from "@/lib/session";
import { PROFILE_FIELDS } from "@/lib/content/profile";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const session = await getCurrentPlayer();
  if (!session) return Response.json({ error: "Sin sesión" }, { status: 401 });

  const body = (await request.json()) as { profile?: Record<string, unknown> };
  const incoming = body.profile ?? {};

  const profile: Record<string, string> = {};
  for (const field of PROFILE_FIELDS) {
    const raw = incoming[field.key];
    if (typeof raw !== "string") continue;
    const value = raw.trim().slice(0, 60);
    if (!value) continue;
    if (field.options && !field.options.includes(value)) continue;
    profile[field.key] = value;
  }

  await db.update(players).set({ profile }).where(eq(players.id, session.player.id));
  return Response.json({ ok: true, profile });
}
