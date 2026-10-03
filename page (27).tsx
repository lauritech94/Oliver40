"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type GridTile = {
  stepIndex: number;
  solved: boolean;
  active: boolean;
  cardNumber: number | null;
  typeName: string | null;
  icon: string | null;
  title: string | null;
};

type Me = {
  game: { name: string; status: string };
  player: {
    id: number;
    name: string;
    emoji: string;
    slot: number;
    profile: Record<string, string>;
    currentStep: number;
    startedAt: string | null;
    finishedAt: string | null;
  };
  currentCard: number | null;
  totalSteps: number;
  solvedCount: number;
  grid: GridTile[];
  history: {
    stepIndex: number;
    cardNumber: number;
    typeName: string;
    icon: string;
    title: string;
    attempts: number;
  }[];
};

export default function PlayPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "anon">("loading");

  const load = useCallback(async () => {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.status === 401) {
      setStatus("anon");
      return;
    }
    if (!res.ok) return;
    setMe((await res.json()) as Me);
    setStatus("ok");
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  if (status === "loading") return <CenteredNote>Cargando tu tablero…</CenteredNote>;

  if (status === "anon" || !me) {
    return (
      <CenteredNote>
        <p className="mb-4">Primero elige tu nombre de la lista de jugadores.</p>
        <Link href="/join" className="rounded-xl bg-fuchsia-500 px-5 py-3 font-bold text-white">
          Elegir mi nombre
        </Link>
      </CenteredNote>
    );
  }

  const total = me.totalSteps || 15;
  const progress = Math.round((me.solvedCount / total) * 100);
  const finished = Boolean(me.player.finishedAt) || me.solvedCount === total;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-7 sm:py-10">
      <header className="flex items-center gap-3">
        <span className="text-4xl">{me.player.emoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-black">{me.player.name}</h1>
          <p className="text-xs uppercase tracking-widest text-slate-500">
            {me.game.name} · jugador J{String(me.player.slot).padStart(2, "0")}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-center">
          <span className="block font-mono text-lg font-black text-cyan-300">
            {me.solvedCount}/15
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">hechas</span>
        </div>
      </header>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {finished ? (
        <div className="mt-6 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/20 to-slate-900/60 p-7 text-center">
          <p className="text-5xl">🔥</p>
          <h2 className="mt-3 text-3xl font-black text-amber-100">
            ¡Has terminado las 15 pruebas!
          </h2>
          <p className="mt-2 text-sm text-amber-200/80">
            Se ha desbloqueado la <strong>Fase Final: El Reto de los Récords</strong>. Dos
            minijuegos de velocidad y reflejos para conseguir la mejor marca.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/minigames"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-500 px-7 py-4 text-lg font-black text-white shadow-lg shadow-amber-500/25"
            >
              🔥 Jugar la fase final →
            </Link>
            <Link
              href="/ranking"
              className="rounded-xl border border-amber-500/40 px-6 py-3.5 font-bold text-amber-200 hover:bg-amber-500/10"
            >
              Ver clasificación
            </Link>
          </div>
        </div>
      ) : me.currentCard !== null ? (
        <div className="mt-6 rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">
            Tu siguiente paso · {me.solvedCount + 1} de 15
          </p>
          <div className="mt-2">
            <p className="text-sm text-slate-300">
              Busca la <strong>TARJETA {String(me.currentCard).padStart(2, "0")}</strong> y acércala
              al móvil:
            </p>
            <p className="font-mono text-7xl font-black tabular-nums text-white">
              {String(me.currentCard).padStart(2, "0")}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center text-emerald-200">
          ¡Has completado el recorrido! 🏆
        </div>
      )}

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Tus 15 tarjetas</h2>
            <p className="mt-1 text-xs text-slate-500">
              El orden es tuyo; ninguna de tus tarjetas pertenece a otra persona.
            </p>
          </div>
          <span className="text-xs text-slate-500">🔒 bloqueada · ✓ completada</span>
        </div>

        <ol className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: 15 }, (_, i) => {
            const tile = me.grid.find((g) => g.stepIndex === i);
            const solved = Boolean(tile?.solved);
            const active = Boolean(tile?.active);
            return (
              <li key={i}>
                <div
                  aria-current={active ? "step" : undefined}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl border p-2 text-center transition ${
                    solved
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : active
                        ? "border-fuchsia-400 bg-fuchsia-500/15 text-white shadow-lg shadow-fuchsia-500/10"
                        : "border-slate-800 bg-slate-900/50 text-slate-600"
                  }`}
                >
                  {solved ? (
                    <>
                      <span className="text-xl">✓</span>
                      <span className="mt-1 font-mono text-base font-black">#{tile?.cardNumber}</span>
                      <span className="mt-1 line-clamp-1 text-[10px] text-emerald-100/70">
                        {tile?.icon} {tile?.typeName}
                      </span>
                    </>
                  ) : active ? (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-200">
                        Escanea
                      </span>
                      <span className="mt-1 font-mono text-3xl font-black">#{tile?.cardNumber}</span>
                      <span className="mt-1 line-clamp-1 text-[10px] text-slate-300">
                        {tile?.icon} {tile?.typeName}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🔒</span>
                      <span className="mt-1 font-mono text-xs">Prueba {String(i + 1).padStart(2, "0")}</span>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {me.history.length > 0 && (
        <details className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-400">
            Ver pruebas completadas ({me.history.length})
          </summary>
          <ol className="mt-3 grid gap-2">
            {me.history.map((item) => (
              <li key={item.stepIndex} className="flex items-center gap-3 text-sm">
                <span className="text-xl">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.typeName} · {item.title}</span>
                <span className="font-mono text-slate-500">#{item.cardNumber}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <footer className="mt-12 text-center text-xs text-slate-600">
        <Link href="/judge/links" className="text-slate-500 hover:text-cyan-400 hover:underline">
          🛠️ Modo pruebas: panel de jueces / cambiar de jugador →
        </Link>
      </footer>
    </main>
  );
}

function CenteredNote({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
      {children}
    </main>
  );
}
