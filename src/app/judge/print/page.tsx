import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import PrintButton from "./PrintButton";
import { ensureFixedGame } from "@/lib/fixed-game";
import { FIXED_GAME_CODE, FIXED_PLAN_VERSION, FIXED_PLAYER_NAMES } from "@/lib/fixed-plan";
import { getGameState } from "@/lib/queries";
import { CODE_KEYS, SEARCH_SPOTS, keyNumbers, searchCode } from "@/lib/generators";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ base?: string }>;

export default async function JudgePrintPage({ searchParams }: { searchParams: SearchParams }) {
  await ensureFixedGame();
  const state = await getGameState(FIXED_GAME_CODE);
  if (!state) throw new Error("No se pudo cargar la partida fija.");

  const params = await searchParams;
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? (forwardedHost.startsWith("localhost") ? "http" : "https");
  const requestedBase = params.base?.trim();
  const base = (requestedBase || `${forwardedProto}://${forwardedHost}`).replace(/\/$/, "");
  const joinUrl = `${base}/join`;
  const qrSvg = await QRCode.toString(joinUrl, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 360,
  });

  const allTasks = state.players.flatMap((player) =>
    player.tasks.map((task) => ({
      ...task,
      playerName: player.name,
      playerSlot: player.slot,
    })),
  );
  const byCard = [...allTasks].sort((a, b) => a.cardNumber - b.cardNumber);
  const judgeTasks = byCard.filter((task) => task.requiresJudge);
  const socialTasks = byCard.filter((task) => task.typeSlug === "interaccion-social");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const routeRows = state.players.map((player) => ({
    ...player,
    tasks: [...player.tasks].sort((a, b) => a.stepIndex - b.stepIndex),
  }));

  return (
    <main className="print-document mx-auto w-full max-w-6xl bg-white px-6 py-8 text-slate-950 sm:px-10 print:max-w-none print:px-2 print:py-2">
      <div className="print:hidden">
        <Link href="/judge" className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          ← Volver al panel de jueces
        </Link>
        <h1 className="mt-4 text-3xl font-black">Imprimir la gymkhana fija</h1>
        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
          <p>
            <strong>Plan {FIXED_PLAN_VERSION}.</strong> 28 jugadores · 15 pruebas cada uno · 420
            tarjetas NFC distintas. No hay sorteo: imprimir este plan y grabar estos enlaces es la
            asignación definitiva.
          </p>
          <p>
            Base de enlaces actual: <code className="font-mono">{base}</code>. Para preparar antes
            del despliegue, cambia <code>?base=https://tu-dominio.com</code> en la URL de esta
            página. <strong>No grabes localhost ni una URL de preview temporal.</strong>
          </p>
          <p>
            <a
              className="font-bold text-fuchsia-700 underline"
              href={`/api/cards-export?n=420&base=${encodeURIComponent(base)}`}
            >
              Descargar CSV de los 420 NFC (número,url)
            </a>
            . Cada etiqueta NFC se escribe como una URL web: <code>{base}/c/33</code>.
          </p>
          <p>
            Las tarjetas se imprimen <strong>sin URL</strong>: solo «TARJETA 01». El enlace vive
            dentro del chip NFC, así que programa cada etiqueta con la lista de arriba y pégala
            detrás de su tarjeta.
          </p>
          <p>
            Para comprobar los recorridos sin NFC, usa{" "}
            <Link className="font-bold text-fuchsia-700 underline" href="/judge/links">
              la lista de enlaces de prueba
            </Link>
            .
          </p>
          <PrintButton />
        </div>
      </div>

      <section className="print-section mt-8 grid min-h-[9in] grid-cols-[1fr_2fr] items-center gap-8 border-b-2 border-slate-200 pb-10 print:min-h-0 print:break-after-page print:border-0">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Gymkhana NFC</p>
          <h2 className="mt-2 text-4xl font-black">Escanea para empezar</h2>
          <p className="mt-4 text-xl">1. Escanea este QR en la mesa.</p>
          <p className="mt-2 text-xl">2. Elige tu nombre.</p>
          <p className="mt-2 text-xl">3. Sigue tu tablero de 15 casillas.</p>
          <p className="mt-8 break-all font-mono text-sm text-slate-600">{joinUrl}</p>
          <p className="mt-2 text-xs text-slate-500">Imprime esta hoja y déjala en la mesa de inicio.</p>
        </div>
        <div
          className="mx-auto w-full max-w-[5in] [&_svg]:h-auto [&_svg]:w-full"
          aria-label={`Código QR que abre ${joinUrl}`}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </section>

      <section className="print-section mt-8 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black print:hidden">
          1 · Las 420 tarjetas para recortar
        </h2>
        <p className="mt-2 text-sm text-slate-600 print:hidden">
          Tamaño carta (6,3 × 8,6 cm), 9 por hoja. Las tarjetas <strong>no llevan ninguna URL
          impresa</strong>: el enlace va dentro del chip NFC. El número es lo único que el jugador
          necesita leer.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 print:mt-0 print:grid-cols-3 print:gap-0">
          {byCard.map((task) => (
            <article key={task.id} className="game-card">
              <div className="game-card__inner">
                <span className="game-card__brand">GYMKHANA</span>
                <span className="game-card__label">TARJETA</span>
                <span className="game-card__number">{String(task.cardNumber).padStart(2, "0")}</span>
                <svg className="game-card__nfc" viewBox="0 0 48 32" aria-hidden="true">
                  <path
                    d="M10 6a22 22 0 0 1 0 20M18 10a14 14 0 0 1 0 12M26 13a7 7 0 0 1 0 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="game-card__foot">Acerca el móvil</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="print-section mt-10 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black">
          2 · Mapa definitivo de tarjetas (solo jueces)
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Esta hoja relaciona número físico, jugador, posición y prueba. No la pongas junto a las
          tarjetas.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
          {routeRows.map((player) => (
            <div key={player.id} className="break-inside-avoid rounded border border-slate-300 p-3">
              <h3 className="text-sm font-black">
                J{String(player.slot).padStart(2, "0")} · {player.name}
              </h3>
              <ol className="mt-1 grid grid-cols-2 gap-x-3 text-[9px] leading-relaxed">
                {player.tasks.map((task) => (
                  <li key={task.id} className="flex justify-between gap-2 border-b border-slate-100">
                    <span className="truncate">
                      {task.stepIndex + 1}. {task.icon} {task.typeName}
                    </span>
                    <span className="shrink-0 font-mono font-bold">#{task.cardNumber}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="print-section mt-10 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black">
          3 · Validaciones de juez (una palabra por tarjeta)
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          En las pruebas fotográficas, revisa que se cumpla el reto y entrega al jugador la palabra
          secreta exacta de su tarjeta. Hay una distinta para cada persona.
        </p>
        <table className="mt-4 w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100 uppercase">
              <th className="px-2 py-2">NFC</th>
              <th className="px-2 py-2">Jugador</th>
              <th className="px-2 py-2">Prueba de foto</th>
              <th className="px-2 py-2">Palabra secreta</th>
            </tr>
          </thead>
          <tbody>
            {judgeTasks.map((task) => (
              <tr key={task.id} className="break-inside-avoid border-b border-slate-200">
                <td className="px-2 py-2 font-mono font-black">#{task.cardNumber}</td>
                <td className="px-2 py-2">
                  J{String(task.playerSlot).padStart(2, "0")} · {task.playerName}
                </td>
                <td className="px-2 py-2">
                  <strong>{task.title}</strong>
                  <span className="block whitespace-pre-line text-slate-600">{task.prompt.split("\n\nEnséñale")[0]}</span>
                </td>
                <td className="px-2 py-2 font-mono text-base font-black uppercase">
                  {task.answer.split("|")[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="print-section mt-10 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black">
          4 · Interacción social (objetivo y respuesta de ficha)
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          La respuesta se comprueba automáticamente si el objetivo rellenó su ficha. Si no, pregunta a esa persona y valida la tarjeta desde el panel.
        </p>
        <table className="mt-4 w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100 uppercase">
              <th className="px-2 py-2">NFC</th>
              <th className="px-2 py-2">Jugador</th>
              <th className="px-2 py-2">Preguntar a</th>
              <th className="px-2 py-2">Dato</th>
              <th className="px-2 py-2">Respuesta de ficha</th>
            </tr>
          </thead>
          <tbody>
            {socialTasks.map((task) => {
              const targetId = task.meta.profile?.targetPlayerId;
              const target = state.players.find((p) => p.id === targetId);
              return (
                <tr key={task.id} className="break-inside-avoid border-b border-slate-200">
                  <td className="px-2 py-2 font-mono font-black">#{task.cardNumber}</td>
                  <td className="px-2 py-2">J{String(task.playerSlot).padStart(2, "0")} · {task.playerName}</td>
                  <td className="px-2 py-2">J{String(target?.slot ?? 0).padStart(2, "0")} · {target?.name ?? "—"}</td>
                  <td className="px-2 py-2">{task.title.replace("Social: ", "")}</td>
                  <td className={`px-2 py-2 font-mono font-bold ${task.answer ? "" : "text-amber-700"}`}>
                    {task.answer || "FICHA VACÍA · validar preguntando"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="print-section mt-10 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black">
          5 · Papel compartido: código escondido
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Imprime una sola copia de la tabla maestra y pégala por dentro de la puerta de la nevera.
          Todos usan ese mismo papel; la secuencia numérica personal de cada uno descifra una palabra diferente.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          {CODE_KEYS.map((key) => {
            const table = keyNumbers(key.id);
            const rows = letters.map((ch) => ({ ch, n: table[ch] })).sort((a, b) => a.n - b.n);
            return (
              <article key={key.id} className="break-inside-avoid rounded-lg border-2 border-slate-900 p-4">
                <h3 className="text-xl font-black">{key.name}</h3>
                <p className="text-xs text-slate-600">Esconder en {key.room}. {key.spot}</p>
                <div className="mt-3 grid grid-cols-6 gap-1 font-mono text-sm">
                  {rows.map(({ ch, n }) => (
                    <div key={ch} className="rounded border border-slate-300 px-1 py-0.5 text-center">
                      <span className="text-slate-500">{n}</span>=<span className="font-black">{ch}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="print-section mt-10 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black">
          6 · Papeles compartidos: búsqueda del objeto
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Imprime una sola hoja por escondite. La ubicación es la misma para todos; cada fila Jxx
          tiene un código personal distinto. Un jugador puede descubrir el escondite, pero no el
          código de las demás filas.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 print:grid-cols-2">
          {SEARCH_SPOTS.map((spot) => (
            <article key={spot.id} className="break-inside-avoid rounded-lg border-2 border-slate-900 p-4">
              <h3 className="text-lg font-black">HOJA «{spot.name}»</h3>
              <p className="text-xs text-slate-600">Esconder {spot.place}.</p>
              <div className="mt-3 grid grid-cols-3 gap-x-4 font-mono text-xs">
                {Array.from({ length: FIXED_PLAYER_NAMES.length }, (_, index) => index + 1).map((slot) => (
                  <div key={slot} className="flex justify-between border-b border-slate-200 py-0.5">
                    <span>J{String(slot).padStart(2, "0")}</span>
                    <strong>{searchCode(spot.id, slot)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="print-section mt-10 print:break-before-page">
        <h2 className="border-b-2 border-slate-950 pb-2 text-2xl font-black">
          7 · Inventario del recorrido fijo
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {FIXED_PLAYER_NAMES.length} jugadores × 15 pruebas = {allTasks.length} tarjetas diferentes.
          Versión: {FIXED_PLAN_VERSION}.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-x-5 text-[10px]">
          {byCard.map((task) => (
            <li key={task.id} className="flex justify-between gap-2 border-b border-slate-100 py-0.5">
              <span className="truncate">#{task.cardNumber} · J{String(task.playerSlot).padStart(2, "0")} {task.playerName} · {task.title}</span>
              <span className="shrink-0 font-mono">{task.stepIndex + 1}/15</span>
            </li>
          ))}
        </ul>
      </section>

      <style>{`
        .game-card {
          break-inside: avoid;
          padding: 2mm;
        }
        .game-card__inner {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 86mm;
          border: 2.5pt solid #0f172a;
          border-radius: 5mm;
          background:
            radial-gradient(70% 55% at 50% 0%, rgba(168, 85, 247, 0.16), transparent 70%),
            radial-gradient(60% 45% at 50% 100%, rgba(34, 211, 238, 0.14), transparent 70%),
            #ffffff;
          box-shadow: inset 0 0 0 1.2mm #ffffff, inset 0 0 0 1.6mm #cbd5f5;
          color: #0f172a;
          text-align: center;
          overflow: hidden;
        }
        .game-card__brand {
          position: absolute;
          top: 6mm;
          font-size: 8pt;
          font-weight: 800;
          letter-spacing: 0.42em;
          text-indent: 0.42em;
          color: #7c3aed;
        }
        .game-card__label {
          font-size: 12pt;
          font-weight: 800;
          letter-spacing: 0.34em;
          text-indent: 0.34em;
          color: #475569;
        }
        .game-card__number {
          font-size: 58pt;
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          margin-top: 1mm;
        }
        .game-card__nfc {
          width: 16mm;
          height: 11mm;
          margin-top: 4mm;
          color: #7c3aed;
        }
        .game-card__foot {
          position: absolute;
          bottom: 6mm;
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #64748b;
        }
        @media print {
          @page { size: A4; margin: 8mm; }
          body { background: white !important; color: #020617 !important; }
          .print-section { margin-top: 0.3in !important; }
          a { color: inherit !important; text-decoration: none !important; }
          .game-card { padding: 1.5mm; }
          .game-card__inner {
            height: 84mm;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}
