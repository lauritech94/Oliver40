"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

type RouteStep = { step: number; card: number; type: string };
type PlayerReport = {
  slot: number;
  name: string;
  solvedNow: number;
  problems: string[];
  route: RouteStep[];
};

type Report = {
  players: PlayerReport[];
  problems: string[];
  done: boolean;
  totalSteps: number;
};

export default function JudgeAutotestPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const solvedNow = useMemo(
    () => report?.players.reduce((n, p) => n + p.solvedNow, 0) ?? 0,
    [report],
  );
  const problemSteps = useMemo(
    () => report?.players.reduce((n, p) => n + p.problems.length, 0) ?? 0,
    [report],
  );

  const run = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    setReport(null);
    setStartedAt(Date.now());
    try {
      const res = await fetch("/api/judge/autotest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStep: 0 }),
      });
      const data = (await res.json()) as Report & { error?: string };
      setElapsed(Date.now() - (startedAt ?? Date.now()));
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo simular.");
    } finally {
      setBusy(false);
    }
  }, [busy, startedAt]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/judge" className="text-sm text-slate-500 hover:text-slate-300">
        ← Panel de jueces
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">🤖 Simulación completa del juego</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            Pulsa una vez y la app <strong>responde las 420 tarjetas</strong>, jugador por jugador
            y paso a paso, absolutamente en orden. Comprueba que ningún número está compartido y
            que las respuestas coinciden.{" "}
            <strong className="text-cyan-300">
              Tu progreso y el de los jugadores no cambian: solo es un ensayo.
            </strong>
          </p>
        </div>
        <button
          onClick={() => void run()}
          disabled={busy}
          className="rounded-xl bg-emerald-600 px-7 py-4 font-black text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60 sm:min-w-56"
        >
          {busy ? "Simulando…" : "▶ Simular todas las tarjetas"}
        </button>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          ⚠️ {error}
        </p>
      )}

      {busy && (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-slate-900/50 p-8 text-center">
          <span className="mx-auto mb-4 block h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400" />
          <p className="font-bold text-slate-200">Contestando las 420 pruebas en orden…</p>
          <p className="mt-2 text-sm text-slate-500">
            Suelo tardar entre 3 y 10 segundos. No cierres esta pestaña.
          </p>
        </div>
      )}

      {report && !busy && (
        <section className="mt-8 space-y-5">
          <div
            className={`rounded-2xl border p-5 text-center ${
              report.problems.length || problemSteps
                ? "border-amber-500/40 bg-amber-500/5 text-amber-100"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
            }`}
            role="status"
          >
            <p className="text-4xl">{report.problems.length || problemSteps ? "⚠️" : "🎉"}</p>
            <p className="mt-2 text-2xl font-black">
              {report.problems.length || problemSteps
                ? `${solvedNow} tarjetas verificadas · ${report.problems.length + problemSteps} avisos`
                : `¡420/420 tarjetas resueltas y comprobadas!`}
            </p>
            <p className="mt-1 text-sm opacity-80">
              {elapsed > 0 ? `${(elapsed / 1000).toFixed(1)} s` : ""} · Plan: {report.totalSteps}
            </p>
          </div>

          {(report.problems.length > 0 || problemSteps > 0) && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h2 className="font-black text-amber-200">Avisos que revisar</h2>
              <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto text-sm text-amber-100/90">
                {report.problems.map((p) => (
                  <li key={p} className="leading-relaxed">· {p}</li>
                ))}
                {report.players.flatMap((p) =>
                  p.problems.map((prob) => (
                    <li key={`${p.name}:${prob}`} className="leading-relaxed">· {prob}</li>
                  )),
                )}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-amber-200/70">
                Los textos en marca roja tienen una respuesta vacía o un salto de pasos. Después de
                editarlas en «✏️ Editar preguntas», vuelve a simular.
              </p>
            </div>
          )}

          {report.problems.length === 0 && problemSteps === 0 && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-sm leading-relaxed text-cyan-100/80">
              <strong>Qué confirma este 100 %:</strong> las 420 tarjetas son únicas, el número de
              cada jugador es distinto al de los demás, el orden tiene 15 pasos sin huecos y todas
              las respuestas coinciden con tu chuleta. Ya puedes imprimir y grabar tranquilamente.
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-black text-slate-200">
              Desglose por jugador ({report.players.length} personas · 15 tarjetas cada uno)
            </h2>
            <ol className="grid gap-2">
              {report.players.map((player) => {
                const finished = player.solvedNow === 15;
                const route = player.route.map((s) => `#${s.card}`).join("→");
                return (
                  <li
                    key={player.slot}
                    className={`rounded-xl border p-3 sm:p-4 ${
                      player.problems.length
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-slate-800 bg-slate-900/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">
                        <span className="mr-2 font-mono text-xs text-cyan-300">
                          J{String(player.slot).padStart(2, "0")}
                        </span>
                        {player.name}
                      </p>
                      <p className={`font-mono text-sm font-black ${finished ? "text-emerald-300" : "text-amber-300"}`}>
                        {player.solvedNow}/15 {finished ? "✓" : "…"}
                      </p>
                    </div>
                    <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-slate-500">
                      {route}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
            <p className="text-xs leading-relaxed text-slate-500">
              Otra forma habitual de probarlos sin botones: abre directamente los enlaces que ya
              conoces en{" "}
              <Link href="/judge/links" className="font-semibold text-cyan-300 hover:underline">
                /judge/links
              </Link>
              . Los números no cambian entre métodos.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
