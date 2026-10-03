import { clearPlayerCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearPlayerCookie();
  return Response.json({ ok: true });
}
