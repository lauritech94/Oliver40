"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-fit rounded-xl bg-fuchsia-600 px-5 py-3 font-bold text-white"
    >
      🖨️ Imprimir / guardar como PDF
    </button>
  );
}
