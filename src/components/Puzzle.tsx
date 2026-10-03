"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Este componente es autocontenido: sus funciones de tablero están aquí para no
 * depender de un archivo auxiliar al copiarlo a GitHub. Ruta del componente:
 * src/components/Puzzle.tsx (no Puzzle.tsx en la raíz del repositorio).
 * Las funciones se exportan también para las pruebas y para imports antiguos.
 */
export function isPuzzleSolved(tiles: readonly number[]): boolean {
  return tiles.length > 0 && tiles.every((value, index) => value === index);
}

export function swapPuzzleTiles(tiles: readonly number[], a: number, b: number): number[] {
  const next = [...tiles];
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= next.length || b >= next.length) return next;
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/**
 * Baraja TODAS las piezas: ninguna llega colocada de antemano. No existe ninguna
 * ayuda que coloque piezas solas, para que solo se resuelva por intercambio manual.
 */
export function scrambledPuzzleTiles(total: number, random = Math.random): number[] {
  const tiles = Array.from({ length: total }, (_, i) => i);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (total > 1 && isPuzzleSolved(tiles)) [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
  return tiles;
}

type ImageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; src: string; width: number; height: number };

type Props = {
  image: string;
  size: number;
  word: string;
  onSolved: (word: string) => Promise<boolean>;
};

/** La referencia y las 64 piezas comparten una única imagen ya descargada y decodificada. */
export default function Puzzle({ image, size, word, onSolved }: Props) {
  const gridSize = Number.isInteger(size) && size >= 2 && size <= 12 ? size : 8;
  const total = gridSize * gridSize;
  const [tiles, setTiles] = useState(() => scrambledPuzzleTiles(total));
  const [selected, setSelected] = useState<number | null>(null);
  const [showFullRef, setShowFullRef] = useState(false);
  const [imageState, setImageState] = useState<ImageState>({ status: "loading" });
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const submitted = useRef(false);
  const solved = isPuzzleSolved(tiles);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let objectUrl: string | undefined;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    setImageState({ status: "loading" });
    setSelected(null);

    async function loadPhoto() {
      try {
        if (!image) throw new Error("Esta prueba aún no tiene una foto asignada.");
        const response = await fetch(image, {
          signal: controller.signal,
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) {
          throw new Error(response.status === 404
            ? "La foto no está publicada en esta web (archivo no encontrado)."
            : "El servidor no ha podido entregar la foto.");
        }
        const blob = await response.blob();
        if (!/^image\/(jpeg|png|webp|avif)$/i.test(blob.type) || blob.size === 0) {
          throw new Error("El enlace de la foto no está devolviendo una imagen válida.");
        }
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        const photo = new window.Image();
        photo.src = objectUrl;
        await photo.decode();
        if (!photo.naturalWidth || !photo.naturalHeight) throw new Error("No se puede leer esta imagen.");
        if (active && !controller.signal.aborted) {
          setImageState({ status: "ready", src: objectUrl, width: photo.naturalWidth, height: photo.naturalHeight });
        } else if (active) {
          setImageState({ status: "error", message: "La foto tarda demasiado en cargar. Comprueba tu conexión y vuelve a intentarlo." });
        }
      } catch (error) {
        if (active) {
          setImageState({
            status: "error",
            message: controller.signal.aborted
              ? "La foto tarda demasiado en cargar. Comprueba tu conexión y vuelve a intentarlo."
              : error instanceof Error ? error.message : "No se pudo cargar la foto del puzzle.",
          });
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void loadPhoto();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image, reload]);

  const complete = useCallback(async () => {
    setSaveError(false);
    setSaving(true);
    try {
      const ok = await onSolved(word);
      if (!ok) setSaveError(true);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [onSolved, word]);

  useEffect(() => {
    if (solved && imageState.status === "ready" && !submitted.current) {
      submitted.current = true;
      void complete();
    }
  }, [solved, imageState.status, complete]);

  function tap(index: number) {
    if (solved || imageState.status !== "ready") return;
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected !== index) setTiles((previous) => swapPuzzleTiles(previous, selected, index));
    setSelected(null);
  }

  if (imageState.status === "loading") {
    return (
      <div role="status" className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/70 p-8 text-center">
        <span className="mx-auto mb-4 block h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        <p className="font-semibold text-slate-200">Cargando la foto del puzzle…</p>
        <p className="mt-2 text-xs text-slate-500">El tablero aparecerá cuando la imagen esté lista.</p>
      </div>
    );
  }

  if (imageState.status === "error") {
    return (
      <div role="alert" className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6 text-center">
        <p className="text-3xl" aria-hidden="true">🖼️</p>
        <h2 className="mt-3 text-lg font-bold text-amber-200">No se ha podido cargar la foto</h2>
        <p className="mt-2 text-sm text-slate-300">{imageState.message}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Si persiste, avisa al juez: puede subir la foto en «Editar preguntas → Foto del puzzle».
          Tu recorrido no se ha reiniciado.
        </p>
        <button
          type="button"
          onClick={() => setReload((value) => value + 1)}
          className="mt-4 rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-400"
        >
          Reintentar cargar la foto
        </button>
      </div>
    );
  }

  const { src, width, height } = imageState;
  const correct = tiles.filter((value, index) => value === index).length;

  return (
    <div className="mt-4 rounded-2xl bg-slate-950/70 p-3 sm:p-4" data-testid="puzzle">
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setShowFullRef((value) => !value)}
          aria-expanded={showFullRef}
          aria-controls="puzzle-reference"
          aria-label={showFullRef ? "Ocultar foto ampliada" : "Ampliar foto de referencia"}
          className="relative w-24 shrink-0 overflow-hidden rounded-xl border-2 border-fuchsia-500/50 bg-slate-950 pb-6 hover:border-fuchsia-300 sm:w-36"
        >
          {/* La misma fotografía, completa, sin el recorte cuadrado de object-cover. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={width} height={height} alt="Foto objetivo del puzzle" className="block h-auto w-full object-contain" />
          <span className="absolute inset-x-0 bottom-0 py-1 text-[10px] font-bold text-fuchsia-200">
            {showFullRef ? "Ocultar" : "Ampliar 🔍"}
          </span>
        </button>
        <div className="min-w-0 flex-1 text-xs text-slate-300">
          <h2 className="font-black text-fuchsia-300">Foto objetivo</h2>
          <p className="mt-1 leading-relaxed text-slate-400">
            Toca dos piezas para intercambiarlas. La foto de referencia se ve entera y puedes ampliarla.
          </p>
          <p className="mt-3 inline-block rounded-lg border border-emerald-500/30 bg-slate-950 px-2 py-1.5 font-mono font-bold text-emerald-300" aria-live="polite">
            ✓ {correct}/{total} casillas
          </p>

        </div>
      </div>

      {showFullRef && (
        <div id="puzzle-reference" className="mt-3 rounded-xl border border-fuchsia-400 bg-slate-900 p-2 text-center">
          <p className="mb-2 text-xs font-semibold text-fuchsia-200">Foto completa de referencia</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={width} height={height} alt="Foto completa ampliada" className="mx-auto h-auto max-h-[70vh] w-full rounded-lg object-contain" />
        </div>
      )}

      <div
        data-testid="puzzle-board"
        aria-label={`Puzzle de ${gridSize} por ${gridSize} piezas`}
        className="mt-3 grid w-full gap-px overflow-hidden rounded-lg border border-slate-700 bg-slate-700 p-px"
        style={{
          aspectRatio: `${width} / ${height}`,
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {tiles.map((tile, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Casilla ${index + 1}${tile === index ? ", en su sitio" : ""}`}
            aria-pressed={selected === index}
            disabled={solved}
            onClick={() => tap(index)}
            className={`min-h-0 min-w-0 touch-manipulation bg-no-repeat p-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-white ${
              selected === index ? "z-10 ring-2 ring-inset ring-fuchsia-400" : tile === index ? "ring-1 ring-inset ring-emerald-400/40" : ""
            }`}
            style={{
              backgroundImage: `url("${src}")`,
              backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
              backgroundPosition: `${((tile % gridSize) / (gridSize - 1)) * 100}% ${(Math.floor(tile / gridSize) / (gridSize - 1)) * 100}%`,
            }}
          />
        ))}
      </div>

      {solved ? (
        <div role="status" className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <p className="font-bold text-emerald-200">🎉 ¡Puzzle completado!</p>
          <p className="mt-1 text-sm text-emerald-100/70">
            {saving ? "Comprobando y guardando…" : saveError ? "No se pudo confirmar. Tus piezas siguen ordenadas." : "Puzzle enviado."}
          </p>
          {saveError && <button type="button" onClick={() => void complete()} disabled={saving} className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950">Reintentar envío</button>}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-3 text-center text-xs leading-relaxed text-slate-400">
          Todas las piezas están barajadas y no hay ayudas: hay que ordenarlas a mano.
          <br />
          Si te atasca, avisa a un <strong className="text-slate-300">juez</strong>: puede validar
          esta prueba desde su panel.
        </p>
      )}
    </div>
  );
}
