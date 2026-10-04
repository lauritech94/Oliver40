export type NonogramData = { rows: number[][]; cols: number[][] };

export type CardMinigame =
  | { kind: "maze"; size: number; cells: number[]; start: number; end: number }
  | { kind: "intruder"; rounds: { base: string; odd: string; index: number }[] }
  | { kind: "stopwatch"; targetMs: number; attempts: number };

/** Datos extra de una prueba (se guardan en tasks.meta). */
export type TaskMeta = {
  /** La respuesta es un dato de la ficha de otro jugador (se resuelve al validar). */
  profile?: { targetPlayerId: number; field: string };
  /** Texto que solo se enseña unos segundos (pruebas de memoria). */
  memorize?: { text: string; seconds: number };
  /** Pistas del nonograma interactivo. */
  nonogram?: NonogramData;
  /** Puzzle interactivo de casillas (actualmente 6×6). */
  puzzle?: { image: string; size: number; word: string };
  /** Minijuego de habilidad integrado en una tarjeta. */
  minigame?: CardMinigame;
};

/** Una prueba concreta, ya generada para un jugador. */
export type Draft = {
  title: string;
  prompt: string;
  /** Admite alternativas separadas por "|" (p. ej. "el rey leon|rey leon"). */
  answer: string;
  hint?: string;
  judgeNote?: string;
  meta?: TaskMeta;
};

export type PlayerInfo = { id: number; name: string; slot: number };
