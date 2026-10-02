/** [palabra, categoría] — sin tildes ni ñ. */
export const ANAGRAMS: readonly (readonly [string, string])[] = [
  ["cazuela", "cocina"], ["tenedor", "cocina"], ["sarten", "cocina"], ["cuchillo", "cocina"],
  ["nevera", "cocina"], ["batidora", "cocina"], ["tostadora", "cocina"],
  ["maleta", "viajes"], ["pasaporte", "viajes"], ["aeropuerto", "viajes"], ["equipaje", "viajes"],
  ["autopista", "viajes"], ["billete", "viajes"],
  ["elefante", "animal"], ["cocodrilo", "animal"], ["murcielago", "animal"], ["mariposa", "animal"],
  ["tortuga", "animal"], ["jirafa", "animal"], ["pinguino", "animal"], ["delfin", "animal"],
  ["caballo", "animal"], ["ardilla", "animal"],
  ["guitarra", "instrumento"], ["trompeta", "instrumento"], ["violin", "instrumento"],
  ["bateria", "instrumento"], ["saxofon", "instrumento"], ["tambor", "instrumento"],
  ["acordeon", "instrumento"],
  ["confeti", "fiesta"], ["regalo", "fiesta"], ["invitado", "fiesta"], ["brindis", "fiesta"],
  ["pastel", "fiesta"],
  ["baloncesto", "deporte"], ["natacion", "deporte"], ["ciclismo", "deporte"], ["portero", "deporte"],
  ["raqueta", "deporte"], ["maraton", "deporte"], ["balonmano", "deporte"],
  ["ventana", "casa"], ["escalera", "casa"], ["ascensor", "casa"], ["cortina", "casa"],
  ["almohada", "casa"], ["colchon", "casa"], ["alfombra", "casa"],
  ["montana", "naturaleza"], ["volcan", "naturaleza"], ["cascada", "naturaleza"],
  ["bosque", "naturaleza"], ["desierto", "naturaleza"], ["glaciar", "naturaleza"],
  ["bombero", "profesión"], ["carpintero", "profesión"], ["arquitecto", "profesión"],
  ["cartero", "profesión"], ["dentista", "profesión"], ["camarero", "profesión"],
  ["tortilla", "comida"], ["croqueta", "comida"], ["empanada", "comida"], ["chocolate", "comida"],
  ["helado", "comida"], ["macarrones", "comida"],
  ["ordenador", "tecnología"], ["teclado", "tecnología"], ["pantalla", "tecnología"],
  ["altavoz", "tecnología"], ["auriculares", "tecnología"],
];

/** Palabras para la prueba de código escondido (sin tildes ni ñ). */
export const CODE_WORDS: readonly string[] = [
  "lechuga", "ventana", "esponja", "paraguas", "almohada", "maceta", "tijeras", "cuchara",
  "cortina", "zapato", "bufanda", "cepillo", "tostadora", "espejo", "lampara", "mochila",
  "manzana", "cojin", "sabana", "escoba", "alfombra", "sombrero", "bolsillo", "toalla",
  "persiana", "armario", "cajon", "tenedor", "botella", "llavero", "calcetin", "pijama",
  "sarten", "plato", "mesa", "sillon", "estante", "cartera", "paraguero", "bombilla",
];

/** Palabras secretas que dan los jueces en las pruebas validadas a mano. */
export const SECRET_WORDS: readonly string[] = [
  "mandarina", "cometa", "pincel", "gigante", "vinilo", "relampago", "piramide", "flamenco",
  "ladrillo", "canasta", "estatua", "iglu", "muela", "iceberg", "florete", "tornillo",
  "sevilla", "microfono", "almena", "brujula", "despegue", "retrato", "trueno", "burbuja",
  "farolillo", "tulipan", "mochila", "anzuelo", "bufanda", "canguro", "dragon", "espiral",
  "fogata", "galleta", "hamaca", "lagarto", "molino", "naranja", "ostra", "paloma", "quesito",
  "roble", "sirena", "tambor", "unicornio", "volcan", "xilofono", "yogur", "zanahoria",
  "acordeon", "bellota", "cactus", "delfin", "escoba", "fresa", "girasol", "hielo", "isla",
  "jazmin", "koala", "limon", "medusa", "nenufar", "ovillo", "pandero", "queso", "rinoceronte",
  "sombrilla", "trebol", "urraca", "velero", "wafle", "yate", "zorro",
];

/** Temas de la sopa de letras (palabras de hasta 7 letras, sin tildes). */
export const SOPA_THEMES: readonly { name: string; words: readonly string[] }[] = [
  { name: "frutas", words: ["pera", "manzana", "fresa", "limon", "kiwi", "uva", "melon", "cereza", "sandia", "platano", "naranja"] },
  { name: "animales", words: ["perro", "gato", "caballo", "tigre", "cebra", "raton", "conejo", "delfin", "oveja", "jirafa", "panda"] },
  { name: "países", words: ["chile", "peru", "cuba", "italia", "grecia", "japon", "egipto", "china", "brasil", "francia"] },
  { name: "colores", words: ["rojo", "azul", "verde", "negro", "blanco", "gris", "rosa", "morado", "marron", "dorado"] },
  { name: "deportes", words: ["futbol", "tenis", "golf", "boxeo", "judo", "rugby", "remo", "esqui", "padel", "surf", "natacion"] },
  { name: "instrumentos", words: ["piano", "flauta", "violin", "arpa", "tambor", "oboe", "gaita", "organo", "banjo"] },
  { name: "profesiones", words: ["medico", "piloto", "juez", "chef", "actor", "sastre", "pintor", "bombero", "policia"] },
  { name: "verduras", words: ["tomate", "cebolla", "lechuga", "pepino", "ajo", "nabo", "apio", "maiz", "judia", "acelga"] },
  { name: "muebles", words: ["sofa", "mesa", "silla", "cama", "armario", "estante", "banco", "cajon"] },
  { name: "transportes", words: ["tren", "avion", "barco", "moto", "coche", "bici", "metro", "taxi", "camion", "globo"] },
  { name: "partes del cuerpo", words: ["mano", "pie", "brazo", "pierna", "cabeza", "oreja", "nariz", "ojo", "boca", "dedo", "codo", "rodilla"] },
  { name: "ciudades españolas", words: ["madrid", "sevilla", "bilbao", "vigo", "leon", "burgos", "toledo", "cadiz", "murcia", "malaga", "granada"] },
];

/** Palabras base para las fórmulas de operaciones con letras (8-11 letras). */
export const FORMULA_WORDS: readonly string[] = [
  "escalera", "mariposa", "ordenador", "telefono", "chocolate", "elefante", "calendario",
  "aeropuerto", "biblioteca", "ventilador", "camarero", "bicicleta", "zapatilla", "sombrilla",
  "trompeta", "murcielago", "cocodrilo", "helicoptero", "periodista", "refrigerador",
];

export const MEMORY_NOUNS: readonly string[] = [
  "perro", "gato", "casa", "sol", "luna", "mesa", "silla", "libro", "coche", "avion", "barco",
  "tren", "flor", "arbol", "rio", "mar", "playa", "monte", "nube", "lluvia", "viento", "fuego",
  "agua", "tierra", "pan", "queso", "leche", "vino", "cafe", "sopa", "pizza", "llave",
];
