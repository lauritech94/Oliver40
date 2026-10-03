import { generateRun, type GeneratedTask } from "./game";
import { mulberry32 } from "./rand";
import type { PlayerInfo } from "./types";

/** Esta es la única partida. Cambiarla supone cambiar las 420 tarjetas impresas. */
export const FIXED_GAME_CODE = "GYMKHANA";
export const FIXED_GAME_NAME = "La gymkhana";
export const FIXED_CARD_COUNT = 420;
export const FIXED_PLAN_VERSION = "gymkhana-28-v3";

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

  // La generación actual usa Math.random en los constructores de pruebas.
  // Se fija sincrónicamente aquí y se restaura enseguida: por tanto el plan es
  // reproducible y jamás vuelve a sortearse durante una partida.
  const originalRandom = Math.random;
  Math.random = mulberry32(OFFICIAL_SEED);
  try {
    return generateRun(players, FIXED_CARD_COUNT);
  } finally {
    Math.random = originalRandom;
  }
}

/** Manifiesto definitivo de las 420 pruebas, calculado una sola vez al cargar el módulo. */
export const FIXED_PLAN = buildFrozenPlan();
