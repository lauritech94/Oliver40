import { hashString, mulberry32, pick, randInt, sample, shuffle } from "./rand";
import type { Draft } from "./types";
import { FORMULA_WORDS, SOPA_THEMES } from "./content/words";
import { COUNTRIES, type Compound, type CompoundPart } from "./content/static";
import nonogramItems from "./content/nonograms.json";

/**
 * Semilla fija de las claves impresas. Debe permanecer igual que cuando se
 * impriman las hojas de /judge/print; cambiarla requeriría reimprimir el material.
 */
const SALT = "gymkhana-28-fixed-plan-v1";

const euro = (cents: number) => `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")} €`;

/* ───────────── 5 · LÓGICA ───────────── */
export function genLogic(): Draft {
  const kind = randInt(0, 7);
  switch (kind) {
    case 0: {
      const rabbits = randInt(2, 9);
      const hens = randInt(3, 10);
      return {
        title: "Lógica: la granja",
        prompt: `En una granja solo hay gallinas y conejos. Entre todos suman ${rabbits + hens} cabezas y ${2 * hens + 4 * rabbits} patas.\n\n¿Cuántos conejos hay? (solo el número)`,
        answer: String(rabbits),
        hint: "Si todos fueran gallinas, ¿cuántas patas habría?",
      };
    }
    case 1: {
      for (let t = 0; t < 100; t += 1) {
        const s = randInt(2, 9);
        const [a, b, c, d] = [randInt(2, 8), randInt(2, 8), randInt(2, 8), randInt(2, 8)];
        const floors = [s + a, s + a - b, s + a - b + c, s + a - b + c - d];
        if (floors.some((f) => f < 1)) continue;
        return {
          title: "Lógica: el ascensor",
          prompt: `Subo ${a} pisos, bajo ${b}, subo ${c} y bajo ${d}. Acabo en el piso ${floors[3]}.\n\n¿En qué piso empecé? (solo el número)`,
          answer: String(s),
          hint: "Haz el camino al revés.",
        };
      }
      return genLogic();
    }
    case 2: {
      const age = randInt(6, 16);
      const k = randInt(2, 4);
      const word = k === 2 ? "el doble" : k === 3 ? "el triple" : "el cuádruple";
      return {
        title: "Lógica: las edades",
        prompt: `Mi padre tiene ${word} de mi edad y, entre los dos, sumamos ${age * (k + 1)} años.\n\n¿Cuántos años tengo? (solo el número)`,
        answer: String(age),
        hint: "Mi edad + (mi edad × veces) = el total.",
      };
    }
    case 3: {
      const ball = randInt(5, 45);
      const diff = randInt(100, 400);
      return {
        title: "Lógica: el bate y la pelota",
        prompt: `Un bate y una pelota cuestan ${euro(2 * ball + diff)} en total. El bate cuesta ${euro(diff)} más que la pelota.\n\n¿Cuántos céntimos cuesta la pelota? (solo el número)`,
        answer: String(ball),
        hint: "Ojo: la respuesta intuitiva suele ser incorrecta.",
      };
    }
    case 4: {
      const minutes = randInt(3, 9);
      const n = randInt(3, 9);
      const big = randInt(50, 200);
      return {
        title: "Lógica: las máquinas",
        prompt: `Si ${n} máquinas tardan ${minutes} minutos en fabricar ${n} piezas, ¿cuántos minutos tardarían ${big} máquinas en fabricar ${big} piezas? (solo el número)`,
        answer: String(minutes),
        hint: "Cada máquina fabrica una pieza.",
      };
    }
    case 5: {
      const days = randInt(20, 60);
      return {
        title: "Lógica: el nenúfar",
        prompt: `Un nenúfar duplica su tamaño cada día. Tarda ${days} días en cubrir todo el estanque.\n\n¿Cuántos días tarda en cubrir la mitad? (solo el número)`,
        answer: String(days - 1),
        hint: "Piensa en el último día.",
      };
    }
    case 6: {
      const colors = ["negros", "blancos", "rojos", "azules"];
      const k = randInt(2, 4);
      const list = colors
        .slice(0, k)
        .map((c) => `${randInt(8, 15)} calcetines ${c}`)
        .join(", ");
      return {
        title: "Lógica: los calcetines",
        prompt: `En un cajón a oscuras hay ${list}.\n\n¿Cuántos tienes que sacar como mínimo para tener seguro un par del mismo color? (solo el número)`,
        answer: String(k + 1),
        hint: "Piensa en el peor caso posible.",
      };
    }
    default: {
      const n = randInt(5, 60);
      return {
        title: "Lógica: números consecutivos",
        prompt: `La suma de tres números consecutivos es ${3 * n + 3}.\n\n¿Cuál es el mayor de los tres? (solo el número)`,
        answer: String(n + 2),
        hint: "El de en medio es la suma dividida entre 3.",
      };
    }
  }
}

/* ───────────── 10 · SERIES ───────────── */
export function genSeries(): Draft {
  const kind = randInt(0, 6);
  let terms: number[] = [];
  let next = 0;
  let hint = "";

  if (kind === 0) {
    const a = randInt(1, 40);
    const d = randInt(2, 12);
    terms = Array.from({ length: 6 }, (_, i) => a + i * d);
    next = a + 6 * d;
    hint = "Fíjate en la diferencia entre términos seguidos.";
  } else if (kind === 1) {
    const a = randInt(1, 5);
    const r = randInt(2, 4);
    terms = Array.from({ length: 5 }, (_, i) => a * r ** i);
    next = a * r ** 5;
    hint = "Cada número se obtiene multiplicando el anterior.";
  } else if (kind === 2) {
    const c = pick([-1, 1, 2, 3]);
    const t: number[] = [randInt(2, 6)];
    for (let i = 0; i < 4; i += 1) t.push(2 * t[i] + c);
    terms = t;
    next = 2 * t[4] + c;
    hint = "Multiplica y luego suma o resta una cantidad fija.";
  } else if (kind === 3) {
    const k = randInt(-3, 9);
    terms = Array.from({ length: 6 }, (_, i) => (i + 1) ** 2 + k);
    next = 49 + k;
    hint = "Cuadrados perfectos con un ajuste fijo.";
  } else if (kind === 4) {
    const t: number[] = [randInt(1, 6), randInt(1, 6)];
    for (let i = 2; i < 7; i += 1) t.push(t[i - 1] + t[i - 2]);
    terms = t;
    next = t[6] + t[5];
    hint = "Cada término es la suma de los dos anteriores.";
  } else if (kind === 5) {
    const s = randInt(1, 15);
    const d1 = randInt(1, 4);
    const step = randInt(1, 3);
    const t: number[] = [s];
    for (let i = 0; i < 5; i += 1) t.push(t[i] + d1 + i * step);
    terms = t;
    next = t[5] + d1 + 5 * step;
    hint = "Las diferencias entre términos también siguen un patrón.";
  } else {
    const s = randInt(1, 20);
    const a = randInt(2, 6);
    const top = randInt(30, 60);
    const b = randInt(2, 6);
    terms = Array.from({ length: 7 }, (_, i) =>
      i % 2 === 0 ? s + (i / 2) * a : top - ((i - 1) / 2) * b,
    );
    next = top - 3 * b;
    hint = "Son dos series mezcladas: una sube y otra baja.";
  }

  return {
    title: "Serie numérica",
    prompt: `¿Qué número sigue? (solo el número)\n\n${terms.join(", ")}, ___`,
    answer: String(next),
    hint,
  };
}

/* ───────────── 3 · ANAGRAMAS ───────────── */
export function scramble(word: string): string {
  const letters = word.toUpperCase().split("");
  for (let t = 0; t < 30; t += 1) {
    const s = shuffle(letters).join("");
    if (s !== word.toUpperCase()) return s.split("").join(" ");
  }
  return letters.join(" ");
}

/* ───────────── 9 · SOPA DE LETRAS ───────────── */
const SOPA_SIZE = 8;
const SOPA_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0]];
const ALL_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
const ALPHABET = "ABCDEFGHIJLMNOPQRSTUVXYZ";

function canPlace(grid: string[][], word: string, r: number, c: number, dr: number, dc: number): boolean {
  for (let i = 0; i < word.length; i += 1) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    if (rr < 0 || cc < 0 || rr >= SOPA_SIZE || cc >= SOPA_SIZE) return false;
    const cell = grid[rr][cc];
    if (cell !== "" && cell !== word[i]) return false;
  }
  return true;
}

function findWord(grid: string[][], word: string): boolean {
  for (let r = 0; r < SOPA_SIZE; r += 1) {
    for (let c = 0; c < SOPA_SIZE; c += 1) {
      for (const [dr, dc] of ALL_DIRS) {
        let ok = true;
        for (let i = 0; i < word.length && ok; i += 1) {
          const rr = r + dr * i;
          const cc = c + dc * i;
          if (rr < 0 || cc < 0 || rr >= SOPA_SIZE || cc >= SOPA_SIZE || grid[rr][cc] !== word[i]) ok = false;
        }
        if (ok) return true;
      }
    }
  }
  return false;
}

export function genSopa(): Draft {
  const theme = pick(SOPA_THEMES);
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const words = sample(theme.words, 5).map((w) => w.toUpperCase());
    const absentIdx = randInt(0, 4);
    const absent = words[absentIdx];
    const present = words.filter((_, i) => i !== absentIdx);
    const grid: string[][] = Array.from({ length: SOPA_SIZE }, () => Array<string>(SOPA_SIZE).fill(""));

    let ok = true;
    for (const w of shuffle(present)) {
      let placed = false;
      for (let t = 0; t < 120 && !placed; t += 1) {
        const [dr, dc] = pick(SOPA_DIRS);
        const r = randInt(0, SOPA_SIZE - 1);
        const c = randInt(0, SOPA_SIZE - 1);
        if (canPlace(grid, w, r, c, dr, dc)) {
          for (let i = 0; i < w.length; i += 1) grid[r + dr * i][c + dc * i] = w[i];
          placed = true;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    const letterPool = present.join("").split("");
    for (let r = 0; r < SOPA_SIZE; r += 1) {
      for (let c = 0; c < SOPA_SIZE; c += 1) {
        if (grid[r][c] === "") grid[r][c] = Math.random() < 0.55 ? pick(letterPool) : pick(ALPHABET.split(""));
      }
    }
    if (findWord(grid, absent)) continue;

    return {
      title: `Sopa de letras: ${theme.name}`,
      prompt: `Tema: ${theme.name}.\nEn la sopa hay escondidas 4 de estas 5 palabras (en horizontal, vertical o diagonal, y a veces al revés):\n\n${words.join(" · ")}\n\n${grid.map((row) => row.join(" ")).join("\n")}\n\n¿Cuál de las 5 palabras NO está en la sopa? Escríbela.`,
      answer: absent.toLowerCase(),
      hint: "Tacha en la lista las que vayas encontrando.",
    };
  }
  return genSeries();
}

/* ───────────── 7 · NONOGRAMA ───────────── */
export type NonogramItem = { answer: string; rows: string[] };
export const NONOGRAMS = nonogramItems as NonogramItem[];

function runs(cells: string[]): number[] {
  const out: number[] = [];
  let count = 0;
  for (const ch of cells) {
    if (ch === "#") count += 1;
    else if (count) {
      out.push(count);
      count = 0;
    }
  }
  if (count) out.push(count);
  return out.length ? out : [0];
}

export function genNonogram(item: NonogramItem): Draft {
  const rows = item.rows.map((r) => runs(r.split("")));
  const cols = [0, 1, 2, 3, 4].map((c) => runs(item.rows.map((r) => r[c])));
  return {
    title: "Nonograma 5×5",
    prompt:
      "Resuelve el nonograma: los números indican los bloques seguidos de casillas rellenas en cada fila (izquierda) y columna (arriba).\n\nToca una casilla para rellenarla, otra vez para marcarla con ✕.\n\nAl terminar se dibujará una LETRA, un NÚMERO o una FIGURA. ¿Cuál es?",
    answer: item.answer,
    hint: "Empieza por las filas y columnas con un 5: están completas.",
    meta: { nonogram: { rows, cols } },
  };
}

/* ───────────── 6 · CÓDIGO ESCONDIDO ───────────── */
export type CodeKey = { id: string; name: string; room: string; spot: string };

export const CODE_KEYS: readonly CodeKey[] = [
  {
    id: "maestro-libro-v1",
    name: "CÓDIGO MAESTRO",
    room: "el interior de un LIBRO de la estantería",
    spot: "Márcalo con un post-it en un libro grueso de la estantería.",
  },
];

/** letra → número (1..26), una permutación fija por clave. */
export function keyNumbers(id: string): Record<string, number> {
  const rng = mulberry32(hashString(`${SALT}:key:${id}`));
  const nums = Array.from({ length: 26 }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  const map: Record<string, number> = {};
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((ch, i) => {
    map[ch] = nums[i];
  });
  return map;
}

export function genCode(word: string, key: CodeKey): Draft {
  const table = keyNumbers(key.id);
  const seq = word
    .toUpperCase()
    .split("")
    .map((ch) => table[ch])
    .join(" - ");
  return {
    title: `Código escondido: ${key.name}`,
    prompt: `Escondido en ${key.room} hay un papel titulado «${key.name}». Contiene una tabla que dice qué letra corresponde a cada número.\n\nDescifra esta secuencia y escribe la palabra:\n\n${seq}`,
    answer: word,
    hint: `Busca con calma en ${key.room}: el papel está pegado o escondido, no a la vista.`,
    judgeNote: `Papel «${key.name}» en ${key.room} (imprimir en /material).`,
  };
}

/* ───────────── 14 · BÚSQUEDA DEL OBJETO ───────────── */
export type SearchSpot = { id: string; name: string; riddle: string; place: string };

export const SEARCH_SPOTS: readonly SearchSpot[] = [
  { id: "nevera", name: "NEVERA", riddle: "Guardo el frío y nunca duermo; ábreme y busca en mi puerta.", place: "pegada dentro de la puerta de la nevera" },
  { id: "libros", name: "LIBROS", riddle: "Tengo lomos pero no espalda, estoy ordenado en la balda.", place: "entre dos libros de la estantería" },
  { id: "felpudo", name: "FELPUDO", riddle: "Me pisas y no me quejo; me encuentras junto a la puerta.", place: "debajo del felpudo" },
  { id: "maceta", name: "MACETA", riddle: "Verde soy y no me muevo; bebo agua y nunca como.", place: "bajo una maceta" },
  { id: "sofa", name: "SOFÁ", riddle: "Me siento contigo y guardo monedas perdidas.", place: "bajo un cojín del sofá" },
  { id: "espejo", name: "ESPEJO", riddle: "Te copio sin saber quién eres y no digo ni una palabra.", place: "detrás de un espejo" },
  { id: "lavadora", name: "LAVADORA", riddle: "Doy vueltas sin marearme y lo sucio dejo limpio.", place: "encima de la lavadora" },
  { id: "cama", name: "CAMA", riddle: "Guardo tus sueños bajo mi manto; busca debajo de mi almohada.", place: "debajo de una almohada" },
];

/** Código de la fila de un jugador en la hoja de un escondite. */
export function searchCode(spotId: string, slot: number): string {
  // El prefijo J01…J28 garantiza códigos distintos incluso si se imprimen varias hojas.
  const tag = hashString(`${SALT}:search-spot:${spotId}`).toString(36).slice(0, 1).toUpperCase();
  return `J${String(slot).padStart(2, "0")}${tag}`;
}

export function genSearch(spot: SearchSpot, slot: number): Draft {
  const label = `J${String(slot).padStart(2, "0")}`;
  return {
    title: "Búsqueda del objeto",
    prompt: `«${spot.riddle}»\n\nEncuentra la HOJA escondida. Tiene una tabla con una fila por jugador: busca la fila de tu número de jugador (${label}) y escribe el CÓDIGO de esa fila.`,
    answer: searchCode(spot.id, slot),
    hint: "Lee la adivinanza despacio: el escondite es un objeto de casa.",
    judgeNote: `Hoja «${spot.name}» ${spot.place} (imprimir en /material).`,
  };
}

/* ───────────── 13 · MEMORIA NUMÉRICA (todos 5 segundos) ───────────── */
export function genMemory(): Draft {
  const digits = Array.from({ length: 7 }, () => randInt(0, 9));
  return {
    title: "Memoria numérica",
    prompt:
      "Pulsa «Mostrar»: verás un número de 7 cifras durante exactamente 5 segundos. Después desaparecerá y se desbloqueará el cajetín.\n\nEscríbelo en el mismo orden, sin espacios.",
    answer: digits.join(""),
    meta: { memorize: { text: digits.join(" "), seconds: 5 } },
  };
}

/* ───────────── 11 · FÓRMULAS DE PALABRAS ───────────── */
function partValue(p: CompoundPart): string {
  switch (p.op) {
    case "first":
      return p.word.slice(0, p.n);
    case "last":
      return p.word.slice(-p.n);
    case "rev":
      return p.word.split("").reverse().join("");
    case "dropFirst":
      return p.word.slice(p.n);
  }
}

function partText(p: CompoundPart): string {
  switch (p.op) {
    case "first":
      return `las ${p.n} primeras letras de ${p.word}`;
    case "last":
      return `las ${p.n} últimas letras de ${p.word}`;
    case "rev":
      return `la palabra ${p.word} escrita al revés`;
    case "dropFirst":
      return `la palabra ${p.word} sin sus ${p.n} primeras letras`;
  }
}

export function compoundDraft(c: Compound): Draft {
  const steps = c.parts.map((p, i) => `${i + 1}) Coge ${partText(p)}.`);
  steps.push(`${c.parts.length + 1}) Junta todo, en ese orden.`);
  return {
    title: "Fórmula de palabras",
    prompt: `Sigue los pasos para formar una palabra (sin tildes):\n\n${steps.join("\n")}\n\nEscribe la palabra resultante.`,
    answer: c.parts.map(partValue).join("").toLowerCase(),
    hint: `Es ${c.cat}. Ve apuntando cada trozo en un papel.`,
  };
}

type TextOp = { key: string; text: string; apply: (s: string) => string };

function randomOp(current: string, used: Set<string>): TextOp | null {
  const letters = Array.from(new Set(current.split("")));
  const options: TextOp[] = [];
  const k1 = randInt(1, 3);
  options.push({
    key: "dropFirst",
    text: k1 === 1 ? "Quita la primera letra." : `Quita las ${k1} primeras letras.`,
    apply: (s) => s.slice(k1),
  });
  const k2 = randInt(1, 3);
  options.push({
    key: "dropLast",
    text: k2 === 1 ? "Quita la última letra." : `Quita las ${k2} últimas letras.`,
    apply: (s) => s.slice(0, -k2),
  });
  options.push({ key: "reverse", text: "Escribe lo que te queda al revés.", apply: (s) => s.split("").reverse().join("") });
  const from = pick(letters);
  const to = pick("AEIOULSRTN".split("").filter((x) => x !== from));
  options.push({ key: "replace", text: `Cambia todas las ${from} por ${to}.`, apply: (s) => s.split(from).join(to) });
  if (letters.length > 2) {
    const drop = pick(letters);
    options.push({ key: "remove", text: `Borra todas las ${drop}.`, apply: (s) => s.split(drop).join("") });
  }
  options.push({
    key: "odd",
    text: "Quédate solo con las letras en posiciones impares (1.ª, 3.ª, 5.ª…).",
    apply: (s) => s.split("").filter((_, i) => i % 2 === 0).join(""),
  });
  options.push({
    key: "even",
    text: "Quédate solo con las letras en posiciones pares (2.ª, 4.ª, 6.ª…).",
    apply: (s) => s.split("").filter((_, i) => i % 2 === 1).join(""),
  });
  const candidates = options.filter((o) => !used.has(o.key));
  return candidates.length ? pick(candidates) : null;
}

export function genFormulaOps(): Draft {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const base = pick(FORMULA_WORDS).toUpperCase();
    let current = base;
    const used = new Set<string>();
    const steps: string[] = [];
    let ok = true;
    for (let i = 0; i < 4; i += 1) {
      const op = randomOp(current, used);
      if (!op) {
        ok = false;
        break;
      }
      used.add(op.key);
      current = op.apply(current);
      steps.push(op.text);
      if (current.length < 3) {
        ok = false;
        break;
      }
    }
    if (!ok || current.length > 9) continue;
    return {
      title: "Fórmula de palabras: operaciones",
      prompt: `Empieza con la palabra ${base} y aplica estos pasos EN ORDEN:\n\n${steps.map((s, i) => `${i + 1}) ${s}`).join("\n")}\n\nEscribe lo que te queda al final (no tiene por qué ser una palabra real).`,
      answer: current.toLowerCase(),
      hint: "Apunta el resultado de cada paso en un papel.",
    };
  }
  return genSeries();
}

/* ───────────── 12 · CULTURA: capitales ───────────── */
export function genCapital(): Draft {
  const [country, capital] = pick(COUNTRIES);
  return {
    title: "Cultura: capitales",
    prompt: `¿Cuál es la capital de ${country}?`,
    answer: capital,
    hint: `Empieza por la letra ${capital.split("|")[0][0].toUpperCase()}.`,
  };
}
