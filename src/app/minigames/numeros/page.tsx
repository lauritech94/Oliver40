"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function shuffledGrid(): number[] {
  const nums = Array.from({ length: 16 }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

export default function NumberGridPage() {
  const [grid, setGrid] = useState<number[]>(() => shuffledGrid());
  const [nextExpected, setNextExpected] = useState(1);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [saved, setSaved] = useState<null | { isNewBest: boolean; bestScore: number }>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startedAt = useRef<number>(0);
  const raf = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (startedAt.current) {
      setElapsed(performance.now() - startedAt.current);
      raf.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const start = useCallback(() => {
    setGrid(shuffledGrid());
    setNextExpected(1);
    setFinalMs(null);
    setSaved(null);
    setError("");
    setWrongFlash(null);
    setPhase("playing");
    startedAt.current = performance.now();
    setElapsed(0);
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const tap = useCallback(
    (value: number) => {
      if (phase !== "playing") return;
      if (value !== nextExpected) {
        setWrongFlash(value);
        setTimeout(() => setWrongFlash(null), 180);
        return;
      }
      const next = nextExpected + 1;
      setNextExpected(next);
      if (next === 17) {
        const ms = Math.round(performance.now() - startedAt.current);
        if (raf.current) cancelAnimationFrame(raf.current);
        startedAt.current = 0;
        setFinalMs(ms);
        setPhase("done");
      }
    },
    [phase, nextExpected],
  );

  const finish = useCallback(async () => {
    if (finalMs === null) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/minigames/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "numeros", score: finalMs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar la marca");
      setSaved({ isNewBest: data.isNewBest, bestScore: data.bestScore });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, [finalMs]);

  const secs = (elapsed / 1000).toFixed(2);
  const best = saved?.bestScore != null ? (saved.bestScore / 1000).toFixed(2) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link href="/minigames" className="text-sm text-slate-500 hover:text-slate-300">
          ← Fase final
        </Link>
        <span className="font-mono text-xs text-slate-600">
          {nextExpected > 1 && nextExpected <= 16 ? `Busca el ${nextExpected}` : ""}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
          🔢 Minijuego 2
        </p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Caza de Números</h1>
        <p className="mt-2 text-sm text-slate-400">
          Toca los números del <span className="text-cyan-300 font-bold">1 al 16</span> en orden,
          sin parar. El cronómetro arranca con el primero.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Cronómetro</p>
            <p className="font-mono text-4xl font-black tabular-nums text-cyan-300">
              {phase === "done" && finalMs != null
                ? (finalMs / 1000).toFixed(2)
                : phase === "playing"
                  ? secs
                  : "0.00"}
              <span className="ml-1 text-lg text-slate-500">s</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Progreso</p>
            <p className="font-mono text-3xl font-black tabular-nums">
              {Math.min(nextExpected - 1, 16)}<span className="text-slate-500">/16</span>
            </p>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all"
            style={{ width: `${(Math.min(nextExpected - 1, 16) / 16) * 100}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {grid.map((value) => {
            const done = value < nextExpected;
            const isWrong = wrongFlash === value;
            return (
              <button
                key={value}
                onClick={() => tap(value)}
                disabled={done || phase !== "playing"}
                className={`aspect-square rounded-xl border text-2xl font-black tabular-nums transition-all ${
                  done
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500/50"
                    : isWrong
                      ? "border-rose-500 bg-rose-500 text-white scale-95"
                      : "border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-400 hover:bg-cyan-500/10 active:scale-95"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        {phase === "idle" && (
          <button
            onClick={start}
            className="mt-4 w-full rounded-xl bg-cyan-500 px-6 py-4 text-lg font-black text-slate-950"
          >
            ▶ Empezar cronómetro
          </button>
        )}
      </div>

      {phase === "done" && finalMs != null && (
        <div className="mt-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-5 text-center">
          <p className="text-3xl">🏁</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Tu tiempo
          </p>
          <p className="mt-1 font-mono text-6xl font-black tabular-nums text-white">
            {(finalMs / 1000).toFixed(2)}
            <span className="text-2xl text-slate-400"> s</span>
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {finalMs < 8000
              ? "¡Eso es velocidad pura!"
              : finalMs < 15000
                ? "¡Buen tiempo!"
                : "¡Ánimo, puedes bajarlo!"}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {phase === "done" && !saved && (
          <button
            onClick={() => void finish()}
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-7 py-4 text-lg font-black text-slate-950 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "🏁 Registrar mi tiempo"}
          </button>
        )}
        {phase !== "playing" && (
          <button
            onClick={start}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:border-slate-500"
          >
            Jugar de nuevo
          </button>
        )}
      </div>

      {saved && (
        <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
          <p className="text-3xl">{saved.isNewBest ? "🏆" : "✅"}</p>
          <p className="mt-2 font-bold text-emerald-200">
            {saved.isNewBest
              ? `¡Nueva marca personal! ${((saved.bestScore ?? 0) / 1000).toFixed(2)} s`
              : `Registrado. Tu mejor marca sigue siendo ${((saved.bestScore ?? 0) / 1000).toFixed(2)} s`}
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
