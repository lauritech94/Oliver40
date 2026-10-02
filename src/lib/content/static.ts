/* ───────────── 1 · ACERTIJOS (30) ───────────── */
export const ACERTIJOS: readonly { q: string; a: string; h: string }[] = [
  { q: "El que lo fabrica lo vende, el que lo compra no lo usa y el que lo usa no lo ve.", a: "ataud|feretro", h: "Tiene forma de caja y seis asas." },
  { q: "Oro parece, plata no es. El que no lo adivine bien tonto es.", a: "platano|banana", h: "Se pela y los monos lo adoran." },
  { q: "Cuanto más le quitas, más grande se hace.", a: "agujero|hoyo", h: "Lo puedes cavar en la arena." },
  { q: "Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera.", a: "pera", h: "Fíjate bien en la última palabra." },
  { q: "Vuelo sin alas, silbo sin boca, golpeo sin manos y nadie me toca.", a: "viento|el viento", h: "Mueve las hojas de los árboles." },
  { q: "Tengo agujas pero no pincho, tengo números pero no sé contar.", a: "reloj|el reloj", h: "Da la hora." },
  { q: "Cuanto más grande es, menos se ve.", a: "oscuridad|la oscuridad", h: "Se acaba al encender la luz." },
  { q: "Siempre está delante de ti y nunca lo puedes ver.", a: "futuro|el futuro", h: "Todavía no ha ocurrido." },
  { q: "Tiene ciudades sin casas, ríos sin agua y montañas sin árboles.", a: "mapa|un mapa|el mapa", h: "Sirve para orientarse." },
  { q: "Si me nombras, desaparezco.", a: "silencio|el silencio", h: "Es lo contrario del ruido." },
  { q: "Tiene hojas pero no es árbol, tiene lomo pero no es animal.", a: "libro|un libro|el libro", h: "Se lee." },
  { q: "Tiene cuatro patas y no anda, tiene respaldo y no habla.", a: "silla|una silla|la silla", h: "Te sientas en ella." },
  { q: "Soy alta cuando soy joven y baja cuando soy vieja.", a: "vela|una vela|la vela", h: "Se apaga con un soplido." },
  { q: "¿Qué es lo que te pertenece, pero los demás lo usan más que tú?", a: "nombre|tu nombre|el nombre", h: "Te lo pusieron al nacer." },
  { q: "¿Qué cosa es que cuanto más seca, más moja?", a: "toalla|una toalla|la toalla", h: "La usas al salir de la ducha." },
  { q: "Tiene corona y no es rey, tiene escamas y no es pez.", a: "pina|la pina|una pina", h: "Fruta tropical." },
  { q: "Redondo, redondo, barril sin fondo.", a: "anillo|el anillo|un anillo", h: "Se lleva en el dedo." },
  { q: "¿Qué hay en medio del mar?", a: "a|la a|la letra a", h: "Mira la palabra «mar»." },
  { q: "Cuanto más lo alimentas, más crece; pero si le das agua, muere.", a: "fuego|el fuego", h: "Quema." },
  { q: "¿Qué sube y baja sin moverse del sitio?", a: "escalera|una escalera|la escalera", h: "Hay en edificios." },
  { q: "Siempre viene, pero nunca llega.", a: "manana|el manana", h: "Después de hoy." },
  { q: "Anda sin pies y llora sin ojos.", a: "nube|la nube|una nube", h: "Está en el cielo." },
  { q: "Tengo un ojo y no veo nada.", a: "aguja|una aguja|la aguja", h: "Se usa para coser." },
  { q: "Si lo tienes quieres compartirlo; si lo compartes, ya no lo tienes.", a: "secreto|un secreto|el secreto", h: "Mejor guardarlo." },
  { q: "Tengo teclas pero no abro puertas, tengo martillos pero no soy herramienta.", a: "piano|el piano|un piano", h: "Instrumento de 88 teclas." },
  { q: "Se coge, pero no se puede tirar.", a: "resfriado|catarro|constipado|un resfriado|gripe", h: "Estornudos garantizados." },
  { q: "¿Qué animal tiene las cinco vocales en su nombre?", a: "murcielago|el murcielago", h: "Vuela de noche." },
  { q: "Soy más ligero que una pluma, pero ni el hombre más fuerte puede sostenerme mucho tiempo.", a: "aliento|el aliento|respiracion|la respiracion", h: "Contén esto y verás." },
  { q: "¿Cuántos meses del año tienen 28 días?", a: "12|todos|todos los meses|doce", h: "Es una pregunta trampa." },
  { q: "Tiene cama y no duerme, tiene boca y no habla.", a: "rio|el rio|un rio", h: "Fluye hacia el mar." },
];

/* ───────────── 4 · EMOJIS (30) ───────────── */
export const EMOJI_PUZZLES: readonly { e: string; a: string; kind: "Película" | "Serie"; h: string }[] = [
  { e: "🦁👑🌅", a: "el rey leon|rey leon", kind: "Película", h: "Disney, sabana africana." },
  { e: "🚢🧊💔", a: "titanic", kind: "Película", h: "Año 1912." },
  { e: "🕶️💊🔴🔵", a: "matrix|the matrix", kind: "Película", h: "¿Pastilla roja o azul?" },
  { e: "🦈🏖️😱", a: "tiburon|tiburón|jaws", kind: "Película", h: "Spielberg, 1975." },
  { e: "🧙‍♂️💍🌋", a: "el senor de los anillos|senor de los anillos", kind: "Película", h: "Mordor y un anillo." },
  { e: "🐠🔍👨‍👦", a: "buscando a nemo|nemo", kind: "Película", h: "Pixar, océano." },
  { e: "🕷️🧑🏙️", a: "spiderman|spider man|el hombre arana", kind: "Película", h: "Nueva York, telarañas." },
  { e: "🦖🌴🧬", a: "jurassic park|parque jurasico", kind: "Película", h: "Dinosaurios clonados." },
  { e: "🧞🪔📜", a: "aladdin|aladin", kind: "Película", h: "Lámpara maravillosa." },
  { e: "❄️👸⛄", a: "frozen|frozen el reino del hielo", kind: "Película", h: "«Suéltalo»." },
  { e: "🤖🗑️🌱❤️", a: "wall e|walle|wall-e", kind: "Película", h: "Robot que limpia la Tierra." },
  { e: "🏠🎈👴", a: "up", kind: "Película", h: "Dos letras, globos." },
  { e: "🐀👨‍🍳🥖🇫🇷", a: "ratatouille", kind: "Película", h: "Un ratón cocinero." },
  { e: "🚀🤠🧸", a: "toy story", kind: "Película", h: "Woody y Buzz." },
  { e: "⚡👓🧹🏰", a: "harry potter", kind: "Película", h: "Mago con cicatriz." },
  { e: "🦇🃏🌃", a: "batman|el caballero oscuro", kind: "Película", h: "Ciudad Gótica." },
  { e: "🐼🥋🍜", a: "kung fu panda", kind: "Película", h: "Un oso muy ágil." },
  { e: "🏎️⚡🏁🚗", a: "cars", kind: "Película", h: "Rayo McQueen." },
  { e: "🦊🐰👮🏙️", a: "zootropolis|zootopia|zootropolis", kind: "Película", h: "Ciudad de animales." },
  { e: "🌪️👠🦁🤖", a: "el mago de oz|mago de oz", kind: "Película", h: "Camino de baldosas amarillas." },
  { e: "🐉🗡️❄️👑", a: "juego de tronos", kind: "Serie", h: "Se acerca el invierno." },
  { e: "🧑‍🔬🧪🏜️💰", a: "breaking bad", kind: "Serie", h: "Un profe de química." },
  { e: "🎭🔴🏦💰", a: "la casa de papel", kind: "Serie", h: "Monos rojos y Dalí." },
  { e: "🧒🚲👾🔦", a: "stranger things", kind: "Serie", h: "Hawkins, Eleven." },
  { e: "☕🛋️👫👫", a: "friends", kind: "Serie", h: "Central Perk." },
  { e: "🎩🔫🇬🇧", a: "peaky blinders", kind: "Serie", h: "Los Shelby." },
  { e: "🦑🔴⚪🎮", a: "el juego del calamar|squid game", kind: "Serie", h: "Juegos infantiles mortales." },
  { e: "🧛🌙💘", a: "crepusculo|twilight", kind: "Película", h: "Vampiro enamorado." },
  { e: "🦸🛡️🇺🇸⭐", a: "capitan america", kind: "Película", h: "Escudo con estrella." },
  { e: "🟡👨‍🦲🍩📺", a: "los simpson|simpson", kind: "Serie", h: "Springfield." },
];

/* ───────────── 8 · FOTOS (16 poses) ───────────── */
export const FOTOS: readonly { title: string; prompt: string }[] = [
  { title: "Pirámide humana", prompt: "Haz una foto con 4 personas formando una pirámide humana (vale de rodillas)." },
  { title: "Saltando a la vez", prompt: "Haz una foto de 3 personas saltando a la vez, con los pies en el aire." },
  { title: "Retrato renacentista", prompt: "Haz una foto imitando un cuadro clásico: alguien posando de perfil, con una tela por encima y cara muy seria." },
  { title: "Perspectiva forzada", prompt: "Haz una foto en la que parezca que una persona sostiene a otra en la palma de la mano." },
  { title: "Portada de disco", prompt: "Haz una foto con 5 personas de espaldas mirando a la pared, estilo portada de disco." },
  { title: "Cara de susto", prompt: "Haz una selfie con 4 personas con la máxima cara de susto, como si hubierais visto un fantasma." },
  { title: "Estatuas vivientes", prompt: "Haz una foto de 3 personas posando como estatuas de una plaza, completamente inmóviles." },
  { title: "Fila ciega", prompt: "Haz una foto de 5 personas en fila india, cada una con las manos sobre los hombros de la de delante y todas con los ojos cerrados." },
  { title: "Estrella humana", prompt: "Haz una foto cenital (desde arriba) de 4 personas tumbadas en el suelo formando una estrella." },
  { title: "Superhéroes", prompt: "Haz una foto de 3 personas posando como superhéroes con capas improvisadas." },
  { title: "Mejor amigo del juez", prompt: "Hazte una foto abrazando a un juez como si fuera tu mejor amigo de toda la vida." },
  { title: "Baile congelado", prompt: "Haz una foto de 4 personas congeladas a mitad de un paso de baile." },
  { title: "Póker facial", prompt: "Haz una foto de 5 personas mirando a cámara muy serias, cada una con algo ridículo en la cabeza." },
  { title: "Letras humanas", prompt: "Haz una foto de 3 o más personas formando con el cuerpo la palabra «SI» o «NO»." },
  { title: "Escena del Titanic", prompt: "Haz una foto recreando la escena del Titanic: una persona con los brazos abiertos y otra sujetándola por detrás." },
  { title: "La celebridad", prompt: "Haz una foto en la que todo el mundo mire a una misma persona como si fuera una celebridad mundial." },
  { title: "Bodegón imposible", prompt: "Haz una foto de un bodegón con exactamente 7 objetos de cocina, sin que aparezca ninguna persona." },
  { title: "Cara de objetos", prompt: "Coloca objetos para formar una cara (dos ojos, nariz y boca) y hazle una foto cenital." },
  { title: "Torre de zapatos", prompt: "Haz una foto de una torre de al menos 6 zapatos, sin que nadie la sujete." },
  { title: "Habitación en miniatura", prompt: "Haz una foto desde el suelo de una habitación para que parezca una casa de gigantes." },
  { title: "La habitación más ordenada", prompt: "Haz una foto de la habitación más ordenada de la casa; el juez debe poder identificar qué habitación es." },
  { title: "Reflejo sin fotógrafo", prompt: "Haz una foto de un reflejo (espejo, ventana o metal) donde se vea un objeto y no se vea quien hace la foto." },
  { title: "Círculo perfecto", prompt: "Busca 5 objetos redondos distintos, júntalos en el suelo y haz una foto desde arriba." },
  { title: "El color secreto", prompt: "Haz una foto en la que aparezcan 6 objetos del mismo color, pero ningún objeto de otro color llamativo." },
  { title: "Google: gato astronauta", prompt: "Busca en Google Imágenes una foto de un gato con casco de astronauta en el espacio. Enséñasela al juez para que valide el resultado y te dé la palabra secreta." },
  { title: "Google: edificio torcido", prompt: "Busca en Google Imágenes una foto de la Casa Danzante de Praga (edificio que parece bailar). Enséñasela al juez y pídele la palabra secreta." },
  { title: "Google: animal camuflado", prompt: "Busca en Google Imágenes una foto de un pulpo camuflado en un arrecife. Enséñasela al juez y pídele la palabra secreta." },
  { title: "Google: arte imposible", prompt: "Busca en Google Imágenes una foto de la escalera imposible de Escher. Enséñasela al juez y pídele la palabra secreta." },
];

/* ───────────── 12 · CULTURA GENERAL ───────────── */
export const CULTURA: readonly { cat: string; q: string; a: string; h: string }[] = [
  { cat: "astronomía", q: "¿Cuál es el planeta más grande del sistema solar?", a: "jupiter", h: "Tiene una gran mancha roja." },
  { cat: "arte", q: "¿Quién pintó «Las Meninas»?", a: "velazquez|diego velazquez", h: "Pintor sevillano del Siglo de Oro." },
  { cat: "historia", q: "¿En qué año llegó el ser humano a la Luna? (solo el número)", a: "1969", h: "Apolo 11." },
  { cat: "cuerpo humano", q: "¿Cuántos huesos tiene un cuerpo humano adulto? (solo el número)", a: "206", h: "Entre 200 y 210." },
  { cat: "geografía", q: "¿Cuál es el río más largo de la península ibérica?", a: "tajo|el tajo", h: "Pasa por Toledo y Lisboa." },
  { cat: "literatura", q: "¿Quién escribió «Don Quijote de la Mancha»?", a: "cervantes|miguel de cervantes", h: "Apodado el «manco de Lepanto»." },
  { cat: "geografía", q: "¿Cuál es el océano más grande del planeta?", a: "pacifico|oceano pacifico|el pacifico", h: "Su nombre significa «tranquilo»." },
  { cat: "ciencia", q: "¿Qué gas necesitan las plantas para hacer la fotosíntesis?", a: "dioxido de carbono|co2", h: "Lo expulsamos al respirar." },
  { cat: "química", q: "¿Qué metal tiene como símbolo químico «Au»?", a: "oro|el oro", h: "Es amarillo y caro." },
  { cat: "geografía", q: "¿En qué país está la Torre de Pisa?", a: "italia", h: "Forma de bota." },
  { cat: "historia", q: "¿Quién descubrió América en 1492 para los Reyes Católicos?", a: "cristobal colon|colon", h: "Navegante genovés." },
  { cat: "deportes", q: "¿Cuántos jugadores de un mismo equipo hay en pista en baloncesto? (solo el número)", a: "5|cinco", h: "Menos de 6." },
  { cat: "naturaleza", q: "¿Cuál es el animal más grande del planeta?", a: "ballena azul|ballena|la ballena azul", h: "Vive en el mar." },
  { cat: "matemáticas", q: "¿Cuántos lados tiene un hexágono? (solo el número)", a: "6|seis", h: "Hexa = seis." },
  { cat: "geografía", q: "¿Cuál es la montaña más alta del mundo?", a: "everest|monte everest|el everest", h: "Está en el Himalaya." },
  { cat: "historia", q: "¿Quién fue el primer presidente de Estados Unidos?", a: "george washington|washington", h: "Está en el billete de un dólar." },
  { cat: "idiomas", q: "¿Qué idioma se habla en Brasil?", a: "portugues|el portugues", h: "No es español." },
  { cat: "geografía", q: "¿Cuál es el país más pequeño del mundo?", a: "vaticano|ciudad del vaticano|el vaticano", h: "Vive el Papa." },
  { cat: "ciencia", q: "¿Cuántos colores tiene el arcoíris? (solo el número)", a: "7|siete", h: "Rojo, naranja, amarillo..." },
  { cat: "música", q: "¿Cuántas cuerdas tiene una guitarra clásica? (solo el número)", a: "6|seis", h: "Mi, la, re, sol, si, mi." },
  { cat: "refrán", q: "Completa el refrán: «Más vale pájaro en mano que ciento ___.»", a: "volando", h: "Es una acción de las aves." },
  { cat: "refrán", q: "Completa el refrán: «A caballo regalado no le mires el ___.»", a: "diente|el diente", h: "Se mira en la boca." },
  { cat: "refrán", q: "Completa el refrán: «En casa del herrero, cuchillo de ___.»", a: "palo", h: "Material poco cortante." },
  { cat: "refrán", q: "Completa el refrán: «Perro ladrador, poco ___.»", a: "mordedor", h: "Lo contrario de ladrar." },
  { cat: "refrán", q: "Completa el refrán: «Ojos que no ven, corazón que no ___.»", a: "siente", h: "Verbo de emociones." },
  { cat: "refrán", q: "Completa el refrán: «No hay mal que por bien no ___.»", a: "venga", h: "Verbo de movimiento hacia aquí." },
  { cat: "refrán", q: "Completa el refrán: «Camarón que se duerme se lo lleva la ___.»", a: "corriente|la corriente", h: "Del agua." },
  { cat: "refrán", q: "Completa el refrán: «A quien madruga, Dios le ___.»", a: "ayuda", h: "Echar una mano." },
  { cat: "refrán", q: "Completa el refrán: «El que mucho abarca, poco ___.»", a: "aprieta", h: "Lo contrario de soltar." },
  { cat: "refrán", q: "Completa el refrán: «Cría cuervos y te sacarán los ___.»", a: "ojos|los ojos", h: "Con ellos ves." },
  { cat: "refrán", q: "Completa el refrán: «En boca cerrada no entran ___.»", a: "moscas", h: "Insectos molestos." },
  { cat: "refrán", q: "Completa el refrán: «Al mal tiempo, buena ___.»", a: "cara", h: "Está en tu rostro." },
  { cat: "refrán", q: "Completa el refrán: «De tal palo, tal ___.»", a: "astilla|la astilla", h: "Un trocito de madera." },
  { cat: "refrán", q: "Completa el refrán: «Dime con quién andas y te diré quién ___.»", a: "eres", h: "Verbo ser." },
];

export const COUNTRIES: readonly (readonly [string, string])[] = [
  ["Francia", "paris"], ["Italia", "roma"], ["Alemania", "berlin"], ["Portugal", "lisboa"],
  ["Reino Unido", "londres"], ["Grecia", "atenas"], ["Argentina", "buenos aires"],
  ["México", "ciudad de mexico|mexico"], ["Perú", "lima"], ["Chile", "santiago|santiago de chile"],
  ["Colombia", "bogota"], ["Japón", "tokio"], ["China", "pekin|beijing"], ["Egipto", "el cairo|cairo"],
  ["Marruecos", "rabat"], ["Australia", "canberra"], ["Canadá", "ottawa"], ["Brasil", "brasilia"],
  ["Rusia", "moscu"], ["Turquía", "ankara"], ["Suecia", "estocolmo"], ["Noruega", "oslo"],
  ["Austria", "viena"], ["Polonia", "varsovia"], ["Irlanda", "dublin"], ["Cuba", "la habana|habana"],
  ["Venezuela", "caracas"], ["Uruguay", "montevideo"], ["Tailandia", "bangkok"], ["Suiza", "berna"],
  ["Países Bajos", "amsterdam"], ["Bélgica", "bruselas"], ["India", "nueva delhi|delhi"], ["Kenia", "nairobi"],
];

/* ───────────── 15 · ¿QUIÉN SOY? (30) ───────────── */
export const QUIEN_SOY: readonly { a: string; c: readonly [string, string, string] }[] = [
  { a: "harry potter|harry", c: ["Soy huérfano y viví en un armario bajo las escaleras.", "Tengo una cicatriz en forma de rayo en la frente.", "Estudio en Hogwarts y mi mejor amigo se llama Ron."] },
  { a: "napoleon|napoleon bonaparte", c: ["Nací en la isla de Córcega.", "Fui emperador de Francia.", "Perdí mi última gran batalla en Waterloo."] },
  { a: "don quijote|quijote|alonso quijano", c: ["Leí tantos libros de caballerías que perdí el juicio.", "Mi caballo se llama Rocinante.", "Luché contra unos molinos creyendo que eran gigantes."] },
  { a: "albert einstein|einstein", c: ["Nací en Alemania y acabé viviendo en Estados Unidos.", "Formulé la teoría de la relatividad.", "Mi fórmula más famosa es E = mc²."] },
  { a: "leonardo da vinci|da vinci|leonardo", c: ["Soy un genio italiano del Renacimiento.", "Pinté a una mujer de sonrisa misteriosa.", "Dibujé máquinas voladoras siglos antes de que existieran."] },
  { a: "shakira", c: ["Nací en Barranquilla (Colombia).", "Mis caderas no mienten.", "Canté «Waka Waka» en el Mundial de 2010."] },
  { a: "superman|clark kent", c: ["Vengo de otro planeta, Krypton.", "Me debilita la kriptonita.", "Soy periodista bajo la identidad de Clark Kent."] },
  { a: "sherlock holmes|sherlock", c: ["Vivo en Baker Street 221B.", "Mi mejor amigo es un médico llamado Watson.", "Resuelvo crímenes por deducción."] },
  { a: "cenicienta|cinderella", c: ["Mis hermanastras me tratan muy mal.", "Un hada convierte una calabaza en carroza.", "Pierdo un zapato de cristal a medianoche."] },
  { a: "pinocho", c: ["Estoy hecho de madera.", "Mi creador se llama Geppetto.", "Si digo mentiras me crece la nariz."] },
  { a: "lionel messi|messi", c: ["Nací en Rosario (Argentina).", "Llevo el dorsal 10.", "Gané el Mundial de Qatar 2022."] },
  { a: "frida kahlo|frida", c: ["Soy mexicana y pintora.", "Me pinto a menudo con unas cejas muy marcadas.", "Estuve casada con Diego Rivera."] },
  { a: "cleopatra", c: ["Fui reina de Egipto.", "Mi relación con Julio César y Marco Antonio cambió la historia.", "Dicen que mi belleza era legendaria."] },
  { a: "mario|super mario|mario bros", c: ["Soy fontanero.", "Rescato a una princesa llamada Peach.", "Mi hermano se llama Luigi."] },
  { a: "darth vader|vader|anakin skywalker", c: ["Respiro con mucha dificultad.", "Soy el padre de Luke.", "Pertenezco al lado oscuro de la Fuerza."] },
  { a: "peter pan", c: ["No quiero crecer nunca.", "Vivo en el País de Nunca Jamás.", "Mi enemigo es el Capitán Garfio."] },
  { a: "michael jackson", c: ["Soy conocido como el Rey del Pop.", "Bailaba el moonwalk.", "Mi álbum más famoso se llama Thriller."] },
  { a: "isaac newton|newton", c: ["Dicen que me cayó una manzana en la cabeza.", "Descubrí la ley de la gravitación universal.", "Fui inglés y viví en el siglo XVII."] },
  { a: "mickey mouse|mickey", c: ["Soy un ratón.", "Mi novia se llama Minnie.", "Mi creador fue Walt Disney."] },
  { a: "gandalf", c: ["Soy un mago de barba larga.", "Acompaño a un hobbit con un anillo.", "Grito «¡No puedes pasar!»."] },
  { a: "bob esponja|spongebob", c: ["Vivo en una piña bajo el mar.", "Trabajo en el Crustáceo Crujiente.", "Mi mejor amigo se llama Patricio."] },
  { a: "rafa nadal|rafael nadal|nadal", c: ["Nací en Manacor.", "Soy el rey de la tierra batida.", "He ganado 14 veces Roland Garros."] },
  { a: "pablo picasso|picasso", c: ["Nací en Málaga.", "Pinté el «Guernica».", "Fundé el cubismo junto a Braque."] },
  { a: "mozart|wolfgang amadeus mozart", c: ["Fui un niño prodigio austriaco.", "Compuse «La flauta mágica».", "Mi nombre empieza por Wolfgang Amadeus."] },
  { a: "homer simpson|homer", c: ["Trabajo en una central nuclear.", "Mi comida favorita son las rosquillas.", "Grito «¡D'oh!» cuando algo me sale mal."] },
  { a: "lara croft", c: ["Soy arqueóloga y aventurera.", "Llevo dos pistolas.", "Protagonizo la saga Tomb Raider."] },
  { a: "marie curie|curie", c: ["Nací en Polonia.", "Descubrí el polonio y el radio.", "Gané dos premios Nobel."] },
  { a: "charlie chaplin|chaplin|charlot", c: ["Fui un actor del cine mudo.", "Llevo bigote pequeño, bombín y bastón.", "Mi personaje más famoso se llama Charlot."] },
  { a: "pikachu", c: ["Soy amarillo y pequeño.", "Mi entrenador se llama Ash.", "Mi ataque estrella es el impactrueno."] },
  { a: "jack sparrow|capitan jack sparrow", c: ["Soy un pirata excéntrico.", "Mi barco es la Perla Negra.", "Siempre pregunto por qué se ha acabado el ron."] },
];

/* ───────────── 11 · FÓRMULAS DE PALABRAS ───────────── */
export type CompoundPart =
  | { op: "first"; word: string; n: number }
  | { op: "last"; word: string; n: number }
  | { op: "rev"; word: string }
  | { op: "dropFirst"; word: string; n: number };

export type Compound = { cat: string; parts: readonly CompoundPart[] };

/** El resultado de cada fórmula se calcula en código a partir de las piezas. */
export const COMPOUNDS: readonly Compound[] = [
  // GIRASOL
  { cat: "una flor", parts: [{ op: "first", word: "GIRAFA", n: 2 }, { op: "first", word: "RATON", n: 2 }, { op: "last", word: "PARASOL", n: 3 }] },
  // MARIPOSA
  { cat: "un insecto", parts: [{ op: "first", word: "MARIDO", n: 4 }, { op: "last", word: "ESPOSA", n: 4 }] },
  // ESTRELLA
  { cat: "un astro del cielo nocturno", parts: [{ op: "first", word: "ESTRENO", n: 5 }, { op: "last", word: "PAELLA", n: 3 }] },
  // ESCALERA
  { cat: "algo que sirve para subir", parts: [{ op: "first", word: "ESPEJO", n: 2 }, { op: "first", word: "CALENDARIO", n: 4 }, { op: "last", word: "AHORA", n: 2 }] },
  // COLOR
  { cat: "lo que tiene un arcoíris", parts: [{ op: "dropFirst", word: "CARACOL", n: 4 }, { op: "last", word: "DOLOR", n: 2 }] },
  // ROMANCE
  { cat: "una historia de amor", parts: [{ op: "rev", word: "AMOR" }, { op: "last", word: "LANCE", n: 3 }] },
  // AMARGURA
  { cat: "un sentimiento", parts: [{ op: "rev", word: "RAMA" }, { op: "last", word: "FIGURA", n: 4 }] },
  // CAMPANA
  { cat: "algo que suena en una torre", parts: [{ op: "first", word: "CAMPEON", n: 4 }, { op: "last", word: "MANZANA", n: 3 }] },
  // SOMBRERO
  { cat: "una prenda para la cabeza", parts: [{ op: "first", word: "SOMBRA", n: 5 }, { op: "last", word: "ZAPATERO", n: 3 }] },
  // TORTUGA
  { cat: "un animal con caparazón", parts: [{ op: "first", word: "TORERO", n: 3 }, { op: "first", word: "TUBO", n: 2 }, { op: "last", word: "VEGA", n: 2 }] },
  // PANTALON
  { cat: "una prenda de ropa", parts: [{ op: "first", word: "PANDA", n: 3 }, { op: "first", word: "TALENTO", n: 3 }, { op: "last", word: "BALON", n: 2 }] },
  // ORDENADOR
  { cat: "un aparato electrónico", parts: [{ op: "first", word: "ORDENAR", n: 5 }, { op: "last", word: "NADADOR", n: 4 }] },
];
