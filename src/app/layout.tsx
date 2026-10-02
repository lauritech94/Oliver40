import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gymkhana NFC · 28 recorridos fijos",
  description:
    "Una sola gymkhana fija: 28 jugadores, 15 pruebas por persona y 420 tarjetas NFC exclusivas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-fuchsia-500/40">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(168,85,247,0.22),transparent_60%),radial-gradient(60%_40%_at_10%_100%,rgba(34,211,238,0.14),transparent_60%)]" />
        {children}
      </body>
    </html>
  );
}
