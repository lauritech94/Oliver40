"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Counts = { players: number; tasks: number; cards: number } | null;

type Status = {
  databaseUrl: boolean;
  tables: boolean;
  seeded: boolean;
  planVersion: string | null;
  counts: Counts;
  error?: string;
};

export default function SetupPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/setup", { cache: "no-store" });
      setStatus((await res.json()) as Status);
    } catch {
      setError("No se pudo contactar con el servidor.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function install() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo preparar la base de datos.");
      setMessage("¡Listo! La base de datos está preparada.");
      setStatus(data.status as Status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const ok = status?.seeded && status?.tables;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
        ← Inicio
      </Link>

      <h1 className="mt-4 text-3xl font-black">🛠️ Preparar la base de datos</h1>
      <p className="mt-2 text-slate-400">
        Crea las tablas y siembra la partida fija: <strong>28 jugadores</strong> y{" "}
        <strong>420 tarjetas</strong>. Es seguro pulsarlo varias veces; nunca cambia los recorridos
        ya asignados.
      </p>

      {error && (
        <p className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {message}
        </p>
      )}

      <div className="mt-6 grid gap-2">
        <Check done={Boolean(status?.databaseUrl)} label="Variable DATABASE_URL configurada">
          Si falta: en Vercel → tu proyecto → Settings → Environment Variables, añade{" "}
          <code className="rounded bg-slate-800 px-1">DATABASE_URL</code> con la cadena de Neon y
          vuelve a desplegar.
        </Check>
        <Check done={Boolean(status?.tables)} label="Tablas creadas">
          Se crean al pulsar el botón de abajo.
        </Check>
        <Check done={Boolean(status?.seeded)} label="28 jugadores y 420 tarjetas sembrados">
          Se rellenan al pulsar el botón de abajo.
        </Check>
      </div>

      {status?.counts && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Jugadores" value={status.counts.players} expected={28} />
          <Stat label="Pruebas" value={status.counts.tasks} expected={420} />
          <Stat label="Tarjetas únicas" value={status.counts.cards} expected={420} />
        </div>
      )}

      {ok ? (
        <div className="mt-7 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 font-bold text-emerald-200">
            Todo preparado {status?.planVersion ? `· plan ${status.planVersion}` : ""}
          </p>
          <p className="mt-1 text-sm text-emerald-100/70">
            Ya puedes imprimir el material y grabar los NFC.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/judge/print"
              className="rounded-xl bg-fuchsia-500 px-5 py-3 font-bold text-white"
            >
              🖨️ Imprimir material
            </Link>
            <Link
              href="/judge/links"
              className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-200"
            >
              🔗 Enlaces de prueba
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={() => void install()}
          disabled={busy || !status?.databaseUrl}
          className="mt-7 w-full rounded-xl bg-fuchsia-500 px-6 py-5 text-lg font-black text-white shadow-lg shadow-fuchsia-500/25 disabled:opacity-40"
        >
          {busy ? "Preparando…" : "▶ Preparar base de datos ahora"}
        </button>
      )}

      <details className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-400">
          ¿Prefieres hacerlo desde la terminal?
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
{`# en la carpeta del proyecto
npm install
echo 'DATABASE_URL=tu-cadena-de-neon' > .env
npm run db:setup`}
        </pre>
        <p className="mt-2 text-xs text-slate-500">
          Las dos formas hacen exactamente lo mismo.
        </p>
      </details>
    </main>
  );
}

function Check({
  done,
  label,
  children,
}: {
  done: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        done ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <p className="font-semibold">
        <span className={done ? "text-emerald-400" : "text-slate-500"}>
          {done ? "✓" : "○"}
        </span>{" "}
        {label}
      </p>
      {!done && <p className="mt-1 text-xs text-slate-500">{children}</p>}
    </div>
  );
}

function Stat({ label, value, expected }: { label: string; value: number; expected: number }) {
  const good = value === expected;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-center">
      <p
        className={`text-2xl font-black tabular-nums ${good ? "text-emerald-300" : "text-slate-400"}`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
      {!good && <p className="mt-0.5 text-[10px] text-amber-400">esperado {expected}</p>}
    </div>
  );
}
