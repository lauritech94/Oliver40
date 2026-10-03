"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type TaskRow = {
  id: number;
  playerId: number;
  stepIndex: number;
  cardNumber: number;
  typeName: string;
  icon: string;
  title: string;
  requiresJudge: boolean;
  solvedAt: string | null;
};

type PlayerRow = {
  id: number;
  name: string;
  emoji: string;
  slot: number;
  currentStep: number;
  finishedAt: string | null;
  tasks: TaskRow[];
};

type GameState = { game: { planVersion: string }; players: PlayerRow[] };

export default function JudgeLinksPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [copied, setCopied] = useState<string>("");
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(async () => {
    const [stateRes, meRes] = await Promise.all([
      fetch("/api/fixed-state", { cache: "no-store" }),
      fetch("/api/me", { cache: "no-store" }),
    ]);
    if (!stateRes.ok) {
      setError("No se pudo cargar el plan fijo.");
      return;
    }
    setState((await stateRes.json()) as GameState);
    setSessionName(meRes.ok ? ((await meRes.json()).player?.name ?? null) : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const players = useMemo(
    () =>
      (state?.players ?? []).map((player) => ({
        ...player,
        tasks: [...player.tasks].sort((a, b) => a.stepIndex - b.stepIndex),
      })),
    [state],
  );

  async function enterAs(player: PlayerRow) {
    setBusy(player.id);
    const res = await fetch("/api/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: player.id, switchPlayer: true }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("No se pudo abrir la sesión de ese jugador.");
      return;
    }
    setSessionName(player.name);
    setError("");
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("El navegador bloqueó el portapapeles; copia el texto a mano.");
    }
  }

  function allLinksText() {
    return players
      .map(
        (player) =>
          `J${String(player.slot).padStart(2, "0")} ${player.name}\n` +
          player.tasks
            .map(
              (task) =>
                `  ${String(task.stepIndex + 1).padStart(2, "0")}. TARJETA ${String(task.cardNumber).padStart(2, "0")} · ${task.typeName} → ${origin}/c/${task.cardNumber}`,
            )
            .join("\n"),
      )
      .join("\n\n");
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-slate-400">
        {error || "Cargando los 420 enlaces…"}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link href="/judge" className="text-sm text-slate-500 hover:text-slate-300">
        ← Panel de jueces
      </Link>
      <h1 className="mt-3 text-3xl font-black">🔗 Enlaces de prueba</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">
        Los 15 enlaces de cada persona, en su orden definitivo. Para recorrer un camino:
        pulsa <strong>«Entrar como»</strong> y después abre sus enlaces de arriba abajo. Si abres un
        enlace de otra persona, la app responderá «esta tarjeta no es tuya» (justo lo que debe
        pasar).
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="flex-1 text-sm">
          Sesión actual:{" "}
          <strong className={sessionName ? "text-cyan-300" : "text-slate-500"}>
            {sessionName ?? "ninguna"}
          </strong>
        </p>
        <button
          onClick={() => void copy(allLinksText(), "all")}
          className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:border-cyan-400"
        >
          {copied === "all" ? "Copiado ✓" : "Copiar los 420 enlaces"}
        </button>
        <button
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            setSessionName(null);
          }}
          className="rounded-lg border border-slate-800 px-4 py-2 text-xs text-slate-500 hover:border-rose-500/50 hover:text-rose-300"
        >
          Cerrar sesión
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {players.map((player) => {
          const isOpen = open === player.id;
          const isCurrent = sessionName === player.name;
          return (
            <section
              key={player.id}
              className={`rounded-2xl border bg-slate-900/60 ${
                isCurrent ? "border-cyan-400/60" : "border-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3 p-4">
                <span className="font-mono text-xs text-cyan-300">
                  J{String(player.slot).padStart(2, "0")}
                </span>
                <span className="text-2xl">{player.emoji}</span>
                <h2 className="flex-1 text-lg font-bold">
                  {player.name}
                  {isCurrent && <span className="ml-2 text-xs text-cyan-300">● sesión activa</span>}
                </h2>
                <span className="font-mono text-xs text-slate-500">
                  {player.tasks.filter((t) => t.solvedAt).length}/15
                </span>
                <button
                  onClick={() => void enterAs(player)}
                  disabled={busy !== null}
                  className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"
                >
                  {busy === player.id ? "…" : "Entrar como"}
                </button>
                <button
                  onClick={() => setOpen(isOpen ? null : player.id)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300"
                >
                  {isOpen ? "Ocultar" : "Ver 15 enlaces"}
                </button>
              </div>

              {isOpen && (
                <ol className="grid gap-1 border-t border-slate-800 p-4">
                  {player.tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1.5 text-sm odd:bg-slate-950/40"
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-slate-600">
                        {String(task.stepIndex + 1).padStart(2, "0")}
                      </span>
                      <span>{task.icon}</span>
                      <span className="w-28 shrink-0 font-mono text-xs font-black text-fuchsia-300">
                        TARJETA {String(task.cardNumber).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                        {task.typeName}
                        {task.requiresJudge && <span className="ml-1 text-amber-300">· juez</span>}
                      </span>
                      {task.solvedAt && <span className="text-emerald-400">✓</span>}
                      <a
                        href={`/c/${task.cardNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-slate-700 px-2 py-1 font-mono text-[11px] text-cyan-300 hover:border-cyan-400"
                      >
                        /c/{task.cardNumber} ↗
                      </a>
                    </li>
                  ))}
                  <li className="mt-2">
                    <button
                      onClick={() =>
                        void copy(
                          player.tasks
                            .map((t) => `${origin}/c/${t.cardNumber}`)
                            .join("\n"),
                          `p${player.id}`,
                        )
                      }
                      className="text-xs text-slate-500 underline-offset-4 hover:text-cyan-300 hover:underline"
                    >
                      {copied === `p${player.id}` ? "Copiado ✓" : "Copiar los 15 enlaces de " + player.name}
                    </button>
                  </li>
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
