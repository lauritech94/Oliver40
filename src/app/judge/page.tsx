"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TaskRow = {
  id: number;
  playerId: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  prompt: string;
  answer: string;
  judgeNote: string;
  requiresJudge: boolean;
  needsSetup: boolean;
  attempts: number;
  peeks: number;
  hintUsed: boolean;
  solvedAt: string | null;
  solvedByJudge: boolean;
  /** Lo que se usará para validar la prueba. */
  effectiveAnswer: string;
  meta: { profile?: { targetPlayerId: number; field: string } };
};

type PlayerRow = {
  id: number;
  name: string;
  emoji: string;
  slot: number;
  profile: Record<string, string>;
  currentStep: number;
  startedAt: string | null;
  finishedAt: string | null;
  tasks: TaskRow[];
};

type GameState = {
  game: { name: string; cardPoolSize: number; planVersion: string };
  players: PlayerRow[];
};

type Tab = "progreso" | "tarjetas" | "respuestas";

export default function JudgeDashboard() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("progreso");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(async () => {
    const res = await fetch("/api/fixed-state", { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo cargar la partida fija.");
      return;
    }
    setState((await res.json()) as GameState);
    setError("");
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  const allTasks = useMemo(() => state?.players.flatMap((p) => p.tasks) ?? [], [state]);
  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return (state?.players ?? []).filter((p) => !q || p.name.toLocaleLowerCase("es").includes(q));
  }, [state, query]);

  async function playAs(player: PlayerRow) {
    setBusyId(player.id);
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id, switchPlayer: true }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo abrir la sesión del jugador.");
      setBusyId(null);
      return;
    }
    router.push("/play");
  }

  async function resetProgress() {
    if (!confirm("¿Reiniciar el progreso de las 28 personas? Las 420 asignaciones y los códigos NFC no cambiarán.")) return;
    try {
      const res = await fetch("/api/judge/reset-progress", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setError(data.error ?? "No se pudo reiniciar el progreso.");
        return;
      }
      setError("");
      setNotice(data.message ?? "Progreso reiniciado.");
      setTimeout(() => setNotice(""), 5000);
      await load();
    } catch {
      setError("No se pudo contactar con el servidor. Comprueba tu conexión.");
    }
  }

  async function validate(taskId: number) {
    const res = await fetch(`/api/tasks/${taskId}/solve`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo validar.");
      return;
    }
    await load();
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-slate-400">
        {error || "Preparando el único juego y sus 420 tarjetas…"}
      </main>
    );
  }

  const solved = allTasks.filter((t) => t.solvedAt).length;
  const manual = allTasks.filter((t) => t.requiresJudge);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            ← Inicio
          </Link>
          <h1 className="mt-2 text-3xl font-black">⚖️ Panel de jueces</h1>
          <p className="mt-1 text-sm text-slate-400">
            {state.game.name} · plan fijo {state.game.planVersion} · 28 jugadores · 420 tarjetas
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sin código ni PIN. El recorrido queda fijo; «Reiniciar progreso» no cambia ninguna
            tarjeta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/judge/print"
            className="rounded-xl bg-fuchsia-500 px-5 py-3 font-bold text-white shadow-lg shadow-fuchsia-500/20"
          >
            🖨️ Imprimir QR, NFC y hoja de jueces
          </Link>
          <Link
            href="/judge/edit"
            className="rounded-xl border border-emerald-500/40 px-5 py-3 font-bold text-emerald-200 hover:bg-emerald-500/10"
          >
            ✏️ Editar preguntas
          </Link>
          <Link
            href="/judge/links"
            className="rounded-xl border border-cyan-500/40 px-5 py-3 font-bold text-cyan-200 hover:bg-cyan-500/10"
          >
            🔗 Enlaces de prueba (420)
          </Link>
          <Link
            href="/ranking"
            className="rounded-xl border border-amber-500/40 px-5 py-3 font-bold text-amber-200 hover:bg-amber-500/10"
          >
            🏆 Ranking en vivo
          </Link>
          <button
            onClick={() => void resetProgress()}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300 hover:border-rose-500/50 hover:text-rose-200"
          >
            ↻ Reiniciar progreso de prueba
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-200">
          {notice}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Pruebas terminadas" value={`${solved} / 420`} />
        <Stat label="NFC propios, sin repetir" value={`${new Set(allTasks.map((t) => t.cardNumber)).size} / 420`} />
        <Stat label="Palabras de juez" value={`${manual.length} / 28`} />
      </div>

      <div className="mt-7 flex gap-2 border-b border-slate-800">
        {(["progreso", "tarjetas", "respuestas"] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-bold capitalize ${
              tab === item
                ? "border-fuchsia-400 text-fuchsia-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {item === "progreso" ? "Probar los caminos" : item}
          </button>
        ))}
      </div>

      {tab === "progreso" && (
        <section className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm text-slate-400">
              Pulsa «Probar como» para abrir la sesión de una persona y recorrer sus 15 casillas.
              El orden es definitivo y no cambia al reiniciar el progreso.
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugador…"
              className="w-56 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm outline-none focus:border-cyan-400"
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {visiblePlayers.map((player) => {
              const done = player.tasks.filter((t) => t.solvedAt).length;
              const current = player.tasks.find((t) => t.stepIndex === player.currentStep && !t.solvedAt);
              const completed = done === 15;
              return (
                <article key={player.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-3xl">{player.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold">
                        <span className="mr-2 font-mono text-xs text-cyan-300">J{String(player.slot).padStart(2, "0")}</span>
                        {player.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {completed ? "🏁 Ha completado el recorrido" : current ? `Siguiente: tarjeta #${current.cardNumber} · ${current.typeName}` : "Preparado"}
                        {` · ${done}/15`}
                      </p>
                    </div>
                    <button
                      onClick={() => void playAs(player)}
                      disabled={busyId !== null}
                      className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
                    >
                      {busyId === player.id ? "Abriendo…" : "🎮 Probar como"}
                    </button>
                  </div>

                  <ol className="mt-3 grid grid-cols-5 gap-1">
                    {[...player.tasks].sort((a, b) => a.stepIndex - b.stepIndex).map((task) => (
                      <li
                        key={task.id}
                        title={`${task.stepIndex + 1}. ${task.typeName} · NFC #${task.cardNumber}`}
                        className={`rounded-md px-1 py-1 text-center font-mono text-[10px] ${
                          task.solvedAt
                            ? "bg-emerald-500/15 text-emerald-300"
                            : task.stepIndex === player.currentStep
                              ? "bg-fuchsia-500/20 text-fuchsia-200"
                              : "bg-slate-950 text-slate-600"
                        }`}
                      >
                        {task.solvedAt ? "✓" : task.stepIndex === player.currentStep ? "▶" : "🔒"}{" "}
                        #{task.cardNumber}
                      </li>
                    ))}
                  </ol>

                  {current && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-950/70 p-2 text-xs">
                      <span>{current.icon}</span>
                      <span className="font-semibold">{current.title}</span>
                      <span className="text-slate-500">respuesta: {current.effectiveAnswer || "⚠ sin respuesta — edítala en ✏️ Editar preguntas"}</span>
                      {(current.requiresJudge || current.needsSetup) && (
                        <button
                          onClick={() => void validate(current.id)}
                          className="ml-auto rounded border border-emerald-500/40 px-2 py-1 font-bold text-emerald-300"
                        >
                          Validar prueba ✓
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === "tarjetas" && (
        <section className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-sm text-slate-400">
              La misma URL NFC es permanente: <code className="text-cyan-300">{origin}/c/NÚMERO</code>.
              Se usa una tarjeta una sola vez y pertenece a un único jugador.
            </p>
            <Link href="/judge/print" className="text-sm font-bold text-fuchsia-300 hover:underline">
              Imprimir las 420 →
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allTasks
              .slice()
              .sort((a, b) => a.cardNumber - b.cardNumber)
              .map((task) => {
                const owner = state.players.find((p) => p.id === task.playerId);
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                    <span className="w-14 shrink-0 font-mono text-xl font-black text-fuchsia-300">#{task.cardNumber}</span>
                    <span className="text-xl">{task.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{owner?.name} · paso {task.stepIndex + 1}</p>
                      <p className="truncate text-xs text-slate-500">{task.typeName} · {task.title}</p>
                    </div>
                    {task.solvedAt && <span className="text-emerald-400">✓</span>}
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {tab === "respuestas" && (
        <section className="mt-5">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100/80">
            Lista para jueces: cada prueba fotográfica tiene una palabra distinta. Comprueba la foto,
            entrega la palabra y el jugador la escribe en su móvil.
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">NFC</th>
                  <th className="px-3 py-2">Jugador</th>
                  <th className="px-3 py-2">Reto</th>
                  <th className="px-3 py-2">Palabra secreta</th>
                </tr>
              </thead>
              <tbody>
                {manual
                  .slice()
                  .sort((a, b) => a.cardNumber - b.cardNumber)
                  .map((task) => {
                    const owner = state.players.find((p) => p.id === task.playerId);
                    return (
                      <tr key={task.id} className="border-t border-slate-800">
                        <td className="px-3 py-2 font-mono font-bold text-fuchsia-300">#{task.cardNumber}</td>
                        <td className="px-3 py-2">{owner?.name}</td>
                        <td className="px-3 py-2">{task.title}</td>
                        <td className="px-3 py-2 font-mono font-black uppercase text-amber-200">
                          {task.answer.split("|")[0]}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-lg font-black">Pruebas sociales</h2>
          <p className="mt-1 text-xs text-slate-500">
            Escribe aquí las preguntas de tu encuesta y sus respuestas. Si una tarjeta se queda sin respuesta, se marca para que la escribas en ✏️ Editar preguntas.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">NFC</th>
                  <th className="px-3 py-2">Jugador</th>
                  <th className="px-3 py-2">Pregunta</th>
                  <th className="px-3 py-2">Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {allTasks
                  .filter((task) => task.typeSlug === "interaccion-social")
                  .sort((a, b) => a.cardNumber - b.cardNumber)
                  .map((task) => {
                    const owner = state.players.find((p) => p.id === task.playerId);
                    return (
                      <tr key={task.id} className="border-t border-slate-800">
                        <td className="px-3 py-2 font-mono font-bold text-fuchsia-300">#{task.cardNumber}</td>
                        <td className="px-3 py-2">{owner?.name}</td>
                        <td className="px-3 py-2">{task.title.replace("Social: ", "")}</td>
                        <td className={`px-3 py-2 font-mono text-xs ${task.effectiveAnswer ? "text-cyan-200" : "text-amber-300"}`}>
                          {task.effectiveAnswer || "⚠ Falta escribirla en ✏️ Editar preguntas"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
