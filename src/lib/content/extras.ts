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
  "/images/puzzle/pescador_exact.jpg",
  "/images/puzzle/pescador.jpg",
] as const;

export const PUZZLE_SIZE = 8;

/** Palabras que aparecen al completar el puzzle (una por jugador). */
export const PUZZLE_WORDS: readonly string[] = [
  "globo", "guacamayo", "faro", "naranja", "alegria", "mañana", "playa", "cielo",
  "fresa", "montaña", "vuelo", "color", "viaje", "tesoro", "estrella", "sorpresa",
  "amigo", "recuerdo", "equipo", "campeon", "aventura", "risa", "magia", "verano",
  "familia", "fiesta", "libertad", "victoria",
];

/* ───────────── CÓDIGO DE LA NEVERA (Simplificado: 1 adivinanza fija en la app) ───────────── */
/**
 * 28 Adivinanzas sencillas de cosas cotidianas de la casa / comida.
 * En la NEVERA hay una única hoja que es una lista numerada:
 *   1 = MANZANA
 *   2 = HIELO
 *   ...
 *   28 = PAN
 * La app le dice al jugador una adivinanza directa (p. ej. "Tengo lomos pero no espalda...").
 * El jugador adivina la palabra ("LIBRO") y va a la nevera a buscar qué NÚMERO tiene al lado.
 * Ese número es la respuesta. Súper simple, no requiere fórmulas ni cálculos raros.
 */
export const FRIDGE_RIDDLES: readonly { q: string; word: string; num: number }[] = [
  { q: "Tiene lomo y no es animal, tiene hojas y no es árbol. ¿Qué soy?", word: "LIBRO", num: 14 },
  { q: "Blanco por dentro, verde por fuera, si quieres que te lo diga, espera.", word: "PERA", num: 27 },
  { q: "Oro parece, plata no es, el que no lo adivine bien tonto es.", word: "PLATANO", num: 9 },
  { q: "Tengo agujas pero no coso, doy la hora y no reposo.", word: "RELOJ", num: 3 },
  { q: "Cuanto más seca, más mojada queda.", word: "TOALLA", num: 18 },
  { q: "Soy frío como el invierno, si me dejas al sol me derrito.", word: "HIELO", num: 5 },
  { q: "Tengo dientes pero no muerdo, peino tu pelo si me acuerdo.", word: "PEINE", num: 22 },
  { q: "Cuanto más le quitas, más grande se hace.", word: "AGUJERO", num: 11 },
  { q: "Tiene cuatro patas y no camina, te sientas en ella en la cocina.", word: "SILLA", num: 16 },
  { q: "Soy alta de joven y bajita de vieja, alumbro con llama que no se queja.", word: "VELA", num: 8 },
  { q: "Anda sin pies y llora sin ojos en el cielo.", word: "NUBE", num: 25 },
  { q: "Tengo un solo ojo y no puedo ver nada, paso hilos en la costurada.", word: "AGUJA", num: 12 },
  { q: "Tiene corona y no es rey, piel con escamas sin ser pez.", word: "PIÑA", num: 30 },
  { q: "Si me nombras, desaparezco al instante.", word: "SILENCIO", num: 7 },
  { q: "Guarda monedas en el cojín y te acuestas en él sin fin.", word: "SOFA", num: 2 },
  { q: "Te copio sin saber quién eres y no digo ni una palabra.", word: "ESPEJO", num: 19 },
  { q: "Vuela sin alas, silba sin boca y mueve los árboles cuando toca.", word: "VIENTO", num: 24 },
  { q: "Redondo, redondo, barril sin fondo que llevas en el dedo.", word: "ANILLO", num: 1 },
  { q: "Doy vueltas sin marearme y lavo la ropa hasta dejarla limpia.", word: "LAVADORA", num: 15 },
  { q: "Subo y bajo pisos sin cansarme nunca.", word: "ASCENSOR", num: 28 },
  { q: "Tengo teclas y no abro puertas, toco música con notas despiertas.", word: "PIANO", num: 6 },
  { q: "Verde por fuera, roja por dentro, con pepitas negras en el centro.", word: "SANDIA", num: 21 },
  { q: "Te protege del agua cuando cae del cielo y lo abres con anhelo.", word: "PARAGUAS", num: 13 },
  { q: "Guardo tus pasos junto a la puerta y me pisas despierta.", word: "FELPUDO", num: 4 },
  { q: "Doy luz de noche cuando aprietas el botón en la pared.", word: "BOMBILLA", num: 20 },
  { q: "Tiene cuello pero no cabeza, guarda vino o cerveza con destreza.", word: "BOTELLA", num: 10 },
  { q: "Sirve para cortar papel y tiene dos aros para tus dedos.", word: "TIJERAS", num: 26 },
  { q: "Se come con salsa o queso, redonda en el horno con buen beso.", word: "PIZZA", num: 17 },
];

export function fridgeDrafts(players: PlayerInfo[]): Draft[] {
  return players.map((player, index) => {
    const item = FRIDGE_RIDDLES[index % FRIDGE_RIDDLES.length];
    return {
      title: "El misterio helado",
      prompt: `Resuelve esta adivinanza:\n\n«${item.q}»\n\nCuando sepas de qué objeto se trata, tendrás que buscar un lugar de la casa donde hace mucho frío día y noche... Ábrelo y mira por dentro: hay una lista con objetos y números. Escribe aquí el NÚMERO correspondiente a tu objeto.`,
      answer: String(item.num),
      hint: `«Hace frío, mírame por dentro...» ¿Dónde en la casa hace frío constante y se guarda la comida? Allí dentro busca tu palabra (${item.word}) y escribe su número.`,
      judgeNote: `Hoja dentro de la NEVERA: «${item.word}» tiene el número ${item.num}`,
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
