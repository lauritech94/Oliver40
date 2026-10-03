"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "waiting" | "go" | "tooSoon" | "result";

const MAX_ATTEMPTS = 3;

export default function ReactionPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [attempts, setAttempts] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [savedInfo, setSavedInfo] = useState<{ isNewBest: boolean; bestScore: number } | null>(null);
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

  const best = attempts.length > 0 ? Math.min(...attempts) : null;
  const finished = attempts.length >= MAX_ATTEMPTS;

  const startRound = useCallback(() => {
    clear();
    setSavedInfo(null);
    setError("");
    setLastMs(null);
    setPhase("waiting");
    const delay = 1400 + Math.random() * 2600;
    timer.current = setTimeout(() => {
      startedAt.current = performance.now();
      setPhase("go");
    }, delay);
  }, [clear]);

  /** Guarda la marca en el servidor (siempre conserva la mejor). */
  const save = useCallback(async (value: number) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/minigames/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "reaccion", score: value }),
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

  const handleTap = useCallback(() => {
    if (phase === "idle") {
      // ¡Este es el bug! Antes no se arrancaba al pulsar.
      startRound();
      return;
    }
    if (phase === "waiting") {
      clear();
      setPhase("tooSoon");
      return;
    }
    if (phase === "go") {
      const ms = Math.round(performance.now() - startedAt.current);
      setLastMs(ms);
      setAttempts((prev) => {
        const next = [...prev, ms];
        void save(ms);
        return next;
      });
      setPhase("result");
    }
  }, [phase, clear, startRound, save]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-8">
      <div className="flex items-center justify-between">
        <Link href="/minigames" className="text-sm text-slate-500 hover:text-slate-300">
          ← Fase final
        </Link>
        <span className="font-mono text-xs text-slate-600">
          Intento {Math.min(attempts.length + 1, MAX_ATTEMPTS)} / {MAX_ATTEMPTS}
        </span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">
          ⚡ Minijuego 1
        </p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Reflejos de Relámpago</h1>
        <p className="mt-2 text-sm text-slate-400">
          Espera a que la pantalla se ponga <span className="text-emerald-400">verde</span> y pulsa
          lo antes posible. Tienes <strong>3 intentos</strong>. Si te adelantas, falta.
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
            <p className="mt-2 text-sm opacity-70">
              3 intentos · tu mejor tiempo se guarda solo
            </p>
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
            <p className="mt-2 text-lg opacity-80">Te has precipitado. Ese intento no cuenta.</p>
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
            {saving && <p className="mt-2 text-sm opacity-70">Guardando marca…</p>}
            {!saving && savedInfo && (
              <p className="mt-2 text-sm font-bold text-emerald-200">
                {savedInfo.isNewBest
                  ? "🏆 ¡Nueva marca personal! Guardada automáticamente."
                  : `Guardado. Tu mejor marca: ${savedInfo.bestScore} ms`}
              </p>
            )}
          </>
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
              {attempts[i] != null ? `${attempts[i]} ms` : "—"}
            </p>
          </div>
        ))}
      </div>

      {best !== null && (
        <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
            Tu mejor marca
          </p>
          <p className="mt-1 font-mono text-6xl font-black tabular-nums text-amber-200">
            {best} ms
          </p>
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
            Intento {attempts.length + 1} de {MAX_ATTEMPTS} →
          </button>
        )}
        {phase === "tooSoon" && (
          <button
            onClick={startRound}
            className="rounded-xl bg-fuchsia-500 px-7 py-4 text-lg font-black text-white"
          >
            Repetir este intento
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
