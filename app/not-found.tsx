import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="not-found__code">404 / SIGNAL LOST</span>
      <div className="not-found__heart">♥</div>
      <h1>Bu koordinat<br/><em>henüz yok.</em></h1>
      <p>Aradığın evren burada görünmüyor. Sinyali yeniden ana merkeze yönlendirelim.</p>
      <Link href="/">Ana merkeze dön ↗</Link>
    </main>
  );
}
