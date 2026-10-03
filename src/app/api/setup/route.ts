import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { FIXED_PLAN, FIXED_PLAYER_NAMES } from "@/lib/fixed-plan";
import { SETUP_SQL } from "@/lib/setup-sql";
import { isMissingTablesError } from "@/lib/setup-error";

export const dynamic = "force-dynamic";

type Status = {
  databaseUrl: boolean;
  tables: boolean;
  seeded: boolean;
  planVersion: string | null;
  counts: { players: number; tasks: number; cards: number } | null;
  error?: string;
};

async function readStatus(): Promise<Status> {
  const status: Status = {
    databaseUrl: Boolean(process.env.DATABASE_URL),
    tables: false,
    seeded: false,
    planVersion: null,
    counts: null,
  };

  if (!status.databaseUrl) {
    status.error = "Falta la variable de entorno DATABASE_URL en Vercel.";
    return status;
  }

  try {
    const [playerCount] = await db.select({ total: count() }).from(players);
    const [taskCount] = await db.select({ total: count() }).from(tasks);
    const [cardCount] = await db
      .select({ total: count() })
      .from(tasks)
      .where(eq(tasks.requiresJudge, true));

    status.tables = true;
    status.counts = {
      players: Number(playerCount.total),
      tasks: Number(taskCount.total),
      // «cards» del estado previo se reemplaza abajo con tarjetas únicas reales.
      cards: Number(cardCount.total),
    };

    const result = await db.execute<{ total: string }>(
      // tarjetas NFC distintas (debe ser 420)
      "select count(distinct card_number)::text as total from tasks",
    );
    const distinctCards = Number(result.rows[0]?.total ?? 0);

    status.counts = {
      players: Number(playerCount.total),
      tasks: Number(taskCount.total),
      cards: distinctCards,
    };
    status.seeded =
      status.counts.players === FIXED_PLAYER_NAMES.length &&
      status.counts.tasks === FIXED_PLAN.length &&
      status.counts.cards === FIXED_PLAN.length;

    const game = await ensureFixedGame().catch(() => null);
    status.planVersion = game?.planVersion ?? null;
    return status;
  } catch (error) {
    if (isMissingTablesError(error)) return status;
    status.error = error instanceof Error ? error.message : "Error desconocido";
    return status;
  }
}

export async function GET() {
  return Response.json(await readStatus());
}

export async function POST() {
  const before = await readStatus();
  if (!before.databaseUrl) {
    return Response.json({ error: before.error, status: before }, { status: 503 });
  }

  try {
    await db.execute(SETUP_SQL);
    const game = await ensureFixedGame();
    const after = await readStatus();

    return Response.json({ ok: true, planVersion: game.planVersion, status: after });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Error inesperado",
        status: await readStatus(),
      },
      { status: 500 },
    );
  }
}
