"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Puzzle from "@/components/Puzzle";
import CardMinigame from "@/components/CardMinigame";
import type { CardMinigame as CardMinigameData } from "@/lib/types";

type Difficulty = "facil" | "media" | "dificil";
type Status = "pending" | "correct" | "revealed" | "judge";

type Trial = {
  status: Status;
  attempts: number;
  difficulty?: Difficulty;
  expected?: string;
};

type TestTask = {
  id: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  prompt: string;
  requiresJudge: boolean;
  puzzle: { image: string; size: number; word: string } | null;
  minigame: CardMinigameData | null;
  memory: { text: string; seconds: number } | null;
};

type TestPlayer = {
  id: number;
  slot: number;
  name: string;
  emoji: string;
  tasks: TestTask[];
};

type TestData = { planVersion: string; players: TestPlayer[]; error?: string };

const DIFFICULTY: { value: Difficulty; label: string; className: string }[] = [
  { value: "facil", label: "Fácil", className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200" },
  { value: "media", label: "Media", className: "border-amber-500/50 bg-amber-500/10 text-amber-200" },
  { value: "dificil", label: "Difícil", className: "border-rose-500/50 bg-rose-500/10 text-rose-200" },
];

export default function JudgeManualTestPage() {
  const [data, setData] = useState<TestData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [trials, setTrials] = useState<Record<number, Trial>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [memoryVisible, setMemoryVisible] = useState(false);

  useEffect(() => {
    fetch("/api/judge/manual-test", { cache: "no-store" })
      .then(async (response) => {
        const json = (await response.json().catch(() => null)) as TestData | null;
        if (!response.ok || !json) throw new Error(json?.error ?? "No se pudo cargar el modo ensayo.");
        setData(json);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "No se pudo cargar."));
  }, []);

  const player = data?.players.find((item) => item.id === selectedId) ?? null;
  const tasks = useMemo(
    () => (player ? [...player.tasks].sort((a, b) => a.stepIndex - b.stepIndex) : []),
    [player],
  );
  const task = tasks[step] ?? null;
  const trial = task ? trials[task.id] : undefined;
  const passed = trial && trial.status !== "pending";
  const tested = tasks.filter((item) => trials[item.id]?.status !== undefined).length;
  const completed = tasks.filter((item) => trials[item.id] && trials[item.id].status !== "pending").length;
  const rated = tasks.filter((item) => trials[item.id]?.difficulty).length;
  /** Solo se desbloquea el siguiente paso al superar Y valorar el actual. */
  const firstIncomplete = tasks.findIndex((item) => {
    const current = trials[item.id];
    return !current || current.status === "pending" || !current.difficulty;
  });
  const unlockedThrough = firstIncomplete === -1 ? 14 : firstIncomplete;

  useEffect(() => {
    setAnswer("");
    setError("");
    setMemoryVisible(false);
  }, [selectedId, step]);

  function select(next: TestPlayer) {
    setSelectedId(next.id);
    setStep(0);
    setTrials({});
  }

  function updateTrial(taskId: number, patch: Partial<Trial>) {
    setTrials((previous) => {
      const current: Trial = previous[taskId] ?? { status: "pending", attempts: 0 };
      return { ...previous, [taskId]: { ...current, ...patch } };
    });
  }

  const check = useCallback(
    async (payload: { answer?: string; action?: "reveal" | "complete-puzzle" | "complete-minigame" | "judge-pass" }): Promise<boolean> => {
      if (!task || busy) return false;
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/judge/manual-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id, ...payload }),
        });
        const json = await response.json().catch(() => null);
        if (!response.ok || !json) throw new Error(json?.error ?? "No se pudo comprobar.");

        if (payload.action === "reveal") {
          updateTrial(task.id, { status: "revealed", expected: json.expected });
          return true;
        }
        if (json.correct) {
          updateTrial(task.id, {
            status: payload.action === "judge-pass" ? "judge" : "correct",
            attempts: (trial?.attempts ?? 0) + (payload.answer ? 1 : 0),
            expected: json.expected,
          });
          return true;
        }
        updateTrial(task.id, { status: "pending", attempts: (trial?.attempts ?? 0) + 1 });
        setError("No es correcta. Piénsalo y vuelve a intentarlo, o revela la solución para evaluarla.");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo comprobar.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [task, busy, trial?.attempts],
  );

  function rate(difficulty: Difficulty) {
    if (task) updateTrial(task.id, { difficulty });
  }

  function next() {
    if (step < tasks.length - 1) setStep((value) => value + 1);
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-slate-400">
        {error || "Cargando las 420 pruebas…"}
      </main>
    );
  }

  if (!player || !task) {
    return (
      <main className="mx-auto w-full max-w-5xl px-5 py-8">
        <Link href="/judge" className="text-sm text-slate-500 hover:text-slate-300">← Panel de jueces</Link>
        <h1 className="mt-4 text-3xl font-black">🧪 Ensayo manual de recorridos</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Elige una persona y responde tú sus 15 pruebas, en su orden real, sin abrir enlaces ni
          cambiar de sesión. El ensayo no guarda progreso ni intentos en la partida.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.players.map((item) => (
            <button
              key={item.id}
              onClick={() => select(item)}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-fuchsia-400/60 hover:bg-fuchsia-500/5"
            >
              <span className="font-mono text-xs text-cyan-300">J{String(item.slot).padStart(2, "0")}</span>
              <span className="text-2xl">{item.emoji}</span>
              <span className="flex-1 font-bold">{item.name}</span>
              <span className="text-fuchsia-300">→</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (completed === 15 && rated === 15) {
    const counts: Record<Difficulty, number> = { facil: 0, media: 0, dificil: 0 };
    for (const item of tasks) {
      const difficulty = trials[item.id]?.difficulty;
      if (difficulty) counts[difficulty]++;
    }
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <button onClick={() => setSelectedId(null)} className="text-sm text-slate-500 hover:text-slate-300">← Elegir otra persona</button>
        <div className="mt-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-7 text-center">
          <p className="text-5xl">🎉</p>
          <h1 className="mt-3 text-3xl font-black">15/15 pruebas ensayadas</h1>
          <p className="mt-2 text-slate-300">{player.emoji} {player.name} · recorrido probado sin modificar el progreso real.</p>
          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3">
            <Summary label="Fáciles" value={counts.facil} color="text-emerald-300" />
            <Summary label="Medias" value={counts.media} color="text-amber-300" />
            <Summary label="Difíciles" value={counts.dificil} color="text-rose-300" />
          </div>
        </div>
        <ol className="mt-5 grid gap-2">
          {tasks.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm">
              <span className="w-8 font-mono text-xs text-slate-500">{item.stepIndex + 1}/15</span>
              <span>{item.icon}</span>
              <span className="min-w-0 flex-1 truncate">#{item.cardNumber} · {item.title}</span>
              <span className="capitalize text-slate-400">{trials[item.id]?.difficulty ?? "sin valorar"}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => { setStep(0); setTrials({}); }} className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300">Repetir este recorrido</button>
          <button onClick={() => setSelectedId(null)} className="rounded-xl bg-fuchsia-500 px-5 py-3 font-black text-white">Probar otra persona</button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-7">
      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <button onClick={() => setSelectedId(null)} className="hover:text-slate-300">← Cambiar persona</button>
        <span className="font-mono">Ensayo · no guarda progreso</span>
      </div>

      <header className="mt-4 flex items-center gap-3">
        <span className="text-3xl">{player.emoji}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black">{player.name}</h1>
          <p className="text-xs text-slate-500">J{String(player.slot).padStart(2, "0")} · paso {step + 1}/15 · tarjeta #{task.cardNumber}</p>
        </div>
        <span className="font-mono text-sm text-cyan-300">{completed}/15</span>
      </header>

      <nav
        className="mt-4 grid gap-1"
        style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
        aria-label="Pasos del recorrido"
      >
        {tasks.map((item, index) => {
          const state = trials[item.id];
          const locked = index > unlockedThrough;
          return (
            <button
              key={item.id}
              onClick={() => !locked && setStep(index)}
              disabled={locked}
              title={locked ? "Supera y valora la prueba anterior para desbloquear esta" : `${index + 1}. ${item.typeName}`}
              className={`h-7 rounded text-[9px] font-bold ${
                index === step
                  ? "bg-fuchsia-500 text-white"
                  : state && state.status !== "pending" && state.difficulty
                    ? "bg-emerald-500/20 text-emerald-300"
                    : locked
                      ? "cursor-not-allowed bg-slate-900 text-slate-700"
                      : "bg-slate-800 text-slate-500"
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </nav>

      <article className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{task.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">{task.typeName}</p>
            <h2 className="text-xl font-black">{task.title}</h2>
          </div>
        </div>
        <p className="mt-5 whitespace-pre-line rounded-2xl bg-slate-950/70 p-5 text-sm leading-relaxed text-slate-200">{task.prompt}</p>

        {task.memory && (
          <MemoryTrial
            key={task.id}
            text={task.memory.text}
            seconds={task.memory.seconds}
            onVisible={setMemoryVisible}
          />
        )}

        {task.puzzle && (
          <Puzzle
            key={task.id}
            image={task.puzzle.image}
            size={task.puzzle.size}
            word={task.puzzle.word}
            onSolved={() => check({ action: "complete-puzzle" })}
          />
        )}

        {task.minigame && !passed && (
          <CardMinigame
            key={task.id}
            game={task.minigame}
            onComplete={() => check({ action: "complete-minigame" })}
          />
        )}

        {!task.puzzle && !task.minigame && !task.requiresJudge && !passed && !memoryVisible && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (answer.trim()) void check({ answer: answer.trim() });
            }}
            className="mt-5 grid gap-3"
          >
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Tu respuesta de prueba"
              autoComplete="off"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-lg outline-none focus:border-fuchsia-400"
            />
            <button disabled={busy || !answer.trim()} className="rounded-xl bg-fuchsia-500 px-5 py-3.5 font-black text-white disabled:opacity-40">
              {busy ? "Comprobando…" : "Comprobar mi respuesta"}
            </button>
          </form>
        )}

        {task.requiresJudge && !passed && (
          <button onClick={() => void check({ action: "judge-pass" })} disabled={busy} className="mt-5 w-full rounded-xl bg-amber-500 px-5 py-3.5 font-black text-slate-950 disabled:opacity-40">
            📸 La daría por válida como juez
          </button>
        )}

        {memoryVisible && (
          <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
            🔒 El cajetín está oculto mientras memorizas.
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

        {!passed && !task.puzzle && !task.minigame && (
          <button onClick={() => void check({ action: "reveal" })} disabled={busy} className="mt-4 w-full text-xs text-slate-500 underline-offset-4 hover:text-amber-300 hover:underline">
            Ver respuesta y pasar a valorarla
          </button>
        )}

        {passed && (
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
            <p className="font-bold text-emerald-200">
              {trial?.status === "revealed" ? "👁️ Respuesta revelada" : trial?.status === "judge" ? "⚖️ Validada como juez" : "✅ ¡Correcta!"}
            </p>
            {trial?.expected && <p className="mt-2 text-xs text-emerald-100/70">Respuesta aceptada: <strong>{trial.expected}</strong></p>}
          </div>
        )}

        {passed && (
          <div className="mt-5">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500">¿Qué dificultad le pondrías?</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {DIFFICULTY.map((item) => (
                <button
                  key={item.value}
                  onClick={() => rate(item.value)}
                  className={`rounded-xl border px-2 py-3 text-sm font-black ${item.className} ${trial?.difficulty === item.value ? "ring-2 ring-white/70" : "opacity-65 hover:opacity-100"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={next}
              disabled={!trial?.difficulty || step >= 14}
              className="mt-4 w-full rounded-xl bg-cyan-500 px-5 py-3.5 font-black text-slate-950 disabled:opacity-30"
            >
              {step >= 14 ? "Última prueba completada" : "Siguiente prueba →"}
            </button>
          </div>
        )}
      </article>

      <p className="mt-4 text-center text-xs text-slate-600">Has abierto {tested}/15 y superado {completed}/15 en este ensayo.</p>
    </main>
  );
}

function MemoryTrial({ text, seconds, onVisible }: { text: string; seconds: number; onVisible: (visible: boolean) => void }) {
  const [visible, setVisible] = useState(false);
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    onVisible(visible);
    return () => onVisible(false);
  }, [visible, onVisible]);

  useEffect(() => {
    if (!visible) return;
    if (left <= 0) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [visible, left]);

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-center">
      {visible ? (
        <>
          <p className="break-words text-2xl font-black tracking-wide text-white">{text}</p>
          <p className="mt-2 font-mono text-sm text-cyan-300">{left} s</p>
        </>
      ) : (
        <button onClick={() => { setLeft(seconds); setVisible(true); }} className="rounded-lg bg-cyan-500 px-5 py-3 font-black text-slate-950">
          👁️ Mostrar durante {seconds} s
        </button>
      )}
    </div>
  );
}

function Summary({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
