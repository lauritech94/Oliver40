import { CHALLENGE_TYPES } from "./catalog";
import type { GeneratedTask } from "./game";
import { FIXED_LAYOUT } from "./fixed-layout";
import { mulberry32 } from "./rand";
import type { PlayerInfo } from "./types";

/** Esta es la única partida. Cambiarla supone cambiar el contenido, no los números impresos. */
export const FIXED_GAME_CODE = "GYMKHANA";
export const FIXED_GAME_NAME = "La gymkhana";
export const FIXED_CARD_COUNT = 420;
export const FIXED_PLAN_VERSION = "gymkhana-28-v7";

/** Orden oficial de la lista de jugadores: también fija su número J01…J28. */
export const FIXED_PLAYER_NAMES = [
  "Oli",
  "Piti",
  "Alex",
  "Gemma",
  "Lucy",
  "Hector",
  "Burris",
  "Alex Brasi",
  "Rafa",
  "Marc Arias",
  "Nacho",
  "Gallo",
  "Gina",
  "David Ferez",
  "David CG",
  "Mero",
  "Jen",
  "Sergi Llibre",
  "Victor",
  "Laia",
  "Sergi Martinez",
  "Gerard",
  "Sandra",
  "Marc Lloveras",
  "Berta",
  "Isa",
  "Angel",
  "Diego",
] as const;

const OFFICIAL_SEED = 0x28_15_42_01;

function buildFrozenPlan(): GeneratedTask[] {
  const players: PlayerInfo[] = FIXED_PLAYER_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    slot: index + 1,
  }));

  const originalRandom = Math.random;
  Math.random = mulberry32(OFFICIAL_SEED);
  try {
    const draftsByType = new Map(
      CHALLENGE_TYPES.map((type) => [type.slug, type.build(players)] as const),
    );
    const typesBySlug = new Map(CHALLENGE_TYPES.map((type) => [type.slug, type] as const));
    const output: GeneratedTask[] = [];

    FIXED_LAYOUT.forEach((steps, playerIndex) => {
      steps.forEach(([cardNumber, slug], stepIndex) => {
        const type = typesBySlug.get(slug);
        const drafts = draftsByType.get(slug);
        if (!type || !drafts?.[playerIndex]) {
          throw new Error(`El mapa fijo usa un tipo inexistente: ${slug} (J${playerIndex + 1}, paso ${stepIndex + 1}).`);
        }
        const draft = drafts[playerIndex];
        output.push({
          playerId: playerIndex + 1,
          stepIndex,
          cardNumber,
          typeSlug: type.slug,
          typeName: type.name,
          icon: type.icon,
          title: draft.title,
          prompt: draft.prompt,
          answer: draft.answer,
          hint: "",
          judgeNote: draft.judgeNote ?? "",
          requiresJudge: type.requiresJudge,
          needsSetup: Boolean(draft.meta?.profile),
          meta: draft.meta ?? {},
        });
      });
    });

    if (output.length !== FIXED_CARD_COUNT || new Set(output.map((task) => task.cardNumber)).size !== FIXED_CARD_COUNT) {
      throw new Error("El mapa fijo debe contener exactamente 420 números de tarjeta únicos.");
    }
    return output;
  } finally {
    Math.random = originalRandom;
  }
}

/** Manifiesto definitivo: tarjetas/orden congelados, contenido actualizable por versión. */
export const FIXED_PLAN = buildFrozenPlan();
