"use client";

import { useCallback, useEffect, useState } from "react";
import AmbientCanvas from "@/components/ambient-canvas";
import BootOverlay from "@/components/boot-overlay";
import EyePortal from "@/components/eye-portal";
import ImmersiveLoveSequence from "@/components/immersive-love-sequence";
import TerminalGate from "@/components/terminal-gate";

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x=".5" y=".5" width="43" height="43" rx="14" fill="#171622" />
      <path d="M22 32.7 10.4 21.8C3.7 14.9 14.5 5.9 22 14.1c7.5-8.2 18.3.8 11.6 7.7L22 32.7Z" fill="url(#brandHeart)" />
      <path d="M10.6 22h6.2l3.1-5.8 4.4 12 3.2-6.2h6" stroke="#fff" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <defs><linearGradient id="brandHeart" x1="5" y1="9" x2="36" y2="34" gradientUnits="userSpaceOnUse"><stop stopColor="#FF6C9F"/><stop offset="1" stopColor="#8D8DFF"/></linearGradient></defs>
    </svg>
  );
}

function ArrowUpRight() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4.5 15.5 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function SignalIcon({ type }: { type: "lock" | "heart" | "orbit" }) {
  if (type === "lock") return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="6.5" y="13" width="19" height="14" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M11 13V9a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="20" r="1.5" fill="currentColor"/></svg>;
  if (type === "heart") return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27S4 19.8 4 11.4C4 4.7 12 3 16 9c4-6 12-4.3 12 2.4C28 19.8 16 27 16 27Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 16h6l2.5-4 3.5 8 2.2-4H26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><ellipse cx="16" cy="16" rx="13" ry="5.5" stroke="currentColor" strokeWidth="1.4" transform="rotate(-35 16 16)"/><ellipse cx="16" cy="16" rx="13" ry="5.5" stroke="currentColor" strokeWidth="1.4" transform="rotate(52 16 16)"/><circle cx="16" cy="16" r="2.7" fill="currentColor"/></svg>;
}

export default function LoveMatrixExperience() {
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const startSequence = useCallback(() => setSequenceOpen(true), []);
  const closeSequence = useCallback(() => setSequenceOpen(false), []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal-on-scroll");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <BootOverlay />
      <div className="site-shell">
        <header className="site-header">
          <a className="brand" href="#top" aria-label="Love Matrix ana sayfa">
            <BrandMark />
            <span className="brand-copy"><strong>LOVE MATRIX</strong><small>A UNIVERSE FOR ONE</small></span>
          </a>
          <nav className="main-nav" aria-label="Ana gezinme">
            <a href="#story">Hikâye</a>
            <a href="#signal">Evren</a>
            <a href="#access">Erişim protokolü</a>
          </nav>
          <a className="header-cta" href="#access"><span>Kalbe bağlan</span><ArrowUpRight /></a>
        </header>

        <main>
          <section className="hero-section" id="top">
            <AmbientCanvas />
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line"/><span>PRIVATE SIGNAL / 001</span><span className="eyebrow-dot"/> <span>ONLY ONE ACCESS</span></div>
              <h1>Bir kalp.<br/><em>Sonsuz</em> bir <span className="hero-title-last">evren.</span></h1>
              <p className="hero-lede">Bazı kapılar anahtarla değil, doğru hisle açılır. Bu küçük evren; biricik bir kalbe, tek bir kişiye ayrıldı.</p>
              <div className="hero-actions">
                <a className="button button--dark" href="#access"><span>Erişim başlat</span><ArrowUpRight /></a>
                <a className="text-link" href="#story"><span className="text-link__play">↓</span> Hikâyeyi keşfet</a>
              </div>
              <div className="hero-footnotes">
                <div><span className="footnote-index">01</span><span><strong>PRIVATE BY DESIGN</strong><small>Sana ait, sana özel.</small></span></div>
                <div><span className="footnote-index">∞</span><span><strong>NO EXPIRATION</strong><small>Hisler için zaman yok.</small></span></div>
              </div>
            </div>
            <div className="hero-visual-wrap">
              <EyePortal />
              <div className="hero-visual-caption"><span>FIG. 001</span><span>AN EYE INTO OUR UNIVERSE</span><span>↘</span></div>
            </div>
            <div className="hero-side-label">DESIGNED WITH FEELING <span>✳</span> BUILT FOR ONE</div>
            <div className="hero-bottom-rule"><span>SCROLL TO ENTER</span><span className="scroll-line"/><span>01 — 03</span></div>
          </section>

          <section className="manifesto-section" id="story">
            <div className="section-intro reveal-on-scroll">
              <div className="eyebrow eyebrow--dark"><span className="eyebrow-line"/><span>01 / THE IDEA</span></div>
              <h2>Bir dijital mektup.<br/><em>Biraz kod,</em> çokça kalp.</h2>
              <p>Bu bir uygulamadan fazlası. Eski terminal hissini, kozmik bir yolculuğu ve tek bir cümleyi aynı yerde buluşturan küçük bir dijital ritüel.</p>
            </div>
            <div className="manifesto-grid">
              <article className="manifesto-card manifesto-card--light reveal-on-scroll">
                <div className="card-topline"><span>01 / PROTOCOL</span><span>↗</span></div>
                <div className="manifesto-icon"><SignalIcon type="lock"/></div>
                <h3>Bir kapı, tek bir anahtar.</h3>
                <p>Terminalin her adımı, kalbe biraz daha yaklaşmak için tasarlandı. Komut senden, anlam bizden.</p>
                <div className="card-foot"><span className="mini-status mini-status--blue"/> AUTHENTICATION SEQUENCE</div>
              </article>
              <article className="manifesto-card manifesto-card--rose reveal-on-scroll">
                <div className="card-topline"><span>02 / CORE MEMORY</span><span>↗</span></div>
                <div className="manifesto-icon"><SignalIcon type="heart"/></div>
                <h3>Her şeyin merkezinde sen.</h3>
                <p>Parçacıklar bir kalbe dönüşürken, sistemin tek bir mesajı vardır: bütün yollar sana çıkar.</p>
                <div className="card-foot"><span className="mini-status mini-status--pink"/> HEARTBEAT DETECTED</div>
              </article>
              <article className="manifesto-card manifesto-card--dark reveal-on-scroll">
                <div className="card-topline"><span>03 / INFINITE LOOP</span><span>↗</span></div>
                <div className="manifesto-icon"><SignalIcon type="orbit"/></div>
                <h3>Sonu olmayan bir döngü.</h3>
                <p>Son sahne bittiğinde bile evren dönmeye devam eder. Çünkü bazı hislerin çıkış tuşu yoktur.</p>
                <div className="card-foot"><span className="mini-status mini-status--green"/> SERVICE: ALWAYS ON</div>
              </article>
            </div>
          </section>

          <section className="signal-section" id="signal">
            <div className="signal-backdrop" aria-hidden="true"><span/><span/><span/></div>
            <div className="signal-copy reveal-on-scroll">
              <div className="eyebrow eyebrow--light"><span className="eyebrow-line"/><span>02 / THE SIGNAL</span></div>
              <p className="signal-kicker">A MESSAGE BEYOND THE STARS</p>
              <h2>Sen yaklaştıkça,<br/><em>evren uyanır.</em></h2>
              <p className="signal-body">Bir göz açılır. Uzak bir galaksi dönmeye başlar. Ekranda binlerce parçacık bir araya gelir ve içlerinden yalnızca bir mesaj doğar.</p>
              <a className="signal-link" href="#access"><span>Bu yolculuğu başlat</span><ArrowUpRight /></a>
              <div className="signal-data"><div><strong>∞</strong><span>ENDLESS REPLAY</span></div><div><strong>001</strong><span>ONE RECIPIENT</span></div><div><strong>♥</strong><span>LIVE FROM THE CORE</span></div></div>
            </div>
            <div className="signal-visual reveal-on-scroll">
              <div className="blackhole-visual" aria-hidden="true">
                <div className="blackhole-visual__starfield" />
                <div className="blackhole-visual__ring blackhole-visual__ring--outer" />
                <div className="blackhole-visual__ring blackhole-visual__ring--middle" />
                <div className="blackhole-visual__disk" />
                <div className="blackhole-visual__core" />
                <div className="blackhole-visual__orbit-dot blackhole-visual__orbit-dot--one" />
                <div className="blackhole-visual__orbit-dot blackhole-visual__orbit-dot--two" />
                <div className="blackhole-visual__orbit-dot blackhole-visual__orbit-dot--three" />
                <div className="blackhole-visual__annotation blackhole-visual__annotation--top"><span>CORE SIGNAL</span><i>0.001 ms</i></div>
                <div className="blackhole-visual__annotation blackhole-visual__annotation--bottom"><span>GRAVITY: INFINITE</span><i>LOVE / UNBOUND</i></div>
              </div>
              <div className="signal-caption"><span>VISUAL STUDY / 002</span><span>GRAVITY HAS A NAME</span></div>
            </div>
          </section>

          <section className="access-section" id="access">
            <div className="access-topline"><div className="eyebrow eyebrow--dark"><span className="eyebrow-line"/><span>03 / THE ACCESS</span></div><span className="access-system-label"><i/> SYSTEM AVAILABLE · 24/7</span></div>
            <div className="access-layout">
              <div className="access-copy reveal-on-scroll">
                <div className="access-number">03<span>—</span>∞</div>
                <h2>Hazır olduğunda,<br/><em>kalbe gir.</em></h2>
                <p>Terminali aç. Komutunu yaz. Doğru parolayla çekirdeğe ulaş ve sistemin senin için hazırladığı son mesajı gör.</p>
                <div className="access-list">
                  <div><span className="access-list__number">01</span><span><strong>Connect</strong><small>Komut satırını başlat.</small></span><span className="access-list__status">READY</span></div>
                  <div><span className="access-list__number">02</span><span><strong>Authenticate</strong><small>Parolayla kendini doğrula.</small></span><span className="access-list__status">LOCKED</span></div>
                  <div><span className="access-list__number">03</span><span><strong>Feel everything</strong><small>Kalbin evrenini serbest bırak.</small></span><span className="access-list__status">WAITING</span></div>
                </div>
                <p className="access-disclaimer"><span>i</span> Bu terminal, romantik bir dijital deneyimin parçasıdır; gerçek hesap güvenliği sağlamaz.</p>
              </div>
              <div className="access-terminal-wrap reveal-on-scroll">
                <div className="terminal-orbit terminal-orbit--a"/><div className="terminal-orbit terminal-orbit--b"/>
                <TerminalGate onStartSequence={startSequence} />
                <div className="terminal-under-caption"><span>HEART.SYS / BUILD 001</span><span>MADE FOR ONE PERSON, WITH ALL THE FEELING.</span></div>
              </div>
            </div>
          </section>

          <section className="closing-section reveal-on-scroll">
            <div className="closing-mark">♥</div>
            <p className="closing-overline">A SMALL UNIVERSE, WITH A BIG FEELING</p>
            <h2>Bütün yollar<br/><em>sana çıkar.</em></h2>
            <a className="button button--light" href="#access"><span>Tekrar bağlan</span><ArrowUpRight /></a>
            <div className="closing-orbit closing-orbit--one"/><div className="closing-orbit closing-orbit--two"/>
          </section>
        </main>

        <footer className="site-footer">
          <a className="brand brand--footer" href="#top"><BrandMark/><span className="brand-copy"><strong>LOVE MATRIX</strong><small>A UNIVERSE FOR ONE</small></span></a>
          <div className="footer-center">DESIGNED WITH FEELING <span>♥</span> BUILT TO LAST</div>
          <div className="footer-right"><span>LOCAL HEART / 127.0.0.1</span><span>© 2026 LENSTEDREAL</span><a href="#top" aria-label="Sayfanın başına dön">↑</a></div>
        </footer>
      </div>
      <ImmersiveLoveSequence active={sequenceOpen} onClose={closeSequence} />
    </>
  );
}
