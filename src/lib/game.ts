import { CHALLENGE_TYPES } from "./catalog";
import { shuffle } from "./rand";
import type { PlayerInfo, TaskMeta } from "./types";

export type GeneratedTask = {
  playerId: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  prompt: string;
  answer: string;
  hint: string;
  judgeNote: string;
  requiresJudge: boolean;
  needsSetup: boolean;
  meta: TaskMeta;
};

/**
 * Genera el recorrido completo de la partida:
 *  - cada jugador hace los 15 tipos de prueba, cada uno en un orden distinto
 *  - cada jugador tiene 15 tarjetas PROPIAS: ningún número de tarjeta se repite
 *    entre jugadores (se reparten de un pool barajado 1..poolSize)
 *  - los tipos con los que empiezan los jugadores se reparten para no saturar al juez
 *  - cada tipo genera una variante distinta por jugador
 */
export function generateRun(players: PlayerInfo[], poolSize: number): GeneratedTask[] {
  const typeCount = CHALLENGE_TYPES.length;
  const needed = players.length * typeCount;
  if (poolSize < needed) {
    throw new Error(`Hacen falta ${needed} tarjetas y solo hay ${poolSize}.`);
  }

  const cards = shuffle(Array.from({ length: poolSize }, (_, i) => i + 1));
  const drafts = CHALLENGE_TYPES.map((type) => type.build(players));
  const startOrder = shuffle(CHALLENGE_TYPES.map((_, i) => i));
  const allTypes = CHALLENGE_TYPES.map((_, i) => i);

  const tasks: GeneratedTask[] = [];
  players.forEach((player, p) => {
    const first = startOrder[p % typeCount];
    const order = [first, ...shuffle(allTypes.filter((i) => i !== first))];

    order.forEach((typeIdx, stepIndex) => {
      const type = CHALLENGE_TYPES[typeIdx];
      const draft = drafts[typeIdx][p];
      const pendingProfile = Boolean(draft.meta?.profile);
      tasks.push({
        playerId: player.id,
        stepIndex,
        cardNumber: cards[p * typeCount + stepIndex],
        typeSlug: type.slug,
        typeName: type.name,
        icon: type.icon,
        title: draft.title,
        prompt: draft.prompt,
        answer: draft.answer,
        hint: draft.hint ?? "",
        judgeNote: draft.judgeNote ?? "",
        requiresJudge: type.requiresJudge,
        needsSetup: pendingProfile,
        meta: draft.meta ?? {},
      });
    });
  });

  return tasks;
}
