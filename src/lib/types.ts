export type NonogramData = { rows: number[][]; cols: number[][] };

/** Datos extra de una prueba (se guardan en tasks.meta). */
export type TaskMeta = {
  /** La respuesta es un dato de la ficha de otro jugador (se resuelve al validar). */
  profile?: { targetPlayerId: number; field: string };
  /** Texto que solo se enseña unos segundos (pruebas de memoria). */
  memorize?: { text: string; seconds: number };
  /** Pistas del nonograma interactivo. */
  nonogram?: NonogramData;
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
