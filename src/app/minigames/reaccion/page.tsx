"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "go" | "tooSoon" | "result";

const TOTAL_ROUNDS = 3;

export default function ReactionPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rounds, setRounds] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [saved, setSaved] = useState<null | { isNewBest: boolean; bestScore: number }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const best = rounds.length > 0 ? Math.min(...rounds) : null;
  const finished = rounds.length >= TOTAL_ROUNDS;

  const startRound = useCallback(() => {
    clear();
    setSaved(null);
    setPhase("waiting");
    const delay = 1500 + Math.random() * 2500;
    timer.current = setTimeout(() => {
      startedAt.current = performance.now();
      setPhase("go");
    }, delay);
  }, [clear]);

  const handleTap = useCallback(() => {
    if (phase === "waiting") {
      clear();
      setPhase("tooSoon");
      return;
    }
    if (phase === "go") {
      const ms = Math.round(performance.now() - startedAt.current);
      setLastMs(ms);
      setRounds((r) => [...r, ms]);
      setPhase("result");
    }
  }, [phase, clear]);

  const finish = useCallback(async () => {
    if (best === null) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/minigames/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "reaccion", score: best }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar la marca");
      setSaved({ isNewBest: data.isNewBest, bestScore: data.bestScore });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [best]);

  const restart = () => {
    clear();
    setRounds([]);
    setLastMs(null);
    setSaved(null);
    setError("");
    setPhase("idle");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link href="/minigames" className="text-sm text-slate-500 hover:text-slate-300">
          ← Fase final
        </Link>
        <span className="font-mono text-xs text-slate-600">
          Ronda {Math.min(rounds.length + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
          ⚡ Minijuego 1
        </p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Reflejos de Relámpago</h1>
        <p className="mt-2 text-sm text-slate-400">
          Espera a que la pantalla se ponga <span className="text-emerald-400">verde</span> y pulsa
          lo antes posible. Si te adelantas, falta.
        </p>
      </div>

      <div
        onPointerDown={(e) => {
          e.preventDefault();
          handleTap();
        }}
        role="button"
        tabIndex={0}
        aria-label="Zona de reacción"
        className={`mt-6 flex min-h-[42vh] w-full select-none cursor-pointer flex-col items-center justify-center rounded-3xl border-4 text-center transition-colors duration-100 ${
          phase === "go"
            ? "border-emerald-300 bg-emerald-500 text-slate-950"
            : phase === "waiting"
              ? "border-rose-400 bg-rose-500/80 text-white"
              : phase === "tooSoon"
                ? "border-amber-400 bg-amber-500 text-slate-950"
                : phase === "result"
                  ? "border-cyan-400 bg-cyan-500/20 text-white"
                  : "border-slate-700 bg-slate-900 text-slate-300"
        }`}
      >
        {phase === "idle" && (
          <>
            <p className="text-6xl">⚡</p>
            <p className="mt-4 text-2xl font-black">Pulsa aquí para empezar</p>
            <p className="mt-2 text-sm opacity-70">3 rondas · tu mejor tiempo se guarda</p>
          </>
        )}
        {phase === "waiting" && (
          <>
            <p className="text-6xl">🛑</p>
            <p className="mt-4 text-3xl font-black">¡Atento…</p>
            <p className="mt-2 text-lg opacity-80">No pulses todavía</p>
          </>
        )}
        {phase === "go" && (
          <>
            <p className="text-7xl">🟢</p>
            <p className="mt-4 text-5xl font-black tracking-tight">¡¡PULSA YA!!</p>
          </>
        )}
        {phase === "tooSoon" && (
          <>
            <p className="text-6xl">😅</p>
            <p className="mt-4 text-3xl font-black">¡Falta!</p>
            <p className="mt-2 text-lg opacity-80">Te has precipitado. Esa ronda no cuenta.</p>
          </>
        )}
        {phase === "result" && (
          <>
            <p className="text-6xl">⏱️</p>
            <p className="mt-3 font-mono text-6xl font-black tabular-nums">{lastMs} ms</p>
            <p className="mt-2 text-lg opacity-80">
              {lastMs! < 200
                ? "¡Reflejos de felino!"
                : lastMs! < 300
                  ? "¡Muy buenos reflejos!"
                  : "Bien, pero puedes mejorarlo"}
            </p>
          </>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 text-center ${
              rounds[i] != null
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Ronda {i + 1}</p>
            <p className="mt-1 font-mono text-lg font-black tabular-nums">
              {rounds[i] != null ? `${rounds[i]} ms` : "—"}
            </p>
          </div>
        ))}
      </div>

      {best !== null && (
        <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
            Tu mejor marca
          </p>
          <p className="mt-1 font-mono text-6xl font-black tabular-nums text-amber-200">{best} ms</p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {phase === "result" && !finished && (
          <button
            onClick={startRound}
            className="rounded-xl bg-fuchsia-500 px-7 py-4 text-lg font-black text-white"
          >
            Siguiente ronda →
          </button>
        )}
        {phase === "result" && finished && !saved && (
          <button
            onClick={() => void finish()}
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-7 py-4 text-lg font-black text-slate-950 disabled:opacity-50"
          >
            {saving ? "Guardando…" : `🏁 Registrar ${best} ms`}
          </button>
        )}
        {phase === "tooSoon" && (
          <button
            onClick={startRound}
            className="rounded-xl bg-fuchsia-500 px-7 py-4 text-lg font-black text-white"
          >
            Reintentar ronda
          </button>
        )}
        {(phase === "idle" || finished) && (
          <button
            onClick={restart}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:border-slate-500"
          >
            Volver a empezar
          </button>
        )}
      </div>

      {saved && (
        <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
          <p className="text-3xl">{saved.isNewBest ? "🏆" : "✅"}</p>
          <p className="mt-2 font-bold text-emerald-200">
            {saved.isNewBest
              ? `¡Nueva marca personal! ${saved.bestScore} ms`
              : `Registrado. Tu mejor marca sigue siendo ${saved.bestScore} ms`}
          </p>
          <Link
            href="/ranking"
            className="mt-4 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-black text-slate-950"
          >
            Ver clasificación →
          </Link>
        </div>
      )}
    </main>
  );
}
