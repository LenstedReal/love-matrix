import Link from "next/link";

export default function NotFound() {
  return (
    <main className="nf">
      <span className="eyebrow eyebrow--center">404 · SİNYAL KAYBOLDU</span>
      <div className="nf-heart" aria-hidden="true">♥</div>
      <h1>Bu koordinat<br /><em>henüz yok.</em></h1>
      <p>Aradığın evren burada görünmüyor. Sinyali ana merkeze yönlendirelim.</p>
      <Link className="btn btn--ruby" href="/">Ana merkeze dön ↗</Link>
    </main>
  );
}
