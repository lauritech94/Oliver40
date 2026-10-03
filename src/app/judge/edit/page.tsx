"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type TaskRow = {
  id: number;
  playerId: number;
  stepIndex: number;
  cardNumber: number;
  typeSlug: string;
  typeName: string;
  icon: string;
  title: string;
  prompt: string;
  answer: string;
  hint: string;
  judgeNote: string;
  requiresJudge: boolean;
  needsSetup: boolean;
  edited: boolean;
  /** Lo que se usa ahora mismo para validar la prueba. */
  effectiveAnswer: string;
  meta: { profile?: { targetPlayerId: number; field: string } };
};

type PlayerRow = {
  id: number;
  name: string;
  emoji: string;
  slot: number;
  tasks: TaskRow[];
};

type GameState = {
  game: { planVersion: string; editedCount: number };
  players: PlayerRow[];
};

/** Dónde está el texto original de cada tipo, por si prefieres editarlo en el código. */
const SOURCE: Record<string, { file: string; note: string }> = {
  acertijo: { file: "src/lib/content/static.ts", note: "lista ACERTIJOS" },
  trampa: { file: "src/lib/content/extras.ts", note: "lista TRAMPAS" },
  anagrama: { file: "src/lib/content/words.ts", note: "lista ANAGRAMS" },
  emoji: { file: "src/lib/content/static.ts", note: "lista EMOJI_PUZZLES" },
  logica: { file: "src/lib/generators.ts", note: "función genLogic() (números al azar)" },
  "codigo-escondido": { file: "src/lib/content/words.ts", note: "lista CODE_WORDS · la tabla está en generators.ts (keyNumbers)" },
  puzzle: { file: "src/lib/content/extras.ts", note: "fotos PUZZLE_IMAGES y palabras PUZZLE_WORDS" },
  foto: { file: "src/lib/content/static.ts", note: "lista FOTOS · palabras en words.ts (SECRET_WORDS)" },
  "sopa-de-letras": { file: "src/lib/generators.ts", note: "función genSopa() · temas en words.ts (SOPA_THEMES)" },
  secuencia: { file: "src/lib/generators.ts", note: "función genSeries() (números al azar)" },
  "formula-palabras": { file: "src/lib/content/static.ts", note: "lista COMPOUNDS · operaciones en generators.ts" },
  cultura: { file: "src/lib/content/static.ts", note: "listas CULTURA y COUNTRIES" },
  memoria: { file: "src/lib/generators.ts", note: "función genMemory()" },
  busqueda: { file: "src/lib/content/extras.ts", note: "lista FRIDGE_CLUES (12 pistas de la nevera)" },
  "quien-soy": { file: "src/lib/content/static.ts", note: "lista QUIEN_SOY" },
};

const sourceOf = (slug: string) => SOURCE[slug] ?? SOURCE[slug.replace("_", "-")] ?? null;

type Editable = { title: string; prompt: string; answer: string; hint: string; judgeNote: string };

export default function JudgeEditPage() {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState("");
  const [playerFilter, setPlayerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [search, setSearch] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/fixed-state", { cache: "no-store" });
    if (!res.ok) {
      setError("No se pudo cargar la partida. ¿Preparaste la base de datos en /setup?");
      return;
    }
    setState((await res.json()) as GameState);
    setError("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const types = useMemo(() => {
    if (!state) return [];
    const map = new Map<string, string>();
    for (const p of state.players) {
      for (const t of p.tasks) map.set(t.typeSlug, `${t.icon} ${t.typeName}`);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [state]);

  const rows = useMemo(() => {
    if (!state) return [];
    const q = search.trim().toLocaleLowerCase("es");
    const out: { player: PlayerRow; task: TaskRow }[] = [];
    for (const player of state.players) {
      if (playerFilter !== "all" && String(player.id) !== playerFilter) continue;
      for (const task of player.tasks) {
        if (typeFilter !== "all" && task.typeSlug !== typeFilter) continue;
        if (onlyEdited && !task.edited) continue;
        if (
          q &&
          !`${task.title} ${task.prompt} ${task.answer} ${task.typeName} ${player.name} ${task.cardNumber}`
            .toLocaleLowerCase("es")
            .includes(q)
        )
          continue;
        out.push({ player, task });
      }
    }
    return out.sort((a, b) => a.task.cardNumber - b.task.cardNumber);
  }, [state, playerFilter, typeFilter, onlyEdited, search]);

  /** Devuelve una prueba al texto original del plan fijo. */
  async function restore(task: TaskRow) {
    setRestoring(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}/restore`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo restaurar");
      await load();
      setDraft(null);
      setOpenId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restaurar");
    } finally {
      setRestoring(false);
    }
  }

  function open(task: TaskRow) {
    if (openId === task.id) {
      setOpenId(null);
      setDraft(null);
      return;
    }
    setOpenId(task.id);
    setDraft({
      title: task.title,
      prompt: task.prompt,
      answer: task.answer,
      hint: task.hint,
      judgeNote: task.judgeNote,
    });
  }

  async function save(task: TaskRow) {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar");
      // Recargar desde el servidor para que el marcador de «editada» sea exacto.
      await load();
      setSavedId(task.id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-slate-400">
        {error || "Cargando las 420 pruebas…"}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link href="/judge" className="text-sm text-slate-500 hover:text-slate-300">
        ← Panel de jueces
      </Link>

      <h1 className="mt-3 text-3xl font-black">✏️ Editar preguntas y respuestas</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">
        Las <strong>420 pruebas</strong> con su texto actual. Edita lo que quieras y pulsa Guardar:
        se guarda en la base de datos y se aplica al momento.
      </p>
      <p className="mt-2 max-w-3xl rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-cyan-100/80">
        🔒 Cambiar un texto <strong>no altera los números de tarjeta ni los recorridos</strong>: lo
        que ya hayas impreso sigue siendo válido. Solo cambia la pregunta y su respuesta.
      </p>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <select
          value={playerFilter}
          onChange={(e) => setPlayerFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="all">Los 28 jugadores</option>
          {state.players.map((p) => (
            <option key={p.id} value={String(p.id)}>
              J{String(p.slot).padStart(2, "0")} · {p.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="all">Los 15 tipos de prueba</option>
          {types.map(([slug, label]) => (
            <option key={slug} value={slug}>
              {label}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔎 Buscar texto, nº de tarjeta…"
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-fuchsia-400"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={onlyEdited}
            onChange={(e) => setOnlyEdited(e.target.checked)}
            className="h-4 w-4 accent-fuchsia-500"
          />
          Ver solo las que he modificado
        </label>
        <p className="text-xs text-slate-500">
          Mostrando {rows.length} de 420
          {state.game.editedCount > 0 && (
            <span className="ml-2 rounded-full bg-fuchsia-500/15 px-2 py-0.5 font-semibold text-fuchsia-300">
              ✏️ {state.game.editedCount} modificada{state.game.editedCount === 1 ? "" : "s"}
            </span>
          )}
        </p>
      </div>

      <div className="mt-3 grid gap-2">
        {rows.map(({ player, task }) => {
          const isOpen = openId === task.id;
          const dirty =
            draft &&
            (draft.title !== task.title ||
              draft.prompt !== task.prompt ||
              draft.answer !== task.answer ||
              draft.hint !== task.hint ||
              draft.judgeNote !== task.judgeNote);
          const src = sourceOf(task.typeSlug);

          return (
            <article
              key={task.id}
              className={`rounded-2xl border bg-slate-900/60 ${
                isOpen ? "border-fuchsia-400/50" : "border-slate-800"
              }`}
            >
              <button
                onClick={() => open(task)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="w-16 shrink-0 font-mono text-lg font-black text-fuchsia-300">
                  #{String(task.cardNumber).padStart(2, "0")}
                </span>
                <span className="text-2xl">{task.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{task.title}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {player.emoji} {player.name} · paso {task.stepIndex + 1}/15 ·{" "}
                    {task.typeName}
                    {task.requiresJudge && <span className="ml-1 text-amber-300">· juez</span>}
                  </span>
                </span>
                {task.edited && (
                  <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
                    editada
                  </span>
                )}
                <span className="shrink-0 font-mono text-xs text-slate-600">
                  {task.answer ? task.answer.split("|")[0] : "⚠ sin respuesta"}
                </span>
                <span className="shrink-0 text-slate-500">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && draft && (
                <div className="grid gap-3 border-t border-slate-800 p-4">
                  <Field label="Título (se ve en el tablero)">
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
                    />
                  </Field>

                  <Field label="Pregunta / enunciado (lo que lee el jugador)">
                    <textarea
                      value={draft.prompt}
                      onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                      rows={Math.min(14, Math.max(4, draft.prompt.split("\n").length + 2))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm leading-relaxed"
                    />
                  </Field>

                  <Field
                    label={
                      task.requiresJudge
                        ? "Palabra secreta que da el juez"
                        : "Respuesta correcta"
                    }
                  >
                    <input
                      value={draft.answer}
                      onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                      placeholder="Escribe aquí la respuesta"
                      className="w-full rounded-lg border border-emerald-500/40 bg-slate-950 px-3 py-2 font-mono text-sm font-bold text-emerald-300"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Acepta variantes separadas por «|» (p. ej. <code>titanic|el titanic</code>).
                      No distinguen mayúsculas ni acentos.
                    </p>
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Pista (opcional)">
                      <input
                        value={draft.hint}
                        onChange={(e) => setDraft({ ...draft, hint: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      />
                    </Field>
                    <Field label="Nota solo para jueces (opcional)">
                      <input
                        value={draft.judgeNote}
                        onChange={(e) => setDraft({ ...draft, judgeNote: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>

                  {task.meta?.profile && (
                    <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-cyan-100/80">
                      💡 Prueba de <strong>interacción social</strong>. Escribe aquí la pregunta que
                      traigas de tu encuesta y su respuesta, igual que en el resto de pruebas. El
                      enunciado original habla de la ficha de otro jugador: sustitúyelo por tu
                      pregunta.
                    </p>
                  )}

                  {src && (
                    <p className="text-[11px] text-slate-600">
                      📄 Original en el código: <code>{src.file}</code> · {src.note}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void save(task)}
                      disabled={saving || !dirty}
                      className="rounded-xl bg-fuchsia-500 px-5 py-2.5 font-bold text-white disabled:opacity-40"
                    >
                      {saving ? "Guardando…" : savedId === task.id ? "Guardado ✓" : "Guardar"}
                    </button>
                    <button
                      onClick={() =>
                        setDraft({
                          title: task.title,
                          prompt: task.prompt,
                          answer: task.answer,
                          hint: task.hint,
                          judgeNote: task.judgeNote,
                        })
                      }
                      disabled={!dirty}
                      className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 disabled:opacity-40"
                    >
                      Deshacer cambios
                    </button>
                    {task.edited && (
                      <button
                        onClick={() => void restore(task)}
                        disabled={restoring}
                        className="rounded-xl border border-amber-500/40 px-4 py-2.5 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
                        title="Devuelve esta prueba al texto del plan original"
                      >
                        {restoring ? "Restaurando…" : "↺ Restaurar original"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {rows.length === 0 && (
        <p className="mt-10 text-center text-slate-500">Ninguna prueba coincide con el filtro.</p>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}
