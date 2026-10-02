import Link from "next/link";
import { CHALLENGE_TYPES } from "@/lib/catalog";
import { FIXED_PLAN, FIXED_PLAN_VERSION } from "@/lib/fixed-plan";

export const dynamic = "force-static";

const FLOW = [
  {
    icon: "📱",
    title: "QR en la mesa",
    text: "Todos escanean el mismo QR, que abre la lista de los 28 nombres. Cada persona elige el suyo; no hay código de partida ni PIN.",
  },
  {
    icon: "🔒",
    title: "Tablero de 15 casillas",
    text: "Cada jugador ve sus 15 recuadros. El primero indica qué número NFC tiene que escanear; las otras pruebas empiezan cerradas.",
  },
  {
    icon: "🧭",
    title: "Un recorrido definitivo",
    text: "El orden y las 420 asignaciones están fijados en el plan oficial. Ninguna tarjeta pertenece a dos jugadores; ni siquiera se vuelven a sortear al reiniciar.",
  },
  {
    icon: "✅",
    title: "Acierto → siguiente tarjeta",
    text: "Al superar una prueba, se desbloquea la siguiente casilla y aparece su número. Las fotos y retos manuales usan una palabra secreta de juez.",
  },
];

export default function HomePage() {
  const auto = CHALLENGE_TYPES.filter((type) => !type.requiresJudge).length;
  const judge = CHALLENGE_TYPES.length - auto;
  const examples = CHALLENGE_TYPES.map((type) => FIXED_PLAN.find((task) => task.typeSlug === type.slug));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-16">
      <header className="flex flex-col gap-6">
        <span className="w-fit rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
          Gymkhana NFC · plan {FIXED_PLAN_VERSION}
        </span>
        <h1 className="text-4xl font-black leading-tight sm:text-6xl">
          28 jugadores. <span className="text-fuchsia-400">420 tarjetas únicas.</span>
        </h1>
        <p className="max-w-3xl text-lg text-slate-300">
          Una sola partida con recorridos ya definidos. Escanea el QR de la mesa, elige tu nombre,
          completa las 15 pruebas y busca el número de tarjeta que se desbloquea cada vez.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/join"
            className="rounded-xl bg-fuchsia-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-fuchsia-500/30 transition hover:bg-fuchsia-400"
          >
            🎮 Elegir mi nombre
          </Link>
          <Link
            href="/judge"
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3 text-base font-bold text-slate-100 transition hover:border-cyan-400/60 hover:text-cyan-200"
          >
            ⚖️ Panel de jueces
          </Link>
          <Link
            href="/play"
            className="rounded-xl border border-slate-800 px-6 py-3 text-base font-semibold text-slate-400 transition hover:text-slate-100"
          >
            Mi tablero →
          </Link>
        </div>
      </header>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-3xl">{item.icon}</div>
            <h3 className="mt-3 text-base font-bold text-slate-100">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <div>
          <h2 className="text-2xl font-black sm:text-3xl">Los 15 tipos de prueba</h2>
          <p className="mt-2 text-slate-400">
            {auto} se validan en la app · {judge} con palabra secreta del juez · 28 variantes
            asignadas en el plan fijo
          </p>
        </div>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CHALLENGE_TYPES.map((type, index) => (
            <li key={type.slug} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{type.icon}</span>
                  <div>
                    <p className="text-xs font-mono text-slate-500">Tipo {String(index + 1).padStart(2, "0")}</p>
                    <h3 className="text-lg font-bold">{type.name}</h3>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${type.requiresJudge ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                  {type.requiresJudge ? "Palabra de juez" : "Auto"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">{type.summary}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2 text-[11px] text-slate-500">
                <span className="rounded-md bg-slate-800/80 px-2 py-1">🎒 {type.material}</span>
                <span className="rounded-md bg-slate-800/80 px-2 py-1">📚 {type.pool}</span>
              </div>
              <details className="text-xs text-slate-400">
                <summary className="cursor-pointer select-none text-slate-500 hover:text-fuchsia-300">Ver ejemplo del plan</summary>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-950/70 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                  {examples[index]?.prompt ?? "Esta prueba se genera en el móvil."}
                </p>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Preparación fija</h2>
          <Link href="/judge/print" className="font-bold text-fuchsia-300 hover:underline">Abrir paquete de impresión →</Link>
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <li>🃏 Imprimir y programar 420 etiquetas NFC numeradas del 1 al 420.</li>
          <li>📲 Dejar el QR de jugador en la mesa de salida.</li>
          <li>🗝️ Esconder una sola hoja con el código maestro por dentro de la puerta de la nevera.</li>
          <li>🏷️ Esconder las hojas compartidas con códigos únicos por jugador.</li>
          <li>📋 Guardar la hoja de palabras secretas con los jueces.</li>
          <li>🌐 Desplegar la web en un dominio estable antes de grabar los NFC.</li>
        </ul>
      </section>

      <footer className="mt-12 pb-6 text-center text-xs text-slate-600">
        Una sola partida · un plan fijo · 420 enlaces NFC permanentes
      </footer>
    </main>
  );
}
