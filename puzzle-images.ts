import type { TaskMeta } from "./types";

/** No incluir la foto codificada 28 veces en las respuestas JSON del panel. */
export function puzzleImageUrl(taskId: number): string {
  return `/api/puzzle-image/${taskId}`;
}

export function publicPuzzleMeta(taskId: number, meta: TaskMeta): TaskMeta {
  if (!meta.puzzle) return meta;
  return { ...meta, puzzle: { ...meta.puzzle, image: puzzleImageUrl(taskId) } };
}
