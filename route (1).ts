export const dynamic = "force-dynamic";

/** Lista numero,url para grabar los NFC: /api/cards-export?n=420&base=https://tudominio.com */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const n = Math.min(2000, Math.max(1, Number(url.searchParams.get("n")) || 420));
  const base = (url.searchParams.get("base") || url.origin).replace(/\/$/, "");

  const lines = ["numero,url"];
  for (let i = 1; i <= n; i += 1) lines.push(`${i},${base}/c/${i}`);

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tarjetas-nfc-${n}.csv"`,
    },
  });
}
