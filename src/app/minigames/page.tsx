"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  player: { name: string; emoji: string; slot: number; finishedAt: string | null };
  solvedCount: number;
  totalSteps: number;
};

export default function MinigamesHub() {
  const [me, setMe] = useState<Me | null>(null);
  const [anon, setAnon] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          setAnon(true);
          return;
        }
        setMe((await res.json()) as Me);
      })
      .catch(() => setAnon(true));
  }, []);

  const unlocked = Boolean(me?.player.finishedAt) || me?.solvedCount === me?.totalSteps;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link href="/play" className="text-sm text-slate-500 hover:text-slate-300">
        ← Volver a mi tablero
      </Link>

      <div className="mt-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-amber-300">
          🔥 Fase final
        </p>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          El Reto de los Récords
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Ya has terminado la gymkhana. Ahora toca demostrar quién tiene los mejores reflejos y la
          mano más rápida. Dos minijuegos, dos marcas, y una clasificación general.
        </p>
      </div>

      {anon && (
        <div className="mt-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-center">
          <p className="font-bold text-amber-200">
            Estás viendo la fase final sin entrar con tu nombre
          </p>
          <p className="mt-1 text-sm text-amber-200/80">
            Para registrar tu marca en la clasificación, entra con tu nombre de la lista.
          </p>
          <Link
            href="/join"
            className="mt-4 inline-block rounded-xl bg-fuchsia-500 px-6 py-3 font-bold text-white"
          >
            Entrar con mi nombre
          </Link>
        </div>
      )}

      {me && !unlocked && (
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-5 text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-bold text-slate-200">
            Aún no te toca, {me.player.name}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            La fase final se desbloquea cuando terminas tus <strong>15 pruebas</strong>. Llevas{" "}
            <strong>
              {me.solvedCount}/{me.totalSteps}
            </strong>
            .
          </p>
          <Link
            href="/play"
            className="mt-4 inline-block rounded-xl bg-fuchsia-500 px-6 py-3 font-bold text-white"
          >
            Seguir con mis pruebas
          </Link>
          <details className="mt-4 text-xs text-slate-600">
            <summary className="cursor-pointer hover:text-slate-400">
              (modo pruebas: ver los minijuegos de todos modos)
            </summary>
            <p className="mt-2">Puedes probarlos aquí abajo aunque no hayas terminado.</p>
          </details>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Link href="/minigames/reaccion" className="group">
          <article className="flex h-full flex-col rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/15 to-slate-900/60 p-6 transition group-hover:border-amber-300">
            <div className="flex items-center justify-between">
              <p className="text-4xl">⚡</p>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Reflejos
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black text-amber-100">Reflejos de Relámpago</h2>
            <p className="mt-2 flex-1 text-sm text-slate-300">
              Espera al verde y pulsa. Mide tus milisegundos de reacción en 3 rondas.{" "}
              <strong>Menos tiempo = mejor marca.</strong>
            </p>
            <span className="mt-4 font-bold text-amber-300 group-hover:underline">
              Jugar ahora →
            </span>
          </article>
        </Link>

        <Link href="/minigames/numeros" className="group">
          <article className="flex h-full flex-col rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-cyan-500/15 to-slate-900/60 p-6 transition group-hover:border-cyan-300">
            <div className="flex items-center justify-between">
              <p className="text-4xl">🔢</p>
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                Velocidad
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-black text-cyan-100">Caza de Números</h2>
            <p className="mt-2 flex-1 text-sm text-slate-300">
              Toca del 1 al 16 en orden, lo más rápido que puedas.{" "}
              <strong>Menos tiempo = mejor marca.</strong>
            </p>
            <span className="mt-4 font-bold text-cyan-300 group-hover:underline">
              Jugar ahora →
            </span>
          </article>
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <p className="text-3xl">🏆</p>
        <h3 className="mt-2 text-xl font-black">Clasificación general</h3>
        <p className="mt-1 text-sm text-slate-400">
          Mira el podio y las mejores marcas de todo el mundo.
        </p>
        <Link
          href="/ranking"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-500 px-7 py-3.5 font-black text-white shadow-lg shadow-fuchsia-500/20"
        >
          Ver el ranking →
        </Link>
      </div>
    </main>
  );
}
