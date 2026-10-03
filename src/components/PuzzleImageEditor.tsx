"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const MAX_UPLOAD = 3 * 1024 * 1024;

export default function PuzzleImageEditor() {
  const [count, setCount] = useState(28);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/judge/puzzle-image", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) throw new Error(data?.error ?? "No se pudo consultar la foto.");
        if (active) {
          setCount(data.count);
          setUploadedCount(data.uploadedCount);
          setCurrentUrl(data.imageUrl);
        }
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "No se pudo consultar la foto.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setBroken(false);
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(next: File | undefined) {
    setError("");
    setNotice("");
    setFile(null);
    if (!next) return;
    if (next.size > MAX_UPLOAD) {
      setError("La foto debe ocupar como máximo 3 MB. Exporta una copia JPG más pequeña.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setError("Usa una foto JPG, PNG o WebP; no se admiten PDF ni HEIC.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(next);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!file || saving) return;
    if (!window.confirm(`¿Usar esta foto en los ${count} puzzles? Solo se cambia la imagen, no las tarjetas ni el progreso.`)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch("/api/judge/puzzle-image", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error ?? "No se pudo guardar la foto. Revisa la conexión y el tamaño del archivo.");
      setCurrentUrl(`${data.imageUrl}?v=${Date.now()}`);
      setCount(data.count);
      setUploadedCount(data.count);
      setFile(null);
      setBroken(false);
      if (inputRef.current) inputRef.current.value = "";
      setNotice(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la foto.");
    } finally {
      setSaving(false);
    }
  }

  const imageUrl = preview ?? currentUrl;

  return (
    <section id="puzzle-photo" className="mt-6 rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 sm:p-5">
      <h2 className="text-lg font-black text-cyan-200">🖼️ Foto del puzzle</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
        Selecciona tu foto original. Se guardará en la base de datos del juego para los {count} puzzles,
        sin cambiar preguntas, respuestas, recorridos ni progreso. No tendrás que subir el JPG a GitHub.
      </p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row">
        <div className="flex min-h-36 w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-950 p-2 sm:w-40 sm:shrink-0">
          {imageUrl && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imageUrl}
              src={imageUrl}
              onError={() => setBroken(true)}
              alt={file ? "Vista previa de la foto seleccionada" : "Foto actual del puzzle"}
              className="max-h-56 w-full rounded-lg object-contain"
            />
          ) : (
            <p className="px-3 py-5 text-center text-xs leading-relaxed text-slate-500">
              {loading ? "Cargando foto…" : "No se puede ver la foto actual. Selecciona el archivo original para repararla."}
            </p>
          )}
        </div>
        <form onSubmit={(event) => void save(event)} className="flex min-w-0 flex-1 flex-col justify-center gap-3">
          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Seleccionar foto original (JPG, PNG o WebP · máximo 3 MB)
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => choose(event.target.files?.[0])}
              disabled={saving}
              className="w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500/15 file:px-3 file:py-2 file:font-semibold file:text-cyan-200"
            />
          </label>
          <button
            type="submit"
            disabled={!file || saving || loading || count === 0 || broken}
            className="w-fit rounded-xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Guardando foto…" : `Guardar foto para los ${count} puzzles`}
          </button>
          <p className="text-xs text-slate-500">
            {file ? "La vista previa aún no está guardada. Pulsa el botón para aplicarla." : uploadedCount > 0 ? `Foto guardada en ${uploadedCount} puzzles. Los jugadores la verán al recargar su tarjeta.` : "Las rutas de las fotos antiguas siguen funcionando si sus archivos están publicados."}
          </p>
        </form>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">✓ {notice}</p>}
    </section>
  );
}
