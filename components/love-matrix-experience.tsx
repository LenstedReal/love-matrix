"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import BootOverlay from "@/components/boot-overlay";
import ImmersiveLoveSequence from "@/components/immersive-love-sequence";
import RubyHeartCanvas, { type RubyHeartHandle } from "@/components/ruby-heart-canvas";
import TerminalGate from "@/components/terminal-gate";
import { sfx } from "@/lib/audio";
import { PHRASES, PHRASE_KEYS, RTL_KEYS } from "@/lib/phrases";

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x=".5" y=".5" width="39" height="39" rx="12" stroke="url(#bm-line)" />
      <path d="M20 30.4 9.6 20.6c-6-6.2 3.7-14.3 10.4-6.9 6.7-7.4 16.4.7 10.4 6.9L20 30.4Z" fill="url(#bm-fill)" />
      <path d="M9.8 20.2h5.5l2.7-5.1 3.9 10.6 2.8-5.5h5.4" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      <defs>
        <linearGradient id="bm-fill" x1="6" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#ff7aa6" /><stop offset="1" stopColor="#c8103f" /></linearGradient>
        <linearGradient id="bm-line" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#e8c39e" stopOpacity=".7" /><stop offset="1" stopColor="#e8c39e" stopOpacity=".1" /></linearGradient>
      </defs>
    </svg>
  );
}

const STEPS = [
  { n: "01", title: "Komut", code: "sudo su - kalbin", body: "Kalbimin sistemine tam yetkiyle girmeyi dene. Kapı tek bir komutla açılır." },
  { n: "02", title: "Parola", code: "[sudo] password: ••••••", body: "Parolayı yalnızca sen bilirsin. Yanlış girersen sistem sana küçük bir ipucu fısıldar." },
  { n: "03", title: "Okuma / yazma izni", code: "chmod +rw /dev/kalp", body: "Kalbimi okumana ve ona yazmana izin ver. Tek kelime yeter: yes." },
  { n: "04", title: "Çekirdek", code: "3 · 2 · 1 → YOU ARE MY LOVE", body: "Geri sayım, parçacıklardan bir kalp ve tek bir cümle: I love you sevgilim." },
];

function Marquee() {
  const rows = [PHRASE_KEYS.slice(0, 34), PHRASE_KEYS.slice(34, 67), PHRASE_KEYS.slice(67)];
  return (
    <div className="marquee" aria-hidden="true">
      {rows.map((row, r) => (
        <div className={`marquee-row${r % 2 ? " is-rev" : ""}`} key={r} style={{ animationDuration: `${70 + r * 12}s` }}>
          {[0, 1].map((copy) => (
            <div className="marquee-track" key={copy}>
              {row.map((k) => (
                <span className="marquee-item" key={k}>
                  <span className="marquee-phrase" lang={PHRASES[k].v} dir={RTL_KEYS.has(k) ? "rtl" : "ltr"}>{PHRASES[k].text}</span>
                  <span className="marquee-lang">{PHRASES[k].tr}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LoveMatrixExperience() {
  const [open, setOpen] = useState(false);
  const start = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const heart = useRef<RubyHeartHandle>(null);

  const tapHeart = () => {
    heart.current?.nextMode();
    sfx("heartbeat");
  };

  return (
    <>
      <BootOverlay />
      <div className="lm" id="top">
        <header className="nav">
          <a className="brand" href="#top" aria-label="Love Matrix ana sayfa">
            <BrandMark />
            <span className="brand-copy"><strong>LOVE MATRIX</strong><small>A UNIVERSE FOR ONE</small></span>
          </a>
          <nav className="nav-links" aria-label="Ana gezinme">
            <a href="#protokol">Protokol</a>
            <a href="#erisim">Erişim</a>
            <Link href="/100-dil">100 dil</Link>
          </nav>
          <a className="nav-cta" href="#erisim">Kalbe bağlan <span aria-hidden="true">↗</span></a>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow"><span className="dot" /> PRIVATE SIGNAL · 001 <span className="sep" /> ONLY ONE ACCESS</p>
              <h1>Bir kalp.<br /><em>Sonsuz</em> bir evren.</h1>
              <p className="lede">Bazı kapılar anahtarla değil, doğru hisle açılır. Bu küçük evren tek bir kişiye ayrıldı. Komutu yaz, parolanı gir, kalbe gir.</p>
              <div className="cta-row">
                <a className="btn btn--ruby" href="#erisim">Erişimi başlat <span aria-hidden="true">↗</span></a>
                <Link className="btn btn--ghost" href="/100-dil">100 dilde dinle</Link>
              </div>
              <dl className="hero-stats">
                <div><dt>001</dt><dd>TEK ALICI</dd></div>
                <div><dt>100</dt><dd>DİL · TEK CÜMLE</dd></div>
                <div><dt>∞</dt><dd>SÜRESİZ</dd></div>
              </dl>
            </div>
            <figure className="hero-visual">
              <RubyHeartCanvas ref={heart} className="hero-heart" fill={0.74} onTap={tapHeart} label="Kalbe dokun: kalbin rengi değişir" />
              <figcaption>
                <span>FIG. 001 — KALBİN ÇEKİRDEĞİ</span>
                <span className="bpm"><i aria-hidden="true">♥</i> 70 BPM</span>
              </figcaption>
            </figure>
          </section>

          <section className="protocol" id="protokol">
            <div className="section-head">
              <p className="eyebrow"><span className="dot" /> PROTOKOL · 4 ADIM</p>
              <h2>Kalbe giden yol<br /><em>dört adım</em> sürer.</h2>
            </div>
            <ol className="steps">
              {STEPS.map((s) => (
                <li className="step" key={s.n}>
                  <span className="step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <code>{s.code}</code>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="access" id="erisim">
            <div className="access-copy">
              <p className="eyebrow"><span className="dot" /> ERİŞİM · TERMINAL</p>
              <h2>Hazır olduğunda,<br /><em>kalbe gir.</em></h2>
              <p>Terminal açık. Komutu yaz, parolayla kendini doğrula ve kalbe okuma/yazma izni ver. Gerisini çekirdek halleder.</p>
              <ul className="access-notes">
                <li><span>⌨</span> Telefonda komutu tek dokunuşla yazdırabilirsin.</li>
                <li><span>♪</span> Sesi aç: sahne müziğin vuruşlarıyla oynar.</li>
                <li><span>i</span> Bu romantik bir oyundur, gerçek bir güvenlik sistemi değildir.</li>
              </ul>
            </div>
            <div className="access-terminal">
              <TerminalGate onStartSequence={start} />
            </div>
          </section>

          <section className="langs" id="diller">
            <div className="section-head section-head--row">
              <div>
                <p className="eyebrow"><span className="dot" /> 100 DİL · TEK CÜMLE</p>
                <h2>Aynı cümle,<br /><em>yüz farklı sesle.</em></h2>
              </div>
              <Link className="btn btn--ghost" href="/100-dil">Hepsini dinle <span aria-hidden="true">→</span></Link>
            </div>
            <Marquee />
          </section>

          <section className="closing">
            <span className="closing-mark" aria-hidden="true">♥</span>
            <p className="eyebrow eyebrow--center">A SMALL UNIVERSE, WITH A BIG FEELING</p>
            <h2>Bütün yollar<br /><em>sana çıkar.</em></h2>
            <a className="btn btn--ruby" href="#erisim">Kalbe bağlan <span aria-hidden="true">↗</span></a>
          </section>
        </main>

        <footer className="foot">
          <a className="brand" href="#top"><BrandMark /><span className="brand-copy"><strong>LOVE MATRIX</strong><small>A UNIVERSE FOR ONE</small></span></a>
          <span className="foot-mid">DESIGNED WITH FEELING <i>♥</i> BUILT FOR ONE</span>
          <span className="foot-right">© 2026 LENSTEDREAL <a href="#top" aria-label="Başa dön">↑</a></span>
        </footer>
      </div>
      <ImmersiveLoveSequence active={open} onClose={close} />
    </>
  );
}
