import { shuffle } from "./rand";
import type { Draft, PlayerInfo } from "./types";
import { ANAGRAMS, CODE_WORDS, SECRET_WORDS } from "./content/words";
import {
  ACERTIJOS,
  COMPOUNDS,
  CULTURA,
  EMOJI_PUZZLES,
  FOTOS,
  QUIEN_SOY,
} from "./content/static";
import { fridgeDrafts, puzzleDrafts, trampaDrafts } from "./content/extras";
import {
  CODE_KEYS,
  compoundDraft,
  genCapital,
  genCode,
  genFormulaOps,
  genLogic,
  genMemory,
  genSeries,
  genSopa,
  scramble,
} from "./generators";

export type ChallengeType = {
  slug: string;
  name: string;
  icon: string;
  summary: string;
  /** true = la valida un juez entregando una palabra secreta. */
  requiresJudge: boolean;
  material: string;
  /** Cuántas variantes distintas hay (para enseñarlo en la home). */
  pool: string;
  /** Genera UNA prueba por jugador (misma posición que `players`). */
  build: (players: PlayerInfo[]) => Draft[];
};

/** Reparte un mazo sin repetir hasta agotarlo; después vuelve a barajar. */
function deal<T>(deck: readonly T[], n: number): T[] {
  const out: T[] = [];
  let bag: T[] = [];
  while (out.length < n) {
    if (bag.length === 0) bag = shuffle(deck);
    out.push(bag.pop() as T);
  }
  return out;
}

/** Identifica el contenido real de una prueba (enunciado + respuesta + secuencia oculta). */
const keyOf = (d: Draft) => `${d.prompt}§${d.answer}§${d.meta?.memorize?.text ?? ""}`;

/** Genera n pruebas evitando contenidos repetidos. */
function uniq(n: number, gen: () => Draft): Draft[] {
  const seen = new Set<string>();
  const out: Draft[] = [];
  for (let i = 0; i < n; i += 1) {
    let d = gen();
    for (let t = 0; t < 60 && seen.has(keyOf(d)); t += 1) d = gen();
    seen.add(keyOf(d));
    out.push(d);
  }
  return out;
}

/** Mezcla un banco fijo con un generador ilimitado. */
function mixed(n: number, statics: Draft[], gen: () => Draft, ratio: number): Draft[] {
  const pool = shuffle(statics);
  const seen = new Set<string>();
  const out: Draft[] = [];
  for (let i = 0; i < n; i += 1) {
    let d: Draft;
    if (pool.length > 0 && Math.random() < ratio) {
      d = pool.pop() as Draft;
    } else {
      d = gen();
      for (let t = 0; t < 60 && seen.has(keyOf(d)); t += 1) d = gen();
    }
    seen.add(keyOf(d));
    out.push(d);
  }
  return out;
}

export const CHALLENGE_TYPES: ChallengeType[] = [
  {
    slug: "acertijo",
    name: "Acertijo",
    icon: "🧩",
    summary: "Adivinanza clásica de ingenio. Se resuelve pensando y se escribe la respuesta en la app.",
    requiresJudge: false,
    material: "Nada",
    pool: `${ACERTIJOS.length} acertijos distintos`,
    build: (players) =>
      deal(ACERTIJOS, players.length).map((r) => ({
        title: "Acertijo",
        prompt: `Resuelve el acertijo y escribe la respuesta:\n\n«${r.q}»`,
        answer: r.a,
        hint: r.h,
      })),
  },
  {
    slug: "trampa",
    name: "Pregunta trampa",
    icon: "🪤",
    summary:
      "Preguntas aparentemente fáciles cuya respuesta obvia es la mala. Hay que pensar antes de contestar.",
    requiresJudge: false,
    material: "Nada",
    pool: "28 preguntas trampa",
    build: (players) => trampaDrafts(players.length),
  },
  {
    slug: "anagrama",
    name: "Anagrama",
    icon: "🔤",
    summary: "Letras desordenadas que esconden una palabra, con pista temática.",
    requiresJudge: false,
    material: "Nada",
    pool: `${ANAGRAMS.length} palabras, letras mezcladas al azar`,
    build: (players) =>
      deal(ANAGRAMS, players.length).map(([word, cat]) => ({
        title: "Anagrama",
        prompt: `Ordena estas letras y forma una palabra.\nPista: ${cat} (${word.length} letras)\n\n${scramble(word)}`,
        answer: word,
        hint: `Empieza por la letra ${word[0].toUpperCase()}.`,
      })),
  },
  {
    slug: "emoji",
    name: "Jeroglífico de emojis",
    icon: "😱",
    summary: "Una secuencia de emojis que representa una película o una serie. Se escribe el título.",
    requiresJudge: false,
    material: "Nada",
    pool: `${EMOJI_PUZZLES.length} películas y series`,
    build: (players) =>
      deal(EMOJI_PUZZLES, players.length).map((r) => ({
        title: `${r.kind} en emojis`,
        prompt: `¿Qué ${r.kind === "Serie" ? "serie" : "película"} es?\n\n${r.e}`,
        answer: r.a,
        hint: r.h,
      })),
  },
  {
    slug: "logica",
    name: "Lógica",
    icon: "🧠",
    summary: "Problemas de lógica y mates con números aleatorios: cada jugador tiene valores distintos.",
    requiresJudge: false,
    material: "Papel y boli (opcional)",
    pool: "8 tipos de problema con números aleatorios",
    build: (players) => uniq(players.length, genLogic),
  },
  {
    slug: "codigo-escondido",
    name: "Código escondido",
    icon: "🗝️",
    summary:
      "Un papel escondido en un libro trae la tabla número→letra. En la app aparece una secuencia de números que hay que descifrar. Cada jugador tiene una palabra distinta.",
    requiresJudge: false,
    material: "1 papel de clave escondido (se imprime en /material)",
    pool: `1 clave compartida × ${CODE_WORDS.length} palabras`,
    build: (players) => {
      const words = deal(CODE_WORDS, players.length);
      const keys = deal(CODE_KEYS, players.length);
      return words.map((w, i) => genCode(w, keys[i]));
    },
  },
  {
    slug: "puzzle",
    name: "Puzzle 8×8",
    icon: "🧩",
    summary:
      "Una foto partida en 64 casillas desordenadas. Toca dos casillas para intercambiarlas y reconstruir la imagen. Al completarla aparece una palabra.",
    requiresJudge: false,
    material: "Nada (se resuelve en el móvil)",
    pool: "4 fotos · 64 casillas por jugador",
    build: (players) => puzzleDrafts(players),
  },
  {
    slug: "foto",
    name: "Foto con pose",
    icon: "📸",
    summary:
      "Montar una foto concreta (gente, pose, objeto). Se enseña al juez y él da una PALABRA SECRETA distinta para cada prueba.",
    requiresJudge: true,
    material: "Móvil con cámara",
    pool: `${FOTOS.length} retos · palabra secreta única por prueba`,
    build: (players) => {
      const poses = deal(FOTOS, players.length);
      const secrets = deal(SECRET_WORDS, players.length);
      return poses.map((pose, i) => ({
        title: pose.title,
        prompt: `${pose.prompt}\n\nEnséñale la foto a un juez: si está bien, te dará la PALABRA SECRETA. Escríbela abajo.`,
        answer: secrets[i],
        judgeNote: `Palabra secreta: ${secrets[i].toUpperCase()}`,
      }));
    },
  },
  {
    slug: "sopa-de-letras",
    name: "Sopa de letras",
    icon: "🔍",
    summary:
      "Una sopa de letras generada al azar con 4 de 5 palabras de un tema. Hay que descubrir cuál de las 5 NO está escondida.",
    requiresJudge: false,
    material: "Nada",
    pool: "12 temas · rejilla distinta para cada jugador",
    build: (players) => uniq(players.length, genSopa),
  },
  {
    slug: "secuencia",
    name: "Serie numérica",
    icon: "🔢",
    summary: "Secuencias de números (aritméticas, geométricas, Fibonacci, mezcladas…) con valores aleatorios.",
    requiresJudge: false,
    material: "Nada",
    pool: "7 tipos de serie con valores aleatorios",
    build: (players) => uniq(players.length, genSeries),
  },
  {
    slug: "formula-palabras",
    name: "Fórmula de palabras",
    icon: "🔡",
    summary:
      "Construir una palabra con varios pasos de letras (primeras letras de una palabra, últimas de otra, al revés…) o aplicar 4 operaciones seguidas a una palabra.",
    requiresJudge: false,
    material: "Papel y boli (opcional)",
    pool: `${COMPOUNDS.length} fórmulas fijas + operaciones ilimitadas`,
    build: (players) => mixed(players.length, COMPOUNDS.map(compoundDraft), genFormulaOps, 0.6),
  },
  {
    slug: "cultura",
    name: "Cultura general",
    icon: "🌍",
    summary: "Preguntas de cultura general, refranes por completar y capitales del mundo. Sin móvil, claro.",
    requiresJudge: false,
    material: "Nada",
    pool: `${CULTURA.length} preguntas y refranes + capitales`,
    build: (players) =>
      mixed(
        players.length,
        CULTURA.map((r) => ({
          title: `Cultura: ${r.cat}`,
          prompt: r.q,
          answer: r.a,
          hint: r.h,
        })),
        genCapital,
        0.65,
      ),
  },
  {
    slug: "memoria",
    name: "Memoria",
    icon: "💭",
    summary:
      "Se muestra una serie (colores, cifras, palabras, emojis) solo unos segundos y luego desaparece. Hay que responder de memoria. Cada vez que se vuelve a mirar queda registrado.",
    requiresJudge: false,
    material: "Móvil",
    pool: "4 mecánicas con contenido aleatorio",
    build: (players) => uniq(players.length, genMemory),
  },
  {
    slug: "busqueda",
    name: "El código de la nevera",
    icon: "🧊",
    summary:
      "Una sola hoja escondida en la nevera con 12 pistas y una regla. Hay que calcular cuáles son tus pistas, resolverlas y formar un código de 4 caracteres.",
    requiresJudge: false,
    material: "1 hoja escondida en la puerta de la nevera (se imprime en /material)",
    pool: "12 pistas · código distinto por jugador",
    build: (players) => fridgeDrafts(players),
  },
  {
    slug: "quien-soy",
    name: "¿Quién soy?",
    icon: "🕵️",
    summary:
      "Adivinar un personaje famoso. Se muestra una primera pista difícil; si te atascas, pides las otras dos (queda registrado).",
    requiresJudge: false,
    material: "Nada",
    pool: `${QUIEN_SOY.length} personajes`,
    build: (players) =>
      deal(QUIEN_SOY, players.length).map((r) => ({
        title: "¿Quién soy?",
        prompt: `Adivina el personaje.\n\nPista 1: ${r.c[0]}\n\n(Si te atascas, pide la pista extra: te dará las otras dos.)`,
        answer: r.a,
        hint: `Pista 2: ${r.c[1]}\nPista 3: ${r.c[2]}`,
      })),
  },
];

export const TOTAL_CHALLENGE_TYPES = CHALLENGE_TYPES.length;
