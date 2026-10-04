import type { Draft, PlayerInfo } from "../types";

/* ───────────── PREGUNTAS TRAMPA · 28 diferentes y fáciles ───────────── */
export const TRAMPAS: readonly { q: string; a: string }[] = [
  {
    q: "¿Qué pesa más: un kilo de plomo o un kilo de plumas?",
    a: "pesan lo mismo|lo mismo|pesan igual|igual|un kilo",
  },
  {
    q: "¿Cuántos meses del año tienen 28 días?",
    a: "12|doce|todos|todos los meses",
  },
  {
    q: "Un granjero tiene 17 ovejas. Se le mueren todas menos 9. ¿Cuántas le quedan?",
    a: "9|nueve",
  },
  {
    q: "Un avión se estrella en la frontera entre España y Francia. ¿Dónde entierran a los supervivientes?",
    a: "no se entierran|no los entierran|en ninguna parte|en ningun sitio|en ningun lado|a los supervivientes no se les entierra",
  },
  {
    q: "Un tren eléctrico va hacia el norte. ¿Hacia dónde sale el humo?",
    a: "no sale humo|no echa humo|no hay humo|a ningun lado|ningun lado",
  },
  {
    q: "¿Cuánta tierra hay dentro de un agujero de dos metros de profundidad?",
    a: "ninguna|nada|0|cero|no hay tierra|ninguna tierra",
  },
  {
    q: "Tienes 6 manzanas y coges 4. ¿Cuántas manzanas tienes tú?",
    a: "4|cuatro",
  },
  {
    q: "¿Cuántos animales metió Moisés en el arca?",
    a: "ninguno|ningun animal|0|cero|los metio noe|fue noe|no fue moises",
  },
  {
    q: "Un gallo pone un huevo en lo alto de un tejado. ¿Hacia qué lado cae?",
    a: "los gallos no ponen huevos|un gallo no pone huevos|no pone huevos|ninguno|a ningun lado|no cae",
  },
  {
    q: "En una pecera hay 10 peces. Dos se ahogan. ¿Cuántos quedan?",
    a: "10|diez|quedan 10|todos|todos los peces",
  },
  {
    q: "Un médico te da 3 pastillas y te dice que tomes una cada 30 minutos. ¿En cuánto tiempo te las terminas?",
    a: "1 hora|una hora|60 minutos|sesenta minutos",
  },
  {
    q: "¿Cuántos huevos puedes comer con el estómago vacío?",
    a: "1|uno|un huevo|solo uno|solamente uno",
  },
  {
    q: "En una habitación oscura hay una vela, una lámpara y una chimenea. Solo tienes una cerilla. ¿Qué enciendes primero?",
    a: "la cerilla|cerilla|el fosforo|fosforo|la cerilla primero",
  },
  {
    q: "¿Qué te pertenece, pero los demás lo usan más que tú?",
    a: "mi nombre|tu nombre|el nombre|nombre|mi propio nombre",
  },
  {
    q: "¿Qué cosa sube todos los años y nunca baja?",
    a: "la edad|edad|mi edad|tu edad",
  },
  {
    q: "¿Qué se moja mientras seca?",
    a: "la toalla|una toalla|toalla",
  },
  {
    q: "¿Qué tiene muchos dientes pero no puede morder?",
    a: "el peine|un peine|peine",
  },
  {
    q: "¿Qué tiene dos manos pero no tiene brazos?",
    a: "el reloj|un reloj|reloj",
  },
  {
    q: "¿Qué tiene muchas teclas pero no abre ninguna puerta?",
    a: "el piano|un piano|piano|el teclado|un teclado|teclado",
  },
  {
    q: "¿Qué puede llenar una habitación sin ocupar espacio?",
    a: "la luz|luz|el aire|aire",
  },
  {
    q: "¿Qué puedes coger pero no puedes lanzar?",
    a: "un resfriado|el resfriado|resfriado|un catarro|catarro|la gripe|gripe",
  },
  {
    q: "¿Con qué mano es mejor remover el café?",
    a: "con ninguna|ninguna|con una cuchara|la cuchara|una cuchara|cuchara",
  },
  {
    q: "En una carrera adelantas a la persona que va segunda. ¿En qué posición te colocas?",
    a: "segundo|segunda|2|segundo puesto|segunda posicion|en segunda posicion",
  },
  {
    q: "Antes de que se descubriera el monte Everest, ¿cuál era la montaña más alta del mundo?",
    a: "el everest|everest|monte everest|el monte everest",
  },
  {
    q: "Dos padres y dos hijos comen una manzana cada uno, pero solo comen 3 manzanas. ¿Cómo puede ser?",
    a: "son tres personas|3 personas|tres personas|abuelo padre e hijo|un abuelo un padre y un hijo|abuelo padre hijo",
  },
  {
    q: "Una familia tiene 2 padres, 6 hijos y todos los hijos comparten una única hermana. ¿Cuántas personas hay?",
    a: "9|nueve|9 personas|nueve personas",
  },
  {
    q: "¿De qué color es el caballo blanco de Santiago?",
    a: "blanco|de color blanco|es blanco",
  },
  {
    q: "¿Qué letra está al final de la palabra «todo»?",
    a: "o|la o|letra o|la letra o",
  },
];

/* ───────────── Sustituto de NONOGRAMA · PUZZLE 8×8 ───────────── */
export const PUZZLE_IMAGES = [
  "/images/puzzle/pescador_exact.jpg",
  "/images/puzzle/pescador.jpg",
] as const;

export const PUZZLE_SIZE = 6;

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
    });
  }
  return out;
}

export function puzzleDrafts(players: PlayerInfo[]): Draft[] {
  return players.map((player) => {
    const index = (player.slot - 1) % PUZZLE_IMAGES.length;
    const word = PUZZLE_WORDS[(player.slot - 1) % PUZZLE_WORDS.length];
    return {
      title: "Puzzle 6×6",
      prompt:
        "Ordena el puzzle de 36 piezas: toca dos casillas para intercambiarlas hasta reconstruir la foto.\n\nEncima tienes una imagen de referencia. Al completarlo se validará automáticamente.",
      answer: word,
      hint: "Empieza por las esquinas y los bordes: son lo más fácil de reconocer.",
      meta: { puzzle: { image: PUZZLE_IMAGES[index], size: PUZZLE_SIZE, word } },
    };
  });
}
