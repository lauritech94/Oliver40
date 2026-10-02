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
4. Ejecutar **un comando** para crear las tablas y sembrar la partida.
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

## 4 · Preparar la base de datos (el paso importante)

Este comando crea las tablas y siembra la partida con los 28 recorridos. **Se ejecuta desde tu
ordenador**, apuntando a la base de datos de producción.

```bash
# 1. Instala las dependencias (si no lo has hecho ya)
npm install

# 2. Crea un archivo .env con la cadena de NEON (no la de local)
echo 'DATABASE_URL=postgresql://usuario:contrasena@ep-algo-123...neon.tech/neondb?sslmode=require' > .env

# 3. Lanza la preparación
npm run db:setup
```

Deberías ver:

```
✅ Todo listo:
   · 28 jugadores
   · 420 pruebas
   · 420 tarjetas NFC distintas
```

Recarga tu web: la lista de los 28 nombres ya aparece.

> Este comando es **seguro de repetir**. Si la partida ya existe, no cambia ninguna asignación.

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
| **Interacción social** | A quién hay que preguntar y la respuesta. **Solo para jueces.** |
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
| 02 | 🗣️ Interacción social | Automática (ficha) o juez |
| 03 | 🔤 Anagrama | Automática |
| 04 | 😱 Jeroglífico de emojis | Automática |
| 05 | 🧠 Lógica | Automática |
| 06 | 🗝️ Código escondido | Automática |
| 07 | ⬛ Nonograma (interactivo) | Automática |
| 08 | 📸 Foto | 🔑 Palabra del juez |
| 09 | 🔍 Sopa de letras | Automática |
| 10 | 🔢 Serie numérica | Automática |
| 11 | 🔡 Fórmula de palabras | Automática |
| 12 | 🌍 Cultura general | Automática |
| 13 | 💭 Memoria | Automática |
| 14 | 🔎 Búsqueda del objeto | Automática |
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
- **Las fichas sociales son opcionales.** Si alguien no la rellena, su prueba asociada la
  valida un juez a mano (la hoja impresa lo indica).

---

Hecho con Next.js, PostgreSQL y Drizzle ORM.
