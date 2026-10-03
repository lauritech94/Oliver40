/** Utilidades puras del puzzle: las piezas siempre son una permutación completa. */
export function isPuzzleSolved(tiles: readonly number[]): boolean {
  return tiles.length > 0 && tiles.every((value, index) => value === index);
}

export function swapPuzzleTiles(tiles: readonly number[], a: number, b: number): number[] {
  const next = [...tiles];
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= next.length || b >= next.length) return next;
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/** Una ayuda hace intercambios, nunca duplica ni elimina piezas. */
export function placePuzzleTiles(tiles: readonly number[], count = 3): number[] {
  let next = [...tiles];
  for (let k = 0; k < count; k += 1) {
    const destination = next.findIndex((value, index) => value !== index);
    if (destination === -1) break;
    const source = next.indexOf(destination);
    if (source === -1) throw new Error("La rejilla no contiene todas las piezas.");
    next = swapPuzzleTiles(next, source, destination);
  }
  return next;
}

export function scrambledPuzzleTiles(total: number, random = Math.random): number[] {
  const tiles = Array.from({ length: total }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  const positions = Array.from({ length: total }, (_, i) => i);
  for (let k = 0; k < Math.floor(total * 0.45); k += 1) {
    const destination = positions.splice(Math.floor(random() * positions.length), 1)[0];
    const source = tiles.indexOf(destination);
    [tiles[destination], tiles[source]] = [tiles[source], tiles[destination]];
  }
  if (total > 1 && isPuzzleSolved(tiles)) [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
  return tiles;
}
