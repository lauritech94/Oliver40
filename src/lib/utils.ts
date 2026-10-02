import { randomBytes, randomInt } from "crypto";

export { shuffle } from "./rand";
export { formatDuration } from "./format";

/** Quita acentos, mayúsculas, signos y espacios de más para comparar respuestas. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/**
 * Compara respuestas. `expected` admite alternativas separadas por "|".
 * Con `lenient` (respuestas dichas por personas) tolera erratas y respuestas parciales.
 */
export function answersMatch(given: string, expected: string, lenient = false): boolean {
  const g = normalizeAnswer(given);
  if (!g) return false;
  return expected.split("|").some((option) => {
    const e = normalizeAnswer(option);
    if (!e) return false;
    if (g === e || g.replace(/ /g, "") === e.replace(/ /g, "")) return true;
    if (!lenient) return false;
    if (Math.min(g.length, e.length) >= 4 && (g.includes(e) || e.includes(g))) return true;
    const tolerance = e.length >= 9 ? 2 : e.length >= 5 ? 1 : 0;
    return tolerance > 0 && levenshtein(g, e) <= tolerance;
  });
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeGameCode(length = 5): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function makeToken(): string {
  return randomBytes(16).toString("hex");
}

export function makePin(): string {
  return String(randomInt(1000, 10000));
}

export const PLAYER_EMOJIS = [
  "🦊", "🐼", "🐨", "🦁", "🐸", "🐙", "🦄", "🐝", "🦉", "🐯",
  "🐮", "🐧", "🦖", "🐳", "🦋", "🐬", "🐵", "🐰", "🐻", "🐶",
  "🐱", "🐭", "🐹", "🐔", "🦆", "🦅", "🦇", "🐺", "🐗", "🐴",
  "🦓", "🦒", "🐘", "🦏", "🐊", "🐢", "🦀", "🦞", "🐠", "🦈",
];
