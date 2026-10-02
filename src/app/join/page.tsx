"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RosterPlayer = { id: number; name: string; emoji: string; slot: number };
type Session = { name: string; emoji: string; slot: number } | null;

export default function JoinPage() {
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    // Si esta persona ya eligió nombre, no se le vuelve a mostrar la lista.
    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => (res.status === 401 ? null : ((await res.json()).player as Session)))
      .then((player) => {
        if (active) setSession(player ?? null);
      })
      .catch(() => {
        if (active) setSession(null);
      });

    fetch("/api/roster", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo cargar la lista de jugadores.");
        }
        return data as { players: RosterPlayer[] };
      })
      .then((data) => {
        if (active) setRoster(data.players);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Error");
      });

    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return roster.filter((p) => !q || p.name.toLocaleLowerCase("es").includes(q));
  }, [roster, query]);

  async function choose(playerId: number) {
    setError("");
    setJoining(playerId);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo entrar");

      // Navegación dura: garantiza que la cookie de sesión viaje en la petición
      // y evita que el router devuelva la lista de nombres desde su caché.
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next && /^\/c\/\d+$/.test(next) ? next : "/play");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al entrar");
      setJoining(null);
    }
  }

  if (session === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-slate-400">
        Cargando…
      </main>
    );
  }

  if (session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 text-center">
        <div className="rounded-3xl border border-cyan-500/40 bg-cyan-500/10 p-8">
          <p className="text-5xl">{session.emoji}</p>
          <h1 className="mt-4 text-2xl font-black">Ya estás dentro, {session.name}</h1>
          <p className="mt-2 text-sm text-slate-300">
            Tu nombre ya está elegido y tu recorrido es solo tuyo. No puedes jugar como otra
            persona.
          </p>
          <Link
            href="/play"
            className="mt-6 inline-block rounded-xl bg-fuchsia-500 px-6 py-3 font-black text-white"
          >
            Ir a mi tablero →
          </Link>
        </div>
        <p className="mt-5 text-xs text-slate-600">
          ¿No eres {session.name}? Pide a un juez que te cambie desde su panel.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-5 py-8 sm:py-12">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Inicio
      </Link>
      <div className="mt-6">
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200">
          Gymkhana única · 28 jugadores
        </span>
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">¿Quién eres?</h1>
        <p className="mt-2 text-slate-400">
          Elige tu nombre. Tendrás 15 tarjetas propias y un camino fijo; no compartes números con
          nadie.
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-300">
          ⚠️ Solo puedes elegir una vez: después quedará bloqueado.
        </p>
      </div>

      <label className="mt-6 grid gap-2">
        <span className="sr-only">Busca tu nombre</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔎 Busca tu nombre…"
          autoComplete="off"
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-lg outline-none focus:border-fuchsia-400"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {roster.length === 0 ? (
        <p className="mt-8 text-center text-slate-500">Cargando jugadores…</p>
      ) : (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {visible.map((player) => (
            <li key={player.id}>
              <button
                type="button"
                onClick={() => void choose(player.id)}
                disabled={joining !== null}
                className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-left transition hover:border-fuchsia-400/60 hover:bg-fuchsia-500/10 disabled:opacity-50"
              >
                <span className="w-10 shrink-0 text-center font-mono text-xs text-slate-600">
                  J{String(player.slot).padStart(2, "0")}
                </span>
                <span className="text-2xl">{player.emoji}</span>
                <span className="flex-1 text-lg font-bold">{player.name}</span>
                <span className="text-fuchsia-300">{joining === player.id ? "…" : "→"}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {roster.length > 0 && visible.length === 0 && (
        <p className="mt-8 text-center text-slate-500">No hay ningún nombre con esa búsqueda.</p>
      )}
    </main>
  );
}
