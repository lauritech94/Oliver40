# 🎪 Gymkhana NFC — 28 jugadores, 420 tarjetas

Una gymkhana de **una sola partida**: 28 personas, 15 pruebas cada una y 420 tarjetas NFC
exclusivas. El recorrido está **fijado en el código**, así que lo que imprimes hoy es
exactamente lo que se jugará el día de la fiesta.

- Cada jugador escanea un QR, elige su nombre y ve un tablero de 15 casillas con candado.
- Al superar una prueba se desbloquea la siguiente y aparece el número de tarjeta a buscar.
- Ninguna tarjeta pertenece a dos personas: si escaneas la de otro, la app te lo dice.

---

## 🚀 Puesta en marcha (resumen)

1. Subir el código a GitHub.
2. Crear una base de datos PostgreSQL gratuita (Neon).
3. Desplegar en Vercel.
4. Abrir **`/setup`** en tu web y pulsar un botón (sin terminal).
5. Imprimir las tarjetas y grabar los NFC con tu dominio final.

Tiempo aproximado: 20 minutos.

---

## 1 · Subir el código a GitHub

En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Gymkhana NFC: 28 recorridos fijos"
```

Crea un repositorio vacío en GitHub (**sin** README ni .gitignore) y enlaza:

```bash
git remote add origin https://github.com/TU_USUARIO/gymkhana-nfc.git
git branch -M main
git push -u origin main
```

> El archivo `.env` **no se sube** (está en `.gitignore`). Es correcto: contiene la contraseña
> de tu base de datos.

**¿Lo pongo público o privado?** Si el repositorio es público, cualquiera podría leer el código
y deducir las respuestas. Para una gymkhana entre amigos da igual, pero si quieres evitarlo,
márcalo como **privado** al crearlo. Vercel funciona igual con repos privados.

---

## 2 · Crear la base de datos (Neon, gratis)

1. Entra en [neon.tech](https://neon.tech) y regístrate.
2. **Create project** → ponle un nombre (p. ej. `gymkhana`) y elige la región más cercana
   (Frankfurt si estás en España).
3. Copia la cadena de conexión (**Connection string**). Tiene esta pinta:

```
postgresql://usuario:contrasena@ep-algo-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

Guárdala, la usarás dos veces.

---

## 3 · Desplegar en Vercel

1. Entra en [vercel.com](https://vercel.com) y accede con tu cuenta de GitHub.
2. **Add New → Project** y elige el repositorio que acabas de subir.
3. Antes de pulsar Deploy, abre **Environment Variables** y añade:

   | Name           | Value                                   |
   | -------------- | --------------------------------------- |
   | `DATABASE_URL` | la cadena de conexión de Neon del paso 2 |

4. **Deploy**. Al terminar tendrás una URL tipo `https://gymkhana-nfc.vercel.app`.

> ⚠️ Si abres la web ahora dirá que la base de datos no está preparada. Es normal: falta el
> paso 4.

---

## Si Vercel dice «Cannot find module './content/words'»

**No es que falte código:** hay **copias duplicadas y sueltas en la raíz** de GitHub.

La prueba está en el propio log. Cuando un archivo está donde debe, Vercel escribe su ruta
completa:

```text
./src/lib/content/words.ts:80:7     ← archivo real, dentro de src/
```

Pero el error de tu despliegue dice:

```text
./catalog.ts:3:52                   ← copia suelta en la raíz del repositorio
```

Solo aparece el nombre porque ese `catalog.ts` está **fuera de `src/`**. TypeScript compilaba
esa copia antigua, cuyo import `./content/words` no puede resolver porque la carpeta `content/`
solo existe dentro de `src/lib/`. La copia buena (`src/lib/catalog.ts`) sí estaba bien.

Lo mismo pasaba antes con `./Puzzle.tsx` y `@/lib/puzzle-board`. Cada arreglo hacía desaparecer
un error porque solo se arreglaba la copia huérfana; por eso parecía que «todo iba bien y de
pronto no».

### Ya está corregido automáticamente

`tsconfig.json` ahora compila solo `src/`, `scripts/`, `drizzle/` y los archivos de configuración.
Las copias sueltas de la raíz ya no pueden romper el build. Además, el `prebuild` las detecta y
las lista como aviso para que las borres cuando puedas.

**Qué verás en Vercel al desplegar esta versión:**

```text
> prebuild
✓ Estructura completa: 58 archivos TypeScript/JavaScript revisados.
⚠️  Hay copias sueltas en la raíz del repositorio...
      · catalog.ts
      · Puzzle.tsx
```

Esos archivos sobran: **los reales están dentro de `src/`** (`src/lib`, `src/components`,
`src/app`). Puedes borrarlos de la raíz, pero **ya no bloquean**.

Nada de esto afecta a la base de datos: no ejecutes `/setup` ni reinicies la partida. Las 420
tarjetas, las preguntas y el progreso siguen intactos.

La estructura completa que debe verse en GitHub:

```text
src/
  components/
    Puzzle.tsx
    PuzzleImageEditor.tsx
  content/                    (no existe: va dentro de src/lib)
  lib/
    content/
      extras.ts
      nonograms.json
      profile.ts
      static.ts
      words.ts                ← este es el que aparece en el error
    catalog.ts
    generators.ts
    rand.ts
    types.ts
    ... y el resto de archivos de src/lib/
  db/
  app/
scripts/
public/
drizzle/
```

La ruta real es **`src` → `lib` → `content` → `words.ts`**. Si GitHub muestra `words.ts`
directamente en `src/lib` o en la raíz, está en el lugar incorrecto.

### Comprobación automática del repositorio

He añadido `scripts/verify-layout.mjs` y un script `prebuild`. Antes de compilar, Vercel revisará
todos los imports y mostrará **todos los archivos que faltan**, no solo el primero. Para usarlo:

1. Sube también `scripts/verify-layout.mjs` y el `package.json` actualizado (debe contener
   `"prebuild": "node scripts/verify-layout.mjs"`).
2. Haz commit en la rama que despliega Vercel.
3. Si falta algo, el log terminará con una lista como `src/lib/content/words.ts`,
   `src/lib/content/static.ts`, etc.

No cambies `tsconfig.json`, no muevas los imports a rutas absolutas para ocultar el error
y no uses `git push --force`. Tampoco ejecutes `/setup` ni reinicies la partida.

**No necesitas tocar la base de datos.** Estos errores son solo de archivos de código que no
llegaron a GitHub.

---

## Si Vercel falla con «Cannot find module '@/lib/puzzle-board'»

No es un problema de Neon ni del progreso: la compilación no encuentra un archivo del código.
El alias `@/` de este proyecto apunta a `src/`, así que ese import antiguo buscaba exactamente
`src/lib/puzzle-board.ts`. Subir `puzzle-board.ts` a la raíz no sirve.

**La versión actual de `src/components/Puzzle.tsx` ya es autocontenida:** incluye sus cuatro
funciones de tablero y solo importa React. Se conserva `src/lib/puzzle-board.ts` por compatibilidad
con versiones anteriores, pero el componente actualizado ya no lo necesita.

### Corregirlo desde la web de GitHub

1. Abre tu repositorio, entra en `src/components/` y sustituye **`Puzzle.tsx`** por la versión
   actual de este proyecto. Si no existe esa carpeta, crea el archivo usando la ruta completa
   `src/components/Puzzle.tsx` en «Add file → Create new file» y copia su contenido actualizado.
2. Si tienes además un **`Puzzle.tsx` suelto en la raíz**, elimina esa copia antigua. Aunque no
   se use, TypeScript revisa todos los archivos `.tsx` y esa copia puede seguir rompiendo el build.
3. Guarda los cambios en la rama que despliega Vercel. Comprueba que el nuevo deployment usa
   ese nuevo commit; volver a desplegar el commit antiguo repite el mismo error.

El nombre **`Puzzle.tsx`** lleva P mayúscula. En Vercel las mayúsculas y minúsculas importan.
No cambies el alias de `tsconfig.json` para ocultar este error y no uses `git push --force`.
Si subes todo el proyecto, conserva las carpetas `src/`, `public/` y `scripts/`, sin aplanarlas.
En Vercel la carpeta raíz del proyecto debe ser la que contiene `package.json` y `tsconfig.json`.

**No ejecutes `/setup` ni reinicies la partida por este error.** No se requieren cambios de base
de datos y se conservan las preguntas, los recorridos y el progreso.

---

## 4 · Preparar la base de datos (el paso importante)

Hay **dos formas de hacerlo**. Elige la que te resulte más cómoda; las dos hacen lo mismo.

### Opción A · Desde el navegador (sin terminal) ✅ recomendada

Abre en tu web desplegada:

```
https://TU-DOMINIO.vercel.app/setup
```

Verás una lista de comprobaciones y un botón:

1. Comprueba que **«Variable DATABASE_URL configurada»** esté marcada ✓.
2. Pulsa **«▶ Preparar base de datos ahora»**.
3. Cuando salga el cartel verde **✅ Todo preparado**, ya está.

Debajo verás los contadores: **28 jugadores · 420 pruebas · 420 tarjetas únicas**.

> Si falta la variable `DATABASE_URL`, la propia página te lo dice. Añádela en
> **Vercel → tu proyecto → Settings → Environment Variables** y vuelve a desplegar
> (Deployments → los tres puntos → Redeploy).

### Opción B · Desde la terminal

```bash
# 1. Descarga el proyecto y entra en la carpeta
git clone https://github.com/TU_USUARIO/gymkhana-nfc.git
cd gymkhana-nfc

# 2. Instala las dependencias
npm install

# 3. Crea el archivo .env con tu cadena de NEON (sustituye los datos de ejemplo)
echo 'DATABASE_URL=postgresql://usuario:contrasena@ep-algo-123.eu-central-1.aws.neon.tech/neondb?sslmode=require' > .env

# 4. Lanza la preparación
npm run db:setup
```

Al terminar verás:

```
✅ Todo listo:
   · 28 jugadores
   · 420 pruebas
   · 420 tarjetas NFC distintas
```

> ⚠️ En el paso 3, **copia tu cadena real de Neon**, no la del ejemplo. Es la que copiaste en
> el paso 2 de esta guía. En Windows usa PowerShell o crea el `.env` con el Bloc de notas.

### Comprobación final

Abre `https://TU-DOMINIO.vercel.app/join`. Debe aparecer la lista con los **28 nombres**
(Oli, Piti, Alex…). Si aparece, todo está listo.

Este paso es **seguro de repetir**: si la partida ya existe, no cambia ninguna asignación.

---

## 5 · Imprimir y grabar los NFC

Con la web ya desplegada, abre:

```
https://TU-DOMINIO.vercel.app/judge/print
```

Ahí tienes todo lo que hay que preparar:

| Sección | Qué es |
| ------- | ------ |
| **QR de mesa** | Hoja para dejar en la mesa de salida. Lleva a la elección de nombre. |
| **420 tarjetas** | Para recortar. Tamaño carta (6,3 × 8,6 cm), 9 por hoja. Solo dicen «TARJETA 01». |
| **Mapa de tarjetas** | Qué número pertenece a quién. **Solo para jueces.** |
| **Palabras secretas** | Las 28 palabras de las pruebas de foto. **Solo para jueces.** |
| **Interacción social** | La pregunta de tu encuesta y su respuesta. **Solo para jueces.** |
| **Código maestro** | Una hoja para pegar dentro de la puerta de la nevera. |
| **Búsqueda del objeto** | Hojas con códigos por jugador para esconder. |

### Grabar las etiquetas NFC

Las tarjetas impresas **no llevan ninguna URL**: el enlace va dentro del chip.

1. Descarga el CSV desde la misma página de impresión (botón «Descargar CSV de los 420 NFC»).
   Contiene `numero,url`, por ejemplo: `33,https://tu-dominio.vercel.app/c/33`.
2. Con una app de NFC en el móvil (**NFC Tools** en Android/iOS), graba en cada etiqueta un
   registro de tipo **URL/URI** con el enlace de su número.
3. Pega cada etiqueta detrás de la tarjeta impresa con el mismo número.

> ⚠️ **No grabes los NFC antes de tener el dominio definitivo.** Si grabas una URL de prueba,
> tendrás que regrabar las 420 etiquetas. Si quieres preparar el material antes de desplegar,
> abre `/judge/print?base=https://tu-dominio-futuro.com` y usará esa dirección.

---

## 🧪 Probar los 28 recorridos

Abre:

```
https://TU-DOMINIO.vercel.app/judge/links
```

Verás las 28 personas con sus 15 enlaces en orden. Para recorrer un camino:

1. Pulsa **«Entrar como»** en esa persona.
2. Pulsa **«Ver 15 enlaces»** y ábrelos de arriba abajo.
3. Cada enlace abre su prueba; al acertar se desbloquea la siguiente.

También puedes copiar los 15 enlaces de una persona, o los 420 de golpe.

Si abres el enlace de otra persona, la app responderá *«esta tarjeta no es tuya»*: eso es
justo lo que debe pasar.

**Para reiniciar después de probar:** en `/judge`, botón **«Reiniciar progreso de prueba»**.
Borra el avance pero **no cambia ninguna tarjeta ni ningún recorrido**.

---

## ✏️ Cambiar preguntas y respuestas

Abre:

```
https://TU-DOMINIO.vercel.app/judge/edit
```

Ahí están las **420 pruebas** con su texto actual. Puedes filtrar por jugador, por tipo de
prueba o buscar por texto. Al desplegar una prueba puedes editar:

| Campo | Qué es |
| ----- | ------ |
| **Título** | El nombre corto que se ve en el tablero del jugador |
| **Pregunta** | El enunciado completo que lee el jugador |
| **Respuesta** | La solución. Acepta variantes separadas por `\|` (p. ej. `titanic\|el titanic`) |
| **Pista** | Lo que aparece si el jugador pulsa «Pedir pista» |
| **Nota para jueces** | Texto que solo se ve en el panel, nunca en el móvil del jugador |

Al pulsar **Guardar** se aplica al momento. Las pruebas que hayas tocado se marcan con la
etiqueta **«editada»** y puedes filtrar para ver solo esas. El botón **↺ Restaurar original**
devuelve una prueba al texto del plan inicial.

> 🔒 Editar un texto **no cambia los números de tarjeta ni los recorridos**: lo que ya hayas
> impreso sigue siendo válido.

**Las pruebas de interacción social** se editan igual que el resto: escribes la pregunta (por
ejemplo la de tu encuesta) y su respuesta. El enunciado original menciona a otro jugador:
sustitúyelo por tu pregunta.

### Editarlo en el código (alternativa)

Si prefieres cambiar los textos de raíz y volver a desplegar, cada prueba indica en el editor
de qué archivo viene. El mapa rápido:

| Archivo | Qué contiene |
| ------- | ------------ |
| `src/lib/content/static.ts` | Acertijos, emojis, retos de foto, cultura, ¿quién soy?, fórmulas de palabras |
| `src/lib/content/words.ts` | Palabras de anagramas, del código escondido y las secretas de foto |
| `src/lib/content/nonograms.json` | Las rejillas 5×5 |
| `src/lib/content/profile.ts` | Los datos que se preguntan en la prueba social |
| `src/lib/generators.ts` | Lógica, series, sopas de letras, memoria, búsquedas (se generan con números al azar y luego se congelan) |

⚠️ Si cambias el código **no** pulses nada que regenere la partida: las 420 pruebas ya están
guardadas en tu base de datos y son las que valen. Cambiar el código solo afectaría a una
instalación nueva.

---

## 🖼️ Si el puzzle muestra cuadros vacíos o una imagen rota

La miniatura y las 64 piezas necesitan la misma foto. Si una URL como
`/images/puzzle/pescador_exact.jpg` devuelve **404**, ese JPG no está publicado en Vercel;
no se arregla reiniciando el progreso ni volviendo a ejecutar `/setup`.

### Repararlo con tu foto original (recomendado)

1. Publica esta versión del código en GitHub y espera a que Vercel termine el despliegue.
2. Abre **`/judge/edit` → Foto del puzzle**.
3. Selecciona tu foto original en JPG, PNG o WebP (máximo 3 MB).
4. Comprueba la vista previa y pulsa **«Guardar foto para los 28 puzzles»**.
5. Recarga la tarjeta del jugador.

La foto se comprime sin recortarla, se orienta correctamente y se guarda en los metadatos
existentes de los puzzles. No depende de archivos escritos en el disco temporal de Vercel.
No hay que volver a desplegar tras guardarla, ni crear tablas, ni reimprimir las tarjetas.
Se conservan las respuestas, las ediciones, el número NFC, el orden y el progreso.
Si restauras una prueba al original desde el editor, también se restaura su foto original.

**Alternativa con GitHub:** sube los JPG a `public/images/puzzle/` respetando exactamente
los nombres y mayúsculas que usa tu código y vuelve a desplegar. En la URL pública se
omite `public`: `public/images/puzzle/foto.jpg` se visita en `/images/puzzle/foto.jpg`.

El tablero solo permite jugar cuando la foto se ha cargado y decodificado. Si falta,
muestra un aviso y permite reintentar, en lugar de enseñar casillas vacías. La miniatura,
la ampliación y las piezas muestran la imagen completa con las mismas proporciones.

**Nota sobre las imágenes anteriores:** los archivos `pescador.jpg` y `pescador_exact.jpg`
eran recreaciones generadas, no el archivo original adjuntado en la conversación. Para
usar exactamente tu fotografía, selecciona el archivo original con el nuevo control.

---

## 🔥 Fase final: el Reto de los Récords

Cuando un jugador termina sus **15 pruebas**, en lugar de un simple cartel de fin se desbloquea
la **Fase Final**: dos minijuegos de velocidad y reflejos, y una clasificación general.

| Minijuego | Qué se mide | Marca |
| --------- | ----------- | ----- |
| ⚡ **Reflejos de Relámpago** | Milisegundos que tardas en pulsar cuando la pantalla se pone verde. **3 intentos**, se guarda la mejor marca automáticamente. Si pulsas antes, falta. | Menos ms = mejor |
| 🔢 **Caza de Números** | Tiempo en tocar los números del 1 al 16 en orden. **3 intentos**, se guarda automáticamente. | Menos s = mejor |

* Los jugadores entran desde `/minigames` (o desde el botón que aparece al terminar las 15).
* Cada uno tiene **3 intentos por minijuego**. No hay botones de registro: la marca se guarda sola
  y siempre se conserva la mejor.
* La clasificación está en **`/ranking`** y se actualiza sola. Ideal para proyectarla en una tele
  durante la fiesta: hay podio, récord de reflejos, récord de números y tabla general.

> La fase final **no toca las 420 tarjetas**. Se juega al terminar el recorrido, así que el
> material impreso sigue siendo válido.

---

## 🚫 Sin pistas: dificultad máxima

Ninguna prueba de la gymkhana lleva pista. No hay botón de ayuda, ni texto que asista, ni
campo donde los jueces puedan añadir una: las 420 pruebas se resuelven solo con lo que
aparece en pantalla (y el material escondido, cuando toca).

Si un jugador se bloquea, el camino de escape es que un **juez** valide esa prueba desde el
panel. Eso no altera el recorrido ni las tarjetas.

Esto se verifica automáticamente con `scripts/test-no-hints.ts`, que falla si alguien reintroduce
pistas en el plan, en la app del jugador, en la API o en el editor.

---

## 🎮 El día de la gymkhana

1. Deja el **QR impreso** en la mesa de salida.
2. Reparte las tarjetas por el espacio (el mapa de jueces dice cuál es de quién, pero las
   tarjetas no lo indican).
3. Esconde el **código maestro** (nevera) y las **hojas de búsqueda**.
4. Los jueces llevan impresas las **palabras secretas** y la hoja de **interacción social**.
5. Cada persona escanea el QR, elige su nombre y empieza.

Desde `/judge` sigues en tiempo real quién va por dónde y puedes validar a mano una prueba
(botón **«Validar prueba ✓»**) si alguien se atasca o se pierde una palabra secreta.

---

## 🗂️ Las 15 pruebas

| # | Tipo | Validación |
|---|------|-----------|
| 01 | 🧩 Acertijo | Automática |
| 02 | 🪤 Pregunta trampa | Automática |
| 03 | 🔤 Anagrama | Automática |
| 04 | 😱 Jeroglífico de emojis | Automática |
| 05 | 🧠 Lógica | Automática |
| 06 | 🗝️ Código escondido | Automática |
| 07 | 🧩 Puzzle 8×8 (interactivo) | Automática |
| 08 | 📸 Foto | 🔑 Palabra del juez |
| 09 | 🔍 Sopa de letras | Automática |
| 10 | 🔢 Serie numérica | Automática |
| 11 | 🔡 Fórmula de palabras | Automática |
| 12 | 🌍 Cultura general | Automática |
| 13 | 💭 Memoria | Automática |
| 14 | 🧊 El código de la nevera | Automática |
| 15 | 🕵️ ¿Quién soy? | Automática |

---

## 💻 Desarrollo en local

```bash
npm install
cp .env.example .env     # ajusta DATABASE_URL si hace falta
npm run db:setup         # crea tablas y siembra la partida
npm run dev              # http://localhost:3000
```

| Comando | Qué hace |
| ------- | -------- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run db:setup` | Crea las tablas y siembra la partida (repetible) |
| `npm run db:generate` | Regenera migraciones si cambias el esquema |
| `npm run typecheck` | Comprueba los tipos |

---

## ⚠️ Cosas que conviene saber

- **El plan es fijo.** Vive en `src/lib/fixed-plan.ts` con la versión `gymkhana-28-v2`. Si
  alguna vez cambias esa versión, la app se negará a arrancar sobre una base de datos con el
  plan antiguo, para no invalidar las tarjetas ya impresas.
- **No hay contraseñas.** El panel de jueces (`/judge`) es accesible para cualquiera que
  conozca la dirección, y ahí se ven todas las respuestas. No compartas esa URL con los
  jugadores.
- **Un jugador no puede cambiar de nombre** una vez elegido. Solo se puede desde el panel de
  jueces.
- **Toda prueba necesita respuesta.** Si una tarjeta se queda sin respuesta, el jugador no puede
  superarla. El editor las marca con «⚠ sin respuesta» para que las revises antes del juego.

---

Hecho con Next.js, PostgreSQL y Drizzle ORM.
