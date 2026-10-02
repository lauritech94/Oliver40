"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type TaskView = {
  id: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  prompt: string;
  hasHint: boolean;
  hintUsed: boolean;
  requiresJudge: boolean;
  attempts: number;
  nonogram: { rows: number[][]; cols: number[][] } | null;
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
  const [hint, setHint] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
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

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim()) return;
    setBusy(true);
    setWrong(false);
    setPending(false);
    const res = await fetch(`/api/cards/${card}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.correct) {
      setSuccess({ nextCard: json.nextCard ?? null, finished: Boolean(json.finished) });
    } else if (json.pending) {
      setPending(true);
    } else {
      setWrong(true);
      setAnswer("");
      load();
    }
  }

  async function askHint() {
    const res = await fetch(`/api/cards/${card}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hint" }),
    });
    const json = await res.json();
    setHint(json.hint ?? "Sin pista");
  }

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
          Esta tarjeta pertenece a una gymkhana en marcha. Entra con el código de partida y tu
          nombre: volverás directamente a esta tarjeta.
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

        {task.nonogram && <Nonogram rows={task.nonogram.rows} cols={task.nonogram.cols} />}
        {task.memorize && <Memorize card={card} seconds={task.memorize.seconds} />}

        {task.requiresJudge && (
          <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            🔑 Cuando lo consigas, pide la <strong>PALABRA SECRETA</strong> a un juez y escríbela
            abajo.
          </p>
        )}

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

        {wrong && (
          <p className="mt-4 animate-pulse rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-center text-sm font-semibold text-rose-200">
            ❌ No es correcto. Intentos: {task.attempts + 1}
          </p>
        )}
        {pending && (
          <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center text-sm text-amber-200">
            ⚠️ La persona a la que buscas aún no ha rellenado su ficha. Avisa a un juez para que
            valide la prueba.
          </p>
        )}

        {task.hasHint && (
          <div className="mt-5 text-center">
            {hint ? (
              <p className="whitespace-pre-line rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                💡 {hint}
              </p>
            ) : (
              <button
                onClick={askHint}
                className="text-sm text-slate-500 underline-offset-4 hover:text-cyan-300 hover:underline"
              >
                💡 Pedir pista (queda registrado)
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/** Rejilla interactiva: toca para rellenar, otra vez para marcar ✕. */
function Nonogram({ rows, cols }: { rows: number[][]; cols: number[][] }) {
  const [cells, setCells] = useState<number[][]>(() =>
    Array.from({ length: rows.length }, () => Array<number>(cols.length).fill(0)),
  );

  function cycle(r: number, c: number) {
    setCells((prev) =>
      prev.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? (v + 1) % 3 : v)) : row)),
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-slate-950/70 p-4">
      <table className="mx-auto border-separate border-spacing-1">
        <thead>
          <tr>
            <th />
            {cols.map((col, ci) => (
              <th key={ci} className="pb-1 align-bottom font-mono text-xs text-cyan-300">
                <div className="flex flex-col items-center leading-tight">
                  {col.map((v, i) => (
                    <span key={i}>{v}</span>
                  ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td className="whitespace-nowrap pr-2 text-right font-mono text-xs text-cyan-300">
                {row.join(" ")}
              </td>
              {cells[ri].map((v, ci) => (
                <td key={ci}>
                  <button
                    type="button"
                    onClick={() => cycle(ri, ci)}
                    className={`h-11 w-11 rounded-md border text-lg font-bold transition ${
                      v === 1
                        ? "border-fuchsia-300 bg-fuchsia-500"
                        : v === 2
                          ? "border-slate-700 bg-slate-800 text-slate-500"
                          : "border-slate-700 bg-slate-900"
                    }`}
                    aria-label={`fila ${ri + 1} columna ${ci + 1}`}
                  >
                    {v === 2 ? "✕" : ""}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() =>
          setCells(Array.from({ length: rows.length }, () => Array<number>(cols.length).fill(0)))
        }
        className="mx-auto mt-3 block text-xs text-slate-500 hover:text-slate-300"
      >
        Limpiar rejilla
      </button>
    </div>
  );
}

/** Enseña la secuencia unos segundos. Cada vez que se pide queda registrado. */
function Memorize({ card, seconds }: { card: string; seconds: number }) {
  const [text, setText] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [views, setViews] = useState(0);

  useEffect(() => {
    if (text === null) return;
    if (left <= 0) {
      setText(null);
      return;
    }
    const timer = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(timer);
  }, [text, left]);

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
            className="rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950"
          >
            👁️ {views === 0 ? `Mostrar (${seconds} s)` : "Volver a mirar"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            {views === 0
              ? "Solo se ve unos segundos. ¡Prepárate!"
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
