"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardMinigame as CardMinigameData } from "@/lib/types";

type Props = {
  game: CardMinigameData;
  onComplete: (result?: Record<string, unknown>) => Promise<boolean>;
};

export default function CardMinigame({ game, onComplete }: Props) {
  if (game.kind === "maze") return <Maze game={game} onComplete={onComplete} />;
  if (game.kind === "intruder") return <Intruder game={game} onComplete={onComplete} />;
  return <Stopwatch game={game} onComplete={onComplete} />;
}

function Maze({
  game,
  onComplete,
}: {
  game: Extract<CardMinigameData, { kind: "maze" }>;
  onComplete: Props["onComplete"];
}) {
  const [position, setPosition] = useState(game.start);
  const [moves, setMoves] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const submitted = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { size, cells } = game;

  const move = useCallback(
    (direction: "up" | "right" | "down" | "left") => {
      if (position === game.end) return;
      const bit = { up: 1, right: 2, down: 4, left: 8 }[direction];
      if (!(cells[position] & bit)) return;
      const delta = { up: -size, right: 1, down: size, left: -1 }[direction];
      setPosition((current) => current + delta);
      setMoves((value) => value + 1);
    },
    [cells, game.end, position, size],
  );

  useEffect(() => {
    function key(event: KeyboardEvent) {
      const direction = { ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left" }[event.key] as
        | "up"
        | "right"
        | "down"
        | "left"
        | undefined;
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [move]);

  const finish = useCallback(async () => {
    setSending(true);
    setSendError(false);
    const ok = await onComplete({ moves });
    setSending(false);
    if (!ok) setSendError(true);
  }, [moves, onComplete]);

  useEffect(() => {
    if (position === game.end && !submitted.current) {
      submitted.current = true;
      void finish();
    }
  }, [position, game.end, finish]);

  return (
    <section className="mt-5 rounded-2xl border border-cyan-500/30 bg-slate-950/70 p-3" data-testid="maze-game">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>🔵 Inicio: arriba izquierda</span>
        <span className="font-mono">{moves} movimientos</span>
        <span>🏁 Salida</span>
      </div>
      <div
        className="mx-auto mt-3 grid aspect-square w-full max-w-lg touch-none bg-slate-800 p-1"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        onTouchStart={(event) => {
          const point = event.touches[0];
          touch.current = { x: point.clientX, y: point.clientY };
        }}
        onTouchEnd={(event) => {
          if (!touch.current) return;
          const point = event.changedTouches[0];
          const dx = point.clientX - touch.current.x;
          const dy = point.clientY - touch.current.y;
          touch.current = null;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return;
          move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
        }}
      >
        {cells.map((openings, index) => (
          <div
            key={index}
            className="relative aspect-square bg-slate-950"
            style={{
              borderTop: openings & 1 ? "1px solid transparent" : "1px solid #64748b",
              borderRight: openings & 2 ? "1px solid transparent" : "1px solid #64748b",
              borderBottom: openings & 4 ? "1px solid transparent" : "1px solid #64748b",
              borderLeft: openings & 8 ? "1px solid transparent" : "1px solid #64748b",
            }}
          >
            {index === game.end && <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-xs">🏁</span>}
            {index === position && <span className="absolute inset-[15%] rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
          </div>
        ))}
      </div>
      {position !== game.end ? (
        <div className="mx-auto mt-4 grid w-36 grid-cols-3 gap-1" aria-label="Controles del laberinto">
          <span />
          <Control label="Arriba" icon="▲" onClick={() => move("up")} />
          <span />
          <Control label="Izquierda" icon="◀" onClick={() => move("left")} />
          <Control label="Abajo" icon="▼" onClick={() => move("down")} />
          <Control label="Derecha" icon="▶" onClick={() => move("right")} />
        </div>
      ) : (
        <GameDone saving={sending} error={sendError} onRetry={finish} text="¡Has salido del laberinto!" />
      )}
      <p className="mt-3 text-center text-[11px] text-slate-500">Usa las flechas, el teclado o desliza sobre el laberinto.</p>
    </section>
  );
}

function Control({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="h-11 rounded-lg border border-slate-700 bg-slate-900 font-black text-cyan-200 active:scale-95">
      {icon}
    </button>
  );
}

function Intruder({
  game,
  onComplete,
}: {
  game: Extract<CardMinigameData, { kind: "intruder" }>;
  onComplete: Props["onComplete"];
}) {
  const [round, setRound] = useState(0);
  const [errors, setErrors] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const current = game.rounds[Math.min(round, game.rounds.length - 1)];
  const done = round >= game.rounds.length;

  const finish = useCallback(async () => {
    setSending(true);
    setSendError(false);
    const ok = await onComplete({ errors });
    setSending(false);
    if (!ok) setSendError(true);
  }, [errors, onComplete]);

  useEffect(() => {
    if (done) void finish();
    // finish cambia con `errors`; al estar done solo queremos el primer envío.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <section className="mt-5 rounded-2xl border border-fuchsia-500/30 bg-slate-950/70 p-4" data-testid="intruder-game">
      {!done ? (
        <>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ronda {round + 1}/{game.rounds.length}</span>
            <span>{errors} fallos</span>
          </div>
          <div className="mt-3 grid grid-cols-8 gap-1 rounded-xl bg-slate-900 p-2">
            {Array.from({ length: 64 }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={index === current.index ? "Símbolo intruso" : `Símbolo ${index + 1}`}
                onClick={() => {
                  if (index === current.index) setRound((value) => value + 1);
                  else setErrors((value) => value + 1);
                }}
                className="aspect-square rounded text-lg transition hover:bg-slate-800 active:scale-90 sm:text-2xl"
              >
                {index === current.index ? current.odd : current.base}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">Toca el único símbolo diferente.</p>
        </>
      ) : (
        <GameDone saving={sending} error={sendError} onRetry={finish} text="¡Has encontrado los 3 intrusos!" />
      )}
    </section>
  );
}

function Stopwatch({
  game,
  onComplete,
}: {
  game: Extract<CardMinigameData, { kind: "stopwatch" }>;
  onComplete: Props["onComplete"];
}) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const startRef = useRef(0);
  const done = results.length >= game.attempts;
  const best = results.length ? Math.min(...results.map((value) => Math.abs(value - game.targetMs))) : null;

  const finish = useCallback(async () => {
    setSending(true);
    setSendError(false);
    const ok = await onComplete({ bestDifferenceMs: best, attempts: results });
    setSending(false);
    if (!ok) setSendError(true);
  }, [best, results, onComplete]);

  useEffect(() => {
    if (done) void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function tap() {
    if (done) return;
    if (!running) {
      startRef.current = performance.now();
      setRunning(true);
    } else {
      const elapsed = Math.round(performance.now() - startRef.current);
      setResults((list) => [...list, elapsed]);
      setRunning(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-amber-500/30 bg-slate-950/70 p-5 text-center" data-testid="stopwatch-game">
      <p className="text-xs uppercase tracking-widest text-amber-300">Objetivo</p>
      <p className="mt-1 font-mono text-5xl font-black">{(game.targetMs / 1000).toFixed(2)} s</p>
      {!done && (
        <button
          type="button"
          onClick={tap}
          className={`mt-5 min-h-40 w-full rounded-3xl border-4 text-3xl font-black transition active:scale-[.98] ${running ? "border-rose-300 bg-rose-500 text-white" : "border-emerald-300 bg-emerald-500 text-slate-950"}`}
        >
          {running ? "⏹ PARAR" : results.length ? "▶ SIGUIENTE INTENTO" : "▶ EMPEZAR"}
          {running && <span className="mt-2 block text-sm font-normal">El tiempo está oculto…</span>}
        </button>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {Array.from({ length: game.attempts }, (_, index) => {
          const result = results[index];
          return (
            <div key={index} className="rounded-xl border border-slate-800 bg-slate-900 p-2">
              <p className="text-[10px] text-slate-500">INTENTO {index + 1}</p>
              <p className="mt-1 font-mono font-bold">{result ? `${(result / 1000).toFixed(2)} s` : "—"}</p>
              {result && <p className="text-[10px] text-slate-500">±{(Math.abs(result - game.targetMs) / 1000).toFixed(2)} s</p>}
            </div>
          );
        })}
      </div>
      {done && <GameDone saving={sending} error={sendError} onRetry={finish} text={`Mejor diferencia: ±${((best ?? 0) / 1000).toFixed(2)} s`} />}
    </section>
  );
}

function GameDone({ saving, error, onRetry, text }: { saving: boolean; error: boolean; onRetry: () => Promise<void>; text: string }) {
  return (
    <div role="status" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
      <p className="text-2xl">🎉</p>
      <p className="mt-1 font-bold text-emerald-200">{text}</p>
      <p className="mt-1 text-xs text-emerald-100/70">{saving ? "Guardando…" : error ? "No se pudo confirmar." : "Completado."}</p>
      {error && <button onClick={() => void onRetry()} className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950">Reintentar</button>}
    </div>
  );
}
