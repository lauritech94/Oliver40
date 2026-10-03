"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type RankingRow = {
  slot: number;
  name: string;
  emoji: string;
  solved: number;
  finishedAt: string | null;
  mainTimeMs: number | null;
  reaccion: number | null;
  numeros: number | null;
  attempts: number;
};

type RankingResponse = {
  game: string;
  planVersion: string;
  players: RankingRow[];
};

function fmtTime(ms: number | null): string {
  if (ms == null) return "—";
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)} s`;
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  return `${ms} ms`;
}

export default function RankingPage() {
  const [data, setData] = useState<RankingResponse | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/minigames/ranking", { cache: "no-store" });
    if (!res.ok) return;
    setData((await res.json()) as RankingResponse);
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  /** Los que han jugado los dos minijuegos entran en la clasificación de la Gran Final. */
  const finalists = useMemo(() => {
    if (!data) return [];
    return data.players
      .filter((p) => p.reaccion != null && p.numeros != null)
      .map((p) => ({ ...p, total: (p.reaccion ?? 0) + (p.numeros ?? 0) }))
      .sort((a, b) => a.total - b.total);
  }, [data]);

  const fastestReaction = useMemo(() => {
    if (!data) return null;
    const withScore = data.players.filter((p) => p.reaccion != null);
    return withScore.sort((a, b) => (a.reaccion ?? 0) - (b.reaccion ?? 0))[0] ?? null;
  }, [data]);

  const fastestGrid = useMemo(() => {
    if (!data) return null;
    const withScore = data.players.filter((p) => p.numeros != null);
    return withScore.sort((a, b) => (a.numeros ?? 0) - (b.numeros ?? 0))[0] ?? null;
  }, [data]);

  const podium = finalists.slice(0, 3);
  const rest = finalists.slice(3);

  const visible = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase("es");
    return (data?.players ?? []).filter((p) => !q || p.name.toLocaleLowerCase("es").includes(q));
  }, [data, filter]);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/minigames" className="text-sm text-slate-500 hover:text-slate-300">
            ← Fase final
          </Link>
          <h1 className="mt-2 text-4xl font-black">🏆 Clasificación</h1>
          <p className="mt-1 text-sm text-slate-400">
            Se actualiza sola cada pocos segundos. Ideal para proyectar en una tele.
          </p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="🔎 Buscar jugador…"
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
        />
      </div>

      {!data && <p className="mt-10 text-center text-slate-500">Cargando marcas…</p>}

      {data && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-bold uppercase tracking-widest text-amber-300">
              🎖️ Podio de la Gran Final (suma de los dos minijuegos)
            </h2>
            {podium.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500">
                <p className="text-3xl">⏳</p>
                <p className="mt-2">Todavía nadie ha jugado los dos minijuegos.</p>
                <Link
                  href="/minigames"
                  className="mt-4 inline-block rounded-xl bg-fuchsia-500 px-5 py-2.5 font-bold text-white"
                >
                  Ir a la fase final
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {podium.map((p, i) => {
                  const medal = ["🥇", "🥈", "🥉"][i];
                  const highlight = [
                    "border-amber-400 bg-amber-500/15",
                    "border-slate-400 bg-slate-500/15",
                    "border-orange-600 bg-orange-700/15",
                  ][i];
                  const size = ["text-6xl", "text-5xl", "text-5xl"][i];
                  return (
                    <div
                      key={p.slot}
                      className={`rounded-3xl border-2 ${highlight} p-5 text-center`}
                    >
                      <p className={size}>{medal}</p>
                      <p className="mt-2 text-2xl">{p.emoji}</p>
                      <p className="mt-1 truncate text-lg font-black">{p.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        J{String(p.slot).padStart(2, "0")}
                      </p>
                      <p className="mt-3 font-mono text-3xl font-black tabular-nums text-white">
                        {fmtTime(p.total)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        ⚡ {fmtMs(p.reaccion)} · 🔢 {fmtTime(p.numeros)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                ⚡ Reflejo más rápido
              </p>
              {fastestReaction ? (
                <>
                  <p className="mt-2 text-xl font-black">
                    {fastestReaction.emoji} {fastestReaction.name}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-black text-amber-200">
                    {fmtMs(fastestReaction.reaccion)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-slate-500">Sin marcas todavía</p>
              )}
            </div>
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                🔢 Más rápido en la caza de números
              </p>
              {fastestGrid ? (
                <>
                  <p className="mt-2 text-xl font-black">
                    {fastestGrid.emoji} {fastestGrid.name}
                  </p>
                  <p className="mt-1 font-mono text-3xl font-black text-cyan-200">
                    {fmtTime(fastestGrid.numeros)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-slate-500">Sin marcas todavía</p>
              )}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-300">
              Tabla general
            </h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Pos</th>
                    <th className="px-3 py-2">Jugador</th>
                    <th className="px-3 py-2">15 pruebas</th>
                    <th className="px-3 py-2">⚡ Reflejos</th>
                    <th className="px-3 py-2">🔢 Números</th>
                    <th className="px-3 py-2">Total final</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => {
                    const pos = finalists.findIndex((f) => f.slot === p.slot);
                    return (
                      <tr key={p.slot} className="border-t border-slate-800">
                        <td className="px-3 py-2 font-mono text-slate-500">
                          {pos >= 0 ? `#${pos + 1}` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className="mr-2">{p.emoji}</span>
                          <span className="font-semibold">{p.name}</span>
                          <span className="ml-2 font-mono text-xs text-slate-600">
                            J{String(p.slot).padStart(2, "0")}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {p.finishedAt ? (
                            <span className="text-emerald-300">✓ {fmtTime(p.mainTimeMs)}</span>
                          ) : (
                            <span className="text-slate-500">{p.solved}/15</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-amber-200">
                          {fmtMs(p.reaccion)}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-cyan-200">
                          {fmtTime(p.numeros)}
                        </td>
                        <td className="px-3 py-2 font-mono font-black tabular-nums">
                          {p.reaccion != null && p.numeros != null
                            ? fmtTime((p.reaccion ?? 0) + (p.numeros ?? 0))
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {rest.length > 0 && (
            <p className="mt-4 text-center text-xs text-slate-600">
              Hay {finalists.length} jugadores con las dos marcas. Muestra {podium.length} en el
              podio.
            </p>
          )}
        </>
      )}

      <footer className="mt-12 text-center">
        <Link
          href="/minigames"
          className="inline-block rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:border-amber-400 hover:text-amber-200"
        >
          Jugar la fase final
        </Link>
      </footer>
    </main>
  );
}
