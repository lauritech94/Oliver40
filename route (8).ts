import { getPlayerTasks } from "@/lib/queries";
import { getCurrentPlayer } from "@/lib/session";
import { ensureFixedGame } from "@/lib/fixed-game";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureFixedGame();
  const session = await getCurrentPlayer();
  if (!session) return Response.json({ player: null }, { status: 401 });

  const { player, game } = session;
  const tasks = await getPlayerTasks(player.id);
  const current = tasks.find((t) => t.stepIndex === player.currentStep && !t.solvedAt) ?? null;

  // No revelar al jugador los números/tipos de las tarjetas que aún están cerradas.
  const grid = tasks.map((task) => {
    const solved = Boolean(task.solvedAt);
    const active = !solved && task.stepIndex === player.currentStep;
    const visible = solved || active;
    return {
      stepIndex: task.stepIndex,
      solved,
      active,
      cardNumber: visible ? task.cardNumber : null,
      typeName: visible ? task.typeName : null,
      icon: visible ? task.icon : null,
      title: visible ? task.title : null,
    };
  });

  return Response.json({
    game: { name: game.name, status: game.status },
    player: {
      id: player.id,
      name: player.name,
      emoji: player.emoji,
      slot: player.slot,
      profile: player.profile ?? {},
      currentStep: player.currentStep,
      startedAt: player.startedAt,
      finishedAt: player.finishedAt,
    },
    currentCard: current?.cardNumber ?? null,
    totalSteps: tasks.length,
    solvedCount: tasks.filter((t) => t.solvedAt).length,
    grid,
    history: tasks
      .filter((t) => t.solvedAt)
      .map((t) => ({
        stepIndex: t.stepIndex,
        cardNumber: t.cardNumber,
        typeName: t.typeName,
        icon: t.icon,
        title: t.title,
        solvedAt: t.solvedAt,
        attempts: t.attempts,
      })),
  });
}
