"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Puzzle from "@/components/Puzzle";
import CardMinigame from "@/components/CardMinigame";
import type { CardMinigame as CardMinigameData } from "@/lib/types";

type PuzzleData = { image: string; size: number; word: string };

type TaskView = {
  id: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  prompt: string;

  requiresJudge: boolean;
  attempts: number;
  puzzle: PuzzleData | null;
  minigame: CardMinigameData | null;
  memorize: { seconds: number } | null;
};

type CardResponse = {
  state:
    | "active"
    | "already-solved"
    | "out-of-order"
    | "not-yours"
    | "unknown-card"
    | "no-session"
    | "not-started"
    | "bad-card";
  task?: TaskView;
  yourCard?: number | null;
  cardNumber?: number;
  totalSteps?: number;
};

const MONO_TYPES = ["sopa-de-letras", "codigo-escondido"];

export default function CardPage() {
  const params = useParams<{ card: string }>();
  const card = params.card;

  const [data, setData] = useState<CardResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [isMemorizing, setIsMemorizing] = useState(false);
  const [success, setSuccess] = useState<{ nextCard: number | null; finished: boolean } | null>(
    null,
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/cards/${card}`, { cache: "no-store" });
    setData((await res.json()) as CardResponse);
  }, [card]);

  useEffect(() => {
    load();
  }, [load]);

  const send = useCallback(
    async (value: string): Promise<boolean> => {
      setBusy(true);
      setWrong(false);
      setPending(false);
      setRequestError("");
      try {
        const res = await fetch(`/api/cards/${card}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer: value }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) throw new Error(json?.error ?? "No se pudo comprobar la respuesta. Inténtalo de nuevo.");
        if (json.correct) {
          setSuccess({ nextCard: json.nextCard ?? null, finished: Boolean(json.finished) });
          return true;
        }
        if (json.pending) setPending(true);
        else {
          setWrong(true);
          setAnswer("");
          void load();
        }
        return false;
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : "No se pudo contactar con el servidor.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [card, load],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;
    await send(answer.trim());
  }

  const completeMinigame = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setRequestError("");
    try {
      const response = await fetch(`/api/cards/${card}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete-minigame" }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.correct) {
        throw new Error(json?.error ?? "No se pudo guardar el minijuego.");
      }
      setSuccess({ nextCard: json.nextCard ?? null, finished: Boolean(json.finished) });
      return true;
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "No se pudo contactar con el servidor.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [card]);

  if (!data) return <Shell>Cargando tarjeta #{card}…</Shell>;

  if (success) {
    return (
      <Shell>
        <div className="w-full rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
          <p className="text-6xl">{success.finished ? "🏆" : "✅"}</p>
          <h1 className="mt-4 text-2xl font-black text-emerald-200">
            {success.finished ? "¡Has completado las 15 pruebas!" : "¡Correcto!"}
          </h1>
          {success.finished ? (
            <p className="mt-2 text-emerald-200/80">Corre a avisar a los jueces.</p>
          ) : (
            <>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                Tu siguiente tarjeta
              </p>
              <p className="mt-1 text-7xl font-black tabular-nums text-white">
                {success.nextCard}
              </p>
            </>
          )}
          <Link
            href="/play"
            className="mt-7 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950"
          >
            Ver mi progreso
          </Link>
        </div>
      </Shell>
    );
  }

  if (data.state === "no-session") {
    return (
      <Shell>
        <Notice icon="🔐" title="Primero identifícate">
          Esta tarjeta pertenece a una gymkhana en marcha. Entra con tu nombre y volverás
          directamente a esta tarjeta.
        </Notice>
        <Link
          href={`/join?next=/c/${card}`}
          className="mt-5 rounded-xl bg-fuchsia-500 px-6 py-3 font-bold text-white"
        >
          Entrar a la partida
        </Link>
      </Shell>
    );
  }

  if (data.state === "not-started") {
    return (
      <Shell>
        <Notice icon="⏳" title="La partida no ha empezado">
          El juego está preparando sus 420 tarjetas. Espera unos segundos y vuelve a intentarlo.
        </Notice>
      </Shell>
    );
  }

  if (data.state === "unknown-card") {
    return (
      <Shell>
        <Notice icon="🃏" title={`La tarjeta #${card} no se usa en esta partida`}>
          Es una tarjeta sobrante (señuelo). Tu tarjeta es la{" "}
          <strong className="text-fuchsia-300">#{data.yourCard}</strong>.
        </Notice>
        <PlayLink />
      </Shell>
    );
  }

  if (data.state === "not-yours") {
    return (
      <Shell>
        <Notice icon="🙅" title="Esta tarjeta no es tuya">
          Pertenece al recorrido de otro jugador. Déjala donde estaba: tu tarjeta es la{" "}
          <strong className="text-fuchsia-300">#{data.yourCard}</strong>.
        </Notice>
        <PlayLink />
      </Shell>
    );
  }

  if (data.state === "already-solved") {
    return (
      <Shell>
        <Notice icon="✅" title="Ya superaste esta prueba">
          Tu tarjeta actual es la <strong className="text-fuchsia-300">#{data.yourCard}</strong>.
        </Notice>
        <PlayLink />
      </Shell>
    );
  }

  if (data.state === "out-of-order") {
    return (
      <Shell>
        <Notice icon="🔀" title="Aún no te toca esta tarjeta">
          Es tuya, pero más adelante. Ahora mismo te toca la{" "}
          <strong className="text-fuchsia-300">#{data.yourCard}</strong>.
        </Notice>
        <PlayLink />
      </Shell>
    );
  }

  const task = data.task!;
  const mono = MONO_TYPES.includes(task.typeSlug);

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/play" className="hover:text-slate-300">
          ← Mi progreso
        </Link>
        <span className="font-mono">
          Tarjeta #{task.cardNumber} · prueba {task.stepIndex + 1}/{data.totalSteps ?? 15}
        </span>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{task.icon}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">
              {task.typeName}
            </p>
            <h1 className="text-xl font-black">{task.title}</h1>
          </div>
        </div>

        <p
          className={`mt-5 whitespace-pre-line rounded-2xl bg-slate-950/70 p-5 leading-relaxed text-slate-200 ${
            mono ? "overflow-x-auto font-mono text-[14px] tracking-wide" : "text-[15px]"
          }`}
        >
          {task.prompt}
        </p>

        {task.puzzle && (
          <Puzzle
            key={task.id}
            image={task.puzzle.image}
            size={task.puzzle.size}
            word={task.puzzle.word}
            onSolved={send}
          />
        )}

        {task.minigame && (
          <CardMinigame key={task.id} game={task.minigame} onComplete={completeMinigame} />
        )}

        {task.memorize && (
          <Memorize
            card={card}
            seconds={task.memorize.seconds}
            onMemorizingChange={setIsMemorizing}
          />
        )}

        {task.requiresJudge && (
          <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            🔑 Cuando lo consigas, pide la <strong>PALABRA SECRETA</strong> a un juez y escríbela
            abajo.
          </p>
        )}

        {isMemorizing && (
          <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-center animate-pulse">
            <p className="text-sm font-black text-amber-200 uppercase tracking-widest">
              🔒 Cajetín bloqueado
            </p>
            <p className="mt-1 text-xs text-amber-200/80">
              ¡Memoriza la secuencia mentalmente! El cajetín de respuesta se desbloqueará cuando se agote el tiempo.
            </p>
          </div>
        )}

        {!isMemorizing && !task.minigame && (!task.puzzle || wrong || pending) && (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={task.requiresJudge ? "Palabra secreta" : "Tu respuesta"}
              autoComplete="off"
              autoCapitalize="none"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-lg outline-none focus:border-fuchsia-400"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-fuchsia-500 px-6 py-4 text-lg font-black text-white shadow-lg shadow-fuchsia-500/30 disabled:opacity-40"
            >
              {busy ? "Comprobando…" : "Comprobar"}
            </button>
          </form>
        )}

        {requestError && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {requestError}
          </p>
        )}

        {wrong && (
          <p className="mt-4 animate-pulse rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-center text-sm font-semibold text-rose-200">
            ❌ No es correcto. Intentos: {task.attempts + 1}
          </p>
        )}
        {pending && (
          <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center text-sm text-amber-200">
            ⚠️ Esta prueba todavía no tiene respuesta asignada. Avisa a un juez: la escribe en
            «✏️ Editar preguntas» y podrás continuar.
          </p>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-600">
          Sin pistas en ninguna prueba: busca, piensa y respóndela tú. Si te bloqueas, avisa a un{" "}
          <strong className="text-slate-500">juez</strong>.
        </p>
      </div>
    </main>
  );
}

/* ───────────── Memoria: la secuencia solo se ve unos segundos ───────────── */
function Memorize({
  card,
  seconds,
  onMemorizingChange,
}: {
  card: string;
  seconds: number;
  onMemorizingChange?: (active: boolean) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [views, setViews] = useState(0);

  useEffect(() => {
    if (text === null) {
      onMemorizingChange?.(false);
      return;
    }
    onMemorizingChange?.(true);
    if (left <= 0) {
      setText(null);
      onMemorizingChange?.(false);
      return;
    }
    const timer = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(timer);
  }, [text, left, onMemorizingChange]);

  async function show() {
    const res = await fetch(`/api/cards/${card}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "memorize" }),
    });
    const json = await res.json();
    if (json.text) {
      setText(json.text as string);
      setLeft(json.seconds as number);
      setViews((v) => v + 1);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-center">
      {text !== null ? (
        <>
          <p className="whitespace-pre-line break-words text-2xl font-black leading-snug tracking-wide text-white">
            {text}
          </p>
          <p className="mt-3 text-sm font-bold text-cyan-300">⏱️ {left} s</p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={show}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 shadow-md transition hover:bg-cyan-400"
          >
            👁️ {views === 0 ? `Mostrar (${seconds} s)` : "Volver a mirar"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            {views === 0
              ? "Solo se ve unos segundos. El cajetín de abajo se bloqueará mientras miras."
              : `Lo has mirado ${views} ${views === 1 ? "vez" : "veces"} (los jueces lo ven).`}
          </p>
        </>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center text-slate-300">
      {children}
    </main>
  );
}

function Notice({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
      <p className="text-5xl">{icon}</p>
      <h1 className="mt-4 text-xl font-black text-slate-100">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{children}</p>
    </div>
  );
}

function PlayLink() {
  return (
    <Link href="/play" className="mt-5 rounded-xl bg-slate-800 px-6 py-3 font-bold text-slate-100">
      Ver mi tarjeta actual
    </Link>
  );
}
