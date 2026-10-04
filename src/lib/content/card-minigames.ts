import type { Draft, PlayerInfo, TaskMeta } from "../types";
import { pick, randInt, shuffle } from "../rand";

/* ───────────── 1 · LABERINTO ───────────── */
const N = 1;
const E = 2;
const S = 4;
const W = 8;
const DIRS = [
  { bit: N, opposite: S, dr: -1, dc: 0 },
  { bit: E, opposite: W, dr: 0, dc: 1 },
  { bit: S, opposite: N, dr: 1, dc: 0 },
  { bit: W, opposite: E, dr: 0, dc: -1 },
] as const;

/** Laberinto perfecto: todos los cuadrados conectados y una única ruta entre dos puntos. */
export function generateMaze(size = 15): { cells: number[]; shortest: number } {
  const total = size * size;
  const cells = Array<number>(total).fill(0);
  const visited = new Set<number>([0]);
  const stack = [0];

  while (stack.length) {
    const current = stack[stack.length - 1];
    const row = Math.floor(current / size);
    const col = current % size;
    const options = shuffle(DIRS).filter(({ dr, dc }) => {
      const nr = row + dr;
      const nc = col + dc;
      return nr >= 0 && nc >= 0 && nr < size && nc < size && !visited.has(nr * size + nc);
    });
    const direction = options[0];
    if (!direction) {
      stack.pop();
      continue;
    }
    const next = (row + direction.dr) * size + col + direction.dc;
    cells[current] |= direction.bit;
    cells[next] |= direction.opposite;
    visited.add(next);
    stack.push(next);
  }

  // Distancia de la única ruta inicio→salida.
  const queue: [number, number][] = [[0, 0]];
  const seen = new Set([0]);
  let shortest = 0;
  while (queue.length) {
    const [cell, distance] = queue.shift()!;
    if (cell === total - 1) {
      shortest = distance;
      break;
    }
    const row = Math.floor(cell / size);
    const col = cell % size;
    for (const direction of DIRS) {
      if (!(cells[cell] & direction.bit)) continue;
      const nr = row + direction.dr;
      const nc = col + direction.dc;
      const next = nr * size + nc;
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, distance + 1]);
      }
    }
  }
  return { cells, shortest };
}

function hardMaze(size = 15) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const maze = generateMaze(size);
    if (maze.shortest >= 60) return maze;
  }
  return generateMaze(size);
}

export function mazeDrafts(players: PlayerInfo[]): Draft[] {
  return players.map(() => {
    const maze = hardMaze(15);
    return {
      title: "Laberinto",
      prompt:
        "Lleva la ficha azul desde la esquina superior izquierda hasta la bandera de la esquina inferior derecha. Usa las flechas o desliza el dedo. El laberinto cambia según el jugador.",
      answer: "laberinto-completado",
      meta: {
        minigame: { kind: "maze", size: 15, cells: maze.cells, start: 0, end: 224 },
      },
    };
  });
}

/* ───────────── 2 · ENCUENTRA EL INTRUSO ───────────── */
const INTRUDERS: readonly [string, string][] = [
  ["🍎", "🍅"], ["🐶", "🐺"], ["🌕", "🌖"], ["😀", "😃"], ["⭐", "🌟"], ["🔵", "🟣"],
  ["🐟", "🐠"], ["🌲", "🌳"], ["🍋", "🍌"], ["🚗", "🚕"], ["⚽", "🏀"], ["🟩", "🟢"],
  ["🐭", "🐹"], ["🌸", "🌺"], ["✏️", "🖊️"], ["🔒", "🔐"], ["🧊", "💎"], ["☀️", "🌤️"],
  ["🦊", "🐱"], ["🍓", "🍒"], ["👀", "👁️"], ["🎈", "🎀"], ["🟡", "🟠"], ["🐸", "🐢"],
  ["🧩", "🎲"], ["📗", "📘"], ["💚", "💙"], ["🕐", "🕑"],
];

export function intruderDrafts(players: PlayerInfo[]): Draft[] {
  const pairs = shuffle(INTRUDERS);
  return players.map((_, playerIndex) => {
    const rounds = Array.from({ length: 3 }, (_, round) => {
      const pair = pairs[(playerIndex + round * 7) % pairs.length];
      return {
        base: pair[0],
        odd: pair[1],
        index: randInt(0, 63),
      };
    });
    return {
      title: "Encuentra el intruso",
      prompt:
        "Completa 3 rondas: en cada cuadrícula hay un símbolo diferente a los demás. Encuéntralo y tócalo. Un fallo reinicia esa ronda.",
      answer: "intruso-completado",
      meta: { minigame: { kind: "intruder", rounds } },
    };
  });
}

/* ───────────── 3 · CRONÓMETRO EXACTO ───────────── */
export function stopwatchDrafts(players: PlayerInfo[]): Draft[] {
  return players.map((_, index) => {
    // Objetivo visible distinto (4,00 / 5,00 / 6,00 s), misma dificultad.
    const targetMs = [4000, 5000, 6000][index % 3];
    return {
      title: "Cronómetro exacto",
      prompt:
        `Tienes 3 intentos para parar el cronómetro lo más cerca posible de ${(targetMs / 1000).toFixed(2)} segundos. Al empezar, el tiempo se oculta. Se guarda tu mejor intento y después avanzas.`,
      answer: "cronometro-completado",
      meta: { minigame: { kind: "stopwatch", targetMs, attempts: 3 } },
    };
  });
}

export function isCardMinigame(meta: TaskMeta): boolean {
  return Boolean(meta.minigame);
}

/* ───────────── CULTURA GENERAL SENCILLA · 28 ───────────── */
export const EASY_CULTURE: readonly { category: string; question: string; answer: string }[] = [
  { category: "geografía", question: "¿Cuál es la capital de España?", answer: "madrid" },
  { category: "geografía", question: "¿En qué continente está Egipto?", answer: "africa" },
  { category: "geografía", question: "¿Qué océano separa Europa de América?", answer: "atlantico|oceano atlantico" },
  { category: "geografía", question: "¿Cuál es el país con forma de bota?", answer: "italia" },
  { category: "geografía", question: "¿En qué país está la Torre Eiffel?", answer: "francia" },
  { category: "naturaleza", question: "¿Cuál es el animal terrestre más grande?", answer: "elefante|el elefante" },
  { category: "naturaleza", question: "¿Qué animal es conocido como el rey de la selva?", answer: "leon|el leon" },
  { category: "naturaleza", question: "¿Qué animal produce la lana?", answer: "oveja|la oveja" },
  { category: "naturaleza", question: "¿Cuántas patas tiene una araña?", answer: "8|ocho" },
  { category: "naturaleza", question: "¿Qué planeta es conocido como el planeta rojo?", answer: "marte" },
  { category: "ciencia", question: "¿Qué gas respiramos para vivir?", answer: "oxigeno" },
  { category: "ciencia", question: "¿Qué estrella ilumina la Tierra durante el día?", answer: "sol|el sol" },
  { category: "ciencia", question: "¿A qué temperatura se congela el agua en grados Celsius?", answer: "0|cero|0 grados|cero grados" },
  { category: "cuerpo", question: "¿Con qué órgano vemos?", answer: "ojos|los ojos|ojo" },
  { category: "cuerpo", question: "¿Cuántos dedos tenemos normalmente entre las dos manos?", answer: "10|diez" },
  { category: "deporte", question: "¿Cuántos jugadores tiene un equipo de fútbol en el campo?", answer: "11|once" },
  { category: "deporte", question: "¿Qué deporte se juega en Wimbledon?", answer: "tenis|el tenis" },
  { category: "deporte", question: "¿De qué color es la tarjeta de expulsión en fútbol?", answer: "roja|rojo|color rojo" },
  { category: "cine", question: "¿Cómo se llama el vaquero de Toy Story?", answer: "woody" },
  { category: "cine", question: "¿Cómo se llama el ogro verde de las películas de DreamWorks?", answer: "shrek" },
  { category: "cine", question: "¿Qué animal es Simba en El Rey León?", answer: "leon|un leon" },
  { category: "música", question: "¿Cuántas cuerdas tiene una guitarra clásica?", answer: "6|seis" },
  { category: "música", question: "¿Qué grupo cantaba «Bohemian Rhapsody»?", answer: "queen" },
  { category: "literatura", question: "¿Quién escribió Don Quijote?", answer: "cervantes|miguel de cervantes" },
  { category: "arte", question: "¿Quién pintó la Mona Lisa?", answer: "leonardo da vinci|da vinci|leonardo" },
  { category: "historia", question: "¿Qué famoso navegante llegó a América en 1492?", answer: "cristobal colon|colon" },
  { category: "comida", question: "¿De qué fruta se hace el vino?", answer: "uva|uvas|la uva" },
  { category: "general", question: "¿Cuántos días tiene una semana?", answer: "7|siete" },
];

/* ───────────── ¿QUIÉN SOY? OBVIO · 28 ───────────── */
export const OBVIOUS_CHARACTERS: readonly { answer: string; clues: [string, string, string] }[] = [
  { answer: "harry potter|harry", clues: ["Soy un joven mago.", "Tengo una cicatriz en forma de rayo.", "Estudio en Hogwarts."] },
  { answer: "mario|super mario|mario bros", clues: ["Soy un fontanero de videojuegos.", "Llevo gorra roja.", "Mi hermano se llama Luigi."] },
  { answer: "mickey mouse|mickey", clues: ["Soy un ratón de Disney.", "Llevo pantalones rojos.", "Mi pareja es Minnie."] },
  { answer: "bob esponja", clues: ["Soy una esponja amarilla.", "Vivo en una piña bajo el mar.", "Mi amigo es Patricio."] },
  { answer: "batman", clues: ["Soy un superhéroe sin superpoderes.", "Visto de negro y parezco un murciélago.", "Protejo Gotham."] },
  { answer: "superman", clues: ["Llevo capa roja.", "Puedo volar.", "La kriptonita me debilita."] },
  { answer: "spiderman|spider man|hombre arana", clues: ["Soy un superhéroe.", "Lanzo telarañas.", "Me picó una araña."] },
  { answer: "homer simpson|homer", clues: ["Soy amarillo y vivo en Springfield.", "Me encantan las rosquillas.", "Mi hijo se llama Bart."] },
  { answer: "pikachu", clues: ["Soy amarillo.", "Soy un Pokémon eléctrico.", "Mi entrenador es Ash."] },
  { answer: "shrek", clues: ["Soy un ogro verde.", "Vivo en una ciénaga.", "Mi amigo es un burro que habla."] },
  { answer: "pinocho", clues: ["Soy un muñeco de madera.", "Me crece la nariz cuando miento.", "Mi padre es Geppetto."] },
  { answer: "cenicienta", clues: ["Pierdo un zapato de cristal.", "Un hada me ayuda a ir a un baile.", "Debo volver antes de medianoche."] },
  { answer: "blancanieves|blanca nieves", clues: ["Vivo con siete enanitos.", "Una reina malvada me tiene envidia.", "Muerdo una manzana envenenada."] },
  { answer: "elsa", clues: ["Soy una princesa de Disney.", "Puedo crear hielo.", "Canto «Suéltalo»."] },
  { answer: "simba", clues: ["Soy un león de Disney.", "Mi padre es Mufasa.", "Termino siendo rey."] },
  { answer: "darth vader|vader", clues: ["Visto de negro.", "Respiro de forma muy ruidosa.", "Soy el padre de Luke Skywalker."] },
  { answer: "yoda", clues: ["Soy un maestro Jedi pequeño y verde.", "Hablo cambiando el orden de las frases.", "Uso la Fuerza."] },
  { answer: "jack sparrow|capitan jack sparrow", clues: ["Soy un pirata de cine.", "Mi barco es la Perla Negra.", "Me interpreta Johnny Depp."] },
  { answer: "sherlock holmes|sherlock", clues: ["Soy un detective muy famoso.", "Vivo en Baker Street.", "Mi compañero es Watson."] },
  { answer: "don quijote|quijote", clues: ["Soy un caballero de una novela española.", "Monto a Rocinante.", "Confundo molinos con gigantes."] },
  { answer: "albert einstein|einstein", clues: ["Soy un científico con el pelo alborotado.", "Formulé la teoría de la relatividad.", "Mi fórmula famosa es E=mc²."] },
  { answer: "lionel messi|messi", clues: ["Soy futbolista argentino.", "He llevado el número 10.", "Gané el Mundial de 2022."] },
  { answer: "rafa nadal|nadal", clues: ["Soy tenista español.", "Nací en Mallorca.", "He ganado muchas veces Roland Garros."] },
  { answer: "michael jackson", clues: ["Me llamaban el rey del pop.", "Bailaba el moonwalk.", "Canté Thriller."] },
  { answer: "shakira", clues: ["Soy cantante colombiana.", "Canté Waka Waka.", "Mis caderas no mienten."] },
  { answer: "pablo picasso|picasso", clues: ["Soy un pintor español.", "Pinté el Guernica.", "Fui una figura del cubismo."] },
  { answer: "cleopatra", clues: ["Fui reina de Egipto.", "Viví en la época de Julio César.", "Soy una de las reinas más famosas de la historia."] },
  { answer: "napoleon|napoleon bonaparte", clues: ["Fui emperador de Francia.", "Luché en Waterloo.", "Mi apellido era Bonaparte."] },
];
