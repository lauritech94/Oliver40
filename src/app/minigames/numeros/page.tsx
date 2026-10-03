"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_ATTEMPTS = 3;

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
  const [attempts, setAttempts] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [savedInfo, setSavedInfo] = useState<{ isNewBest: boolean; bestScore: number } | null>(null);
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

  const best = attempts.length > 0 ? Math.min(...attempts) : null;
  const finished = attempts.length >= MAX_ATTEMPTS;

  const save = useCallback(async (value: number) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/minigames/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "numeros", score: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar la marca");
      setSavedInfo({ isNewBest: data.isNewBest, bestScore: data.bestScore });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }, []);

  const start = useCallback(() => {
    if (finished) return;
    setGrid(shuffledGrid());
    setNextExpected(1);
    setLastMs(null);
    setSavedInfo(null);
    setError("");
    setWrongFlash(null);
    setPhase("playing");
    startedAt.current = performance.now();
    setElapsed(0);
    raf.current = requestAnimationFrame(tick);
  }, [finished, tick]);

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
        setLastMs(ms);
        setPhase("done");
        setAttempts((prev) => {
          const list = [...prev, ms];
          void save(ms);
          return list;
        });
      }
    },
    [phase, nextExpected, save],
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link href="/minigames" className="text-sm text-slate-500 hover:text-slate-300">
          ← Fase final
        </Link>
        <span className="font-mono text-xs text-slate-600">
          Intento {Math.min(attempts.length + 1, MAX_ATTEMPTS)} / {MAX_ATTEMPTS}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">🔢 Minijuego 2</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Caza de Números</h1>
        <p className="mt-2 text-sm text-slate-400">
          Toca los números del <span className="font-bold text-cyan-300">1 al 16</span> en orden,
          sin parar. Tienes <strong>3 intentos</strong> y el tiempo se guarda solo.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Cronómetro</p>
            <p className="font-mono text-4xl font-black tabular-nums text-cyan-300">
              {phase === "done" && lastMs != null
                ? (lastMs / 1000).toFixed(2)
                : phase === "playing"
                  ? (elapsed / 1000).toFixed(2)
                  : "0.00"}
              <span className="ml-1 text-lg text-slate-500">s</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Progreso</p>
            <p className="font-mono text-3xl font-black tabular-nums">
              {Math.min(nextExpected - 1, 16)}
              <span className="text-slate-500">/16</span>
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
                      ? "scale-95 border-rose-500 bg-rose-500 text-white"
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

      <div className="mt-5 grid grid-cols-3 gap-2">
        {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
          <div
            key={i}
            className={`rounded-xl border p-3 text-center ${
              attempts[i] != null
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Intento {i + 1}</p>
            <p className="mt-1 font-mono text-lg font-black tabular-nums">
              {attempts[i] != null ? `${(attempts[i] / 1000).toFixed(2)} s` : "—"}
            </p>
          </div>
        ))}
      </div>

      {phase === "done" && lastMs != null && (
        <div className="mt-5 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-5 text-center">
          <p className="text-3xl">🏁</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            Este intento
          </p>
          <p className="mt-1 font-mono text-5xl font-black tabular-nums text-white">
            {(lastMs / 1000).toFixed(2)}
            <span className="text-2xl text-slate-400"> s</span>
          </p>
          {saving && <p className="mt-2 text-sm text-slate-300">Guardando marca…</p>}
          {!saving && savedInfo && (
            <p className="mt-2 text-sm font-bold text-emerald-300">
              {savedInfo.isNewBest
                ? "🏆 ¡Nueva marca personal! Guardada automáticamente."
                : `Guardado. Tu mejor marca: ${(savedInfo.bestScore / 1000).toFixed(2)} s`}
            </p>
          )}
        </div>
      )}

      {best !== null && (
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">
            Tu mejor marca
          </p>
          <p className="mt-1 font-mono text-4xl font-black tabular-nums text-amber-200">
            {(best / 1000).toFixed(2)} s
          </p>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {phase === "done" && !finished && (
          <button
            onClick={start}
            className="rounded-xl bg-fuchsia-500 px-7 py-4 text-lg font-black text-white"
          >
            Intento {attempts.length + 1} de {MAX_ATTEMPTS} →
          </button>
        )}
        {finished && (
          <Link
            href="/ranking"
            className="rounded-xl bg-emerald-500 px-7 py-4 text-lg font-black text-slate-950"
          >
            🏆 Ver clasificación
          </Link>
        )}
      </div>
    </main>
  );
}
