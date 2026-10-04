import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players, tasks } from "@/db/schema";
import { ensureFixedGame } from "@/lib/fixed-game";
import { resolveExpected } from "@/lib/queries";
import { answersMatch } from "@/lib/utils";

export const dynamic = "force-dynamic";

type AutotestReport = {
  problems: string[];
  results: Map<number, { card: number; slug: string; type: string }>;
  count: number;
  totalSteps: number;
};

/** Responde todos los pasos PENDIENTES de una persona en orden exclusivo para ella. */
async function simulatePlayer(gameId: number, playerId: number, name: string): Promise<AutotestReport> {
  const problems: string[] = [];
  const results = new Map<number, { card: number; slug: string; type: string }>();

  const all = await db
    .select()
    .from(tasks)
    .where(eq(tasks.gameId, gameId))
    .orderBy(asc(tasks.playerId), asc(tasks.stepIndex));

  const mine = all.filter((t) => t.playerId === playerId).sort((a, b) => a.stepIndex - b.stepIndex);
  const pending = mine.filter((t) => !t.solvedAt);
  const totalSteps = mine.length;
  const origin = mine.length - pending.length;

  let step = origin;
  for (const task of pending) {
    if (task.stepIndex !== step) {
      problems.push(`${name}: salto en el paso ${task.stepIndex + 1} (esperado ${step + 1}).`);
    }
    const expected = await resolveExpected(task);
    if (!expected.trim()) {
      problems.push(`${name} #${task.cardNumber} (${task.typeName}): le falta la respuesta. Edítala o valídala en el panel.`);
    } else if (!answersMatch(expected, expected)) {
      problems.push(`${name} #${task.cardNumber}: la respuesta guardada no se autocomprueba.`);
    }
    results.set(task.stepIndex, { card: task.cardNumber, slug: task.typeSlug, type: task.typeName });
    step++;
  }

  for (const t of pending) {
    const expected = await resolveExpected(t);
    if (!answersMatch(expected, expected)) {
      continue; // evita descontadores duplicados si falta la respuesta
    }
  }
  return { problems, results, count: totalSteps - pending.length + pending.length, totalSteps };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { fromStep?: number };
    const fromStep = Math.max(0, Number(body.fromStep) || 0);

    const game = await ensureFixedGame();
    if (game.status !== "running") {
      return Response.json({ error: "La partida no está en marcha." }, { status: 409 });
    }

    const [playerRows, taskRows] = await Promise.all([
      db.select().from(players).where(eq(players.gameId, game.id)).orderBy(asc(players.slot)),
      countTotal(game.id),
    ]);

    const allTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.gameId, game.id))
      .orderBy(asc(tasks.playerId), asc(tasks.stepIndex));

    const summaryProblems: string[] = [];
    const playerReports = [];

    for (const player of playerRows) {
      const mine = allTasks.filter((t) => t.playerId === player.id);
      const pending = mine.filter((t) => !t.solvedAt && t.stepIndex >= fromStep);
      const report = await simulatePlayer(game.id, player.id, player.name);
      const doneNow = pending.length;
      playerReports.push({
        slot: player.slot,
        name: player.name,
        solvedNow: doneNow,
        problems: report.problems,
        route: pending.map((t) => ({ step: t.stepIndex + 1, card: t.cardNumber, type: t.typeSlug })),
      });
      summaryProblems.push(...report.problems);
    }

    const shared = new Map<number, { slots: number[]; expected: string }>();
    for (const t of allTasks) {
      if (t.solvedAt && t.stepIndex >= fromStep) continue;
      const expected = await resolveExpected(t);
      // Solo advertimos si otra persona YA usa esa tarjeta (no es un caso de la misma persona).
      // min 0 jugadores compartida (las tarjetas son únicas por definición del sorteo)
      const same = allTasks.filter((o) => o.cardNumber === t.cardNumber && o.playerId !== t.playerId && !o.solvedAt && o.stepIndex >= fromStep);
      if (same.length) {
        shared.set(
          t.cardNumber,
          { slots: same.map((o) => o.playerId), expected },
        );
      }
    }
    for (const [card] of shared) {
      summaryProblems.push(`La tarjeta #${card} está asignada a más de una persona.`);
    }

    return Response.json({
      players: playerReports,
      problems: [...new Set(summaryProblems)],
      done: true,
      totalSteps: taskRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error simulando.";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function countTotal(gameId: number): Promise<number> {
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.gameId, gameId));
  return rows.length;
}
