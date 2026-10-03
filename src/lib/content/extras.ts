import type { Draft, PlayerInfo } from "../types";

/* ───────────── Sustituto de INTERACCIÓN SOCIAL · PREGUNTAS TRAMPA ───────────── */
export const TRAMPAS: readonly { q: string; a: string; h: string }[] = [
  { q: "¿Qué pesa más, un kilo de plomo o un kilo de plumas?", a: "lo mismo|pesan lo mismo|el mismo peso|son iguales", h: "Un kilo es un kilo." },
  { q: "¿Cuántos meses del año tienen 28 días?", a: "12|todos|doce|todos los meses", h: "Todos los meses los tienen." },
  { q: "Un granjero tiene 17 ovejas y se le mueren todas menos 9. ¿Cuántas le quedan?", a: "9|nueve", h: "«Se mueren todas MENOS 9»." },
  { q: "Si un avión se estrella justo en la frontera entre dos países, ¿dónde entierran a los supervivientes?", a: "en ningun lado|no se entierran|a ningun lado|no los entierran|ninguna parte", h: "Los supervivientes están vivos." },
  { q: "¿Cuánta tierra hay en un agujero de dos metros de profundidad?", a: "ninguna|0|cero|no hay", h: "Un agujero está vacío por definición." },
  { q: "¿Qué hora es cuando un reloj da las trece?", a: "la una|una|es la una", h: "Después de las doce, ¿qué viene?" },
  { q: "Si un tren eléctrico va hacia el norte, ¿hacia dónde sale el humo?", a: "no sale humo|no tiene humo|a ningun lado|ningun lado|no echa humo", h: "Es un tren ELÉCTRICO." },
  { q: "¿Cuántas veces puedes restar 5 de 25?", a: "1|una|una vez", h: "La primera vez ya no es 25." },
  { q: "¿Qué tiene dientes y no muerde?", a: "un peine|peine|el peine|una sierra|sierra", h: "Lo usas por la mañana." },
  { q: "¿Qué se ve en medio de la palabra «MAR»?", a: "la letra a|una a|la a|letra a", h: "Mira la letra de en medio." },
  { q: "¿Qué se rompe solo con nombrarlo?", a: "el silencio|silencio", h: "Si lo dices, desaparece." },
  { q: "¿Cuántos animales metió Moisés en el arca?", a: "ninguno|0|cero|no metio ninguno", h: "No fue Moisés quien construyó el arca." },
  { q: "¿Qué es lo que cuanto más se seca, más moja?", a: "una toalla|la toalla|toalla", h: "Está en el baño." },
  { q: "¿Qué va subiendo y bajando sin moverse de sitio?", a: "una escalera|la escalera|escalera", h: "Está en las casas de dos plantas." },
  { q: "¿Qué palabra se escribe mal en todos los diccionarios?", a: "mal|la palabra mal", h: "La respuesta está en la propia pregunta." },
  { q: "Si tienes seis manzanas y le quitas cuatro, ¿cuántas tienes?", a: "4|cuatro", h: "«Tienes» las que acabas de tomar." },
  { q: "¿Qué es lo que anda sin pies?", a: "el humo|humo|la sombra|una sombra|el viento|viento", h: "Lo ves cuando encienden algo." },
  { q: "¿Qué le dice un semáforo a otro?", a: "no me mires que me cambio|no me mires", h: "Se cambia de color." },
  { q: "¿Cuántas letras tiene el abecedario?", a: "27|veintisiete", h: "Incluye la eñe." },
  { q: "¿Qué país tiene forma de sombrero?", a: "chile", h: "Está en Sudamérica." },
  { q: "¿Qué entra en la cocina y sale en el baño sin moverse?", a: "la pared|una pared|pared", h: "Separa las estancias." },
  { q: "¿Qué se seca al mojarse?", a: "una toalla|la toalla|toalla", h: "Absorbe el agua." },
  { q: "Un cocodrilo cruza un río. ¿Qué le pasa?", a: "se moja|se moja nadando|se moja el", h: "Está nadando." },
  { q: "Si lanzas una piedra negra al Mar Rojo, ¿qué pasa?", a: "se moja|se hunde|la piedra se moja|nada pasa|se hunde la piedra", h: "El agua está húmeda." },
  { q: "¿Qué es lo que no está en su sitio y todo el mundo lo usa?", a: "la boca|la boca de un rinoceronte|el punto", h: "Está en la cara." },
  { q: "¿Qué pica sin ser animal?", a: "una ortiga|la ortiga|ortiga|un alfiler|alfiler", h: "Crece en el campo." },
  { q: "Si ayer fuera mañana, hoy sería viernes. ¿Qué día es hoy realmente?", a: "domingo|el domingo|dia domingo", h: "Piensa hacia atrás." },
  { q: "¿Qué es lo que lo da el dueño y lo usa el que no lo tiene?", a: "el anillo|un anillo|anillo", h: "Se lleva en el dedo." },
];

/* ───────────── Sustituto de NONOGRAMA · PUZZLE 8×8 ───────────── */
export const PUZZLE_IMAGES = [
  "/images/puzzle/1.jpg",
  "/images/puzzle/2.jpg",
  "/images/puzzle/3.jpg",
  "/images/puzzle/4.jpg",
] as const;

export const PUZZLE_SIZE = 8;

/** Palabras que aparecen al completar el puzzle (una por jugador). */
export const PUZZLE_WORDS: readonly string[] = [
  "globo", "guacamayo", "faro", "naranja", "alegria", "mañana", "playa", "cielo",
  "fresa", "montaña", "vuelo", "color", "viaje", "tesoro", "estrella", "sorpresa",
  "amigo", "recuerdo", "equipo", "campeon", "aventura", "risa", "magia", "verano",
  "familia", "fiesta", "libertad", "victoria",
];

/* ───────────── CÓDIGO DE LA NEVERA (una sola hoja escondida) ───────────── */
export const FRIDGE_CLUES: readonly { q: string; a: string }[] = [
  { q: "Tengo agujas pero no pincho, tengo números pero no sé contar.", a: "reloj" },
  { q: "Tiene hojas pero no es árbol, tiene lomo pero no es animal.", a: "libro" },
  { q: "Oro parece, plata no es.", a: "platano" },
  { q: "Cuanto más le quitas, más grande se hace.", a: "agujero" },
  { q: "Tiene cuatro patas y no anda, tiene respaldo y no habla.", a: "silla" },
  { q: "Soy alta cuando soy joven y baja cuando soy vieja.", a: "vela" },
  { q: "Anda sin pies y llora sin ojos.", a: "nube" },
  { q: "Tengo un ojo y no veo nada.", a: "aguja" },
  { q: "Tiene cama y no duerme, tiene boca y no habla.", a: "rio" },
  { q: "Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera.", a: "pera" },
  { q: "Vuela sin alas, silba sin boca, golpea sin manos.", a: "viento" },
  { q: "Tiene corona y no es rey, tiene escamas y no es pez.", a: "pina" },
];

function onlyLetters(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function digitSum(value: number): number {
  return String(value)
    .split("")
    .reduce((sum, ch) => sum + Number(ch), 0);
}

/** Pista A = suma de cifras (1–10). Pista B = A + 2 (3–12). */
export function fridgeClueIndexes(slot: number): [number, number] {
  const a = digitSum(slot);
  return [a, a + 2 > 12 ? a + 2 - 12 : a + 2];
}

/** Código = inicial pista A + inicial pista B + número de jugador (2 cifras). */
export function fridgeCode(slot: number): string {
  const [ia, ib] = fridgeClueIndexes(slot);
  const a = onlyLetters(FRIDGE_CLUES[ia - 1].a)[0];
  const b = onlyLetters(FRIDGE_CLUES[ib - 1].a)[0];
  return `${a}${b}${String(slot).padStart(2, "0")}`;
}

export function fridgeDrafts(players: PlayerInfo[]): Draft[] {
  const steps = [
    "1) Calcula tu PISTA A: suma las dos cifras de tu número de jugador (J07 → 0+7 = 7).",
    "2) Tu PISTA B es la PISTA (A + 2). Si pasa de 12, quítale 12.",
    "3) Resuelve esas dos pistas.",
    "4) Tu código es: inicial de la respuesta A + inicial de la respuesta B + tu número (2 cifras).",
    "Ejemplo: J07 con pistas 7 y 9, si sus respuestas empiezan por N y por R → código NR07.",
  ];
  return players.map((player) => {
    const [ia, ib] = fridgeClueIndexes(player.slot);
    return {
      title: "El código de la nevera",
      prompt: `Busca la HOJA pegada por dentro de la puerta de la NEVERA. Tiene 12 pistas y una regla.\n\n${steps.join("\n")}\n\nTus pistas son la ${ia} y la ${ib}. Escribe aquí tu código.`,
      answer: fridgeCode(player.slot),
      hint: "El código tiene 4 caracteres: 2 letras y tu número de jugador. Cada pista se resuelve con una sola palabra.",
      judgeNote: `Hoja única en la NEVERA (imprimir en /material). Pistas ${ia} y ${ib} → código ${fridgeCode(player.slot)}`,
    };
  });
}

export function trampaDrafts(count: number): Draft[] {
  const bag = [...TRAMPAS];
  const out: Draft[] = [];
  while (out.length < count) {
    if (bag.length === 0) bag.push(...TRAMPAS);
    const r = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    out.push({
      title: "Pregunta trampa",
      prompt: `Pregunta trampa: piensa antes de responder, la respuesta obvia suele ser la mala.\n\n«${r.q}»`,
      answer: r.a,
      hint: r.h,
    });
  }
  return out;
}

export function puzzleDrafts(players: PlayerInfo[]): Draft[] {
  return players.map((player) => {
    const index = (player.slot - 1) % PUZZLE_IMAGES.length;
    const word = PUZZLE_WORDS[(player.slot - 1) % PUZZLE_WORDS.length];
    return {
      title: "Puzzle 8×8",
      prompt:
        "Ordena el puzzle: toca dos casillas para intercambiarlas hasta reconstruir la foto.\n\nEncima tienes una miniatura de referencia. Al completarlo aparecerá una palabra que deberás enviar.",
      answer: word,
      hint: "Empieza por las esquinas y los bordes: son lo más fácil de reconocer.",
      meta: { puzzle: { image: PUZZLE_IMAGES[index], size: PUZZLE_SIZE, word } },
    };
  });
}
