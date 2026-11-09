"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import KaliMark from "@/components/kali-mark";
import { BAR, SPB, musicBeat, musicPreferred, sfx, startMusic } from "@/lib/audio";

/* Romantik bir oyun kapısıdır, gerçek kimlik doğrulama değildir.
   Parola kodda düz yazılmaz; yalnızca özeti (cyrb53) tutulur. Değiştirmek için README'deki adıma bak. */
const PASS_HASHES = new Set(["inp8rz37i0"]);
const DEFAULT_COMMAND = "sudo su - kalbin";
const USER = "lenstedreal";
const HOST = "kalbin";

type Phase = "command" | "password" | "grant" | "payload" | "complete";
type Line = { id: number; node: ReactNode; cls?: string };
type Props = { onStartSequence: () => void };

const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/ş/g, "s").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
function cyrb53(str: string, seed = 0x6b616c70): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const passOk = (raw: string) => PASS_HASHES.has(cyrb53(fold(raw)));

const BOOT: Line[] = [
  { id: 1, cls: "t-dim", node: "Linux kali 6.6.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux" },
  { id: 2, cls: "t-dim", node: "Last login: bu gece, kalbin yakınlarından" },
  { id: 3, cls: "t-warn", node: <><b>[!] Hedef bölüm:</b> /dev/kalp <span className="t-note">· kilitli · erişim yalnızca bir kişiye ait</span></> },
];

/** Kali Linux zsh prompt'u: normal kullanıcıda yeşil çizgi + mavi ad + $, root'ta mavi çizgi + kırmızı ad + #. */
function Prompt({ cmd, root = false }: { cmd: ReactNode; root?: boolean }) {
  const line = root ? "t-c-blue" : "t-c-green";
  const who = root ? "t-c-red" : "t-c-blue";
  return (
    <>
      <div className="t-prompt">
        <span className={line}>┌──(</span>
        <b className={who}>{root ? "root" : USER}㉿{HOST}</b>
        <span className={line}>)-[</span>
        <b className="t-c-white">~</b>
        <span className={line}>]</span>
      </div>
      <div className="t-prompt">
        <span className={line}>└─</span>
        <b className={who}>{root ? "#" : "$"}</b> <span className="t-cmd">{cmd}</span>
      </div>
    </>
  );
}

export default function TerminalGate({ onStartSequence }: Props) {
  const [phase, setPhase] = useState<Phase>("command");
  const [value, setValue] = useState("");
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [fails, setFails] = useState(0);
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(10);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const add = (node: ReactNode, cls?: string) => setLines((l) => [...l, { id: nextId.current++, node, cls }]);
  const focus = () => later(60, () => inputRef.current?.focus({ preventScroll: true }));

  const runPayload = () => {
    setPhase("payload");
    const music = musicPreferred() ? startMusic(6) : null;
    sfx("access");
    // terminal yükü tam 2 ölçü sürer; sahne müziğin 3. ölçüsünde (geri sayım) açılır
    const steps: [number, ReactNode][] = [
      [0.0, <><b className="t-ok">[OK] Privileges escalated. Executing payload...</b> <span className="t-note">(onaylandı — şimdi çalıştırılıyor)</span></>],
      [0.2, <Prompt root cmd="chmod -R 777 /kalp" />],
      [0.32, <span className="t-note">(kalbimin her yerine tam erişim veriliyor)</span>],
      [0.5, <Prompt root cmd="systemctl start heart.service --now" />],
      [0.62, <span className="t-note">(kalp servisi başlatılıyor)</span>],
      [0.8, <><b className="t-ok">Active: active (running) since system boot</b> <span className="t-note">(aktif — hep buradaydı, hep senin içindi)</span></>],
    ];
    const total = BAR * 2 * 1000;
    const startIn = () => {
      const b = musicBeat();
      return music !== null && b !== null ? Math.max(0, (8 - b) * SPB * 1000) : total;
    };
    steps.forEach(([at, node]) => later(at * total, () => add(node)));
    later(startIn(), () => {
      setPhase("complete");
      onStartSequence();
    });
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typing) return;
    const raw = value.trim();
    setValue("");
    sfx("enter");

    if (phase === "command") {
      const cmd = raw || DEFAULT_COMMAND;
      add(<Prompt cmd={cmd} />);
      if (!/\bsudo\b/i.test(cmd)) {
        add(<><span className="t-err">bash: {cmd.split(/\s+/)[0]}: command not found</span> <span className="t-note">· ipucu: {DEFAULT_COMMAND}</span></>);
        sfx("error");
        focus();
        return;
      }
      add(<span className="t-note">(kalbimin sistemine tam yetkiyle girmeye çalışıyorsun)</span>);
      setPhase("password");
      focus();
      return;
    }

    if (phase === "password") {
      const masked = "•".repeat(Math.max(raw.length, 1));
      add(<span className="t-dim">[sudo] password for {USER}: {masked}</span>);
      if (passOk(raw)) {
        add(<><b className="t-ok">[ROOT ACCESS GRANTED]</b> <span className="t-pink">♥</span></>);
        add(<Prompt root cmd="chmod +rw /dev/kalp" />);
        add(<><span className="t-dim">Okuma/yazma yetkisi isteniyor → </span><span className="t-c-blue">/dev/kalp/*</span></>);
        add(<span className="t-c-blue">Kalbimi okumana ve ona yazmana izin veriyor musun?</span>);
        sfx("access");
        setPhase("grant");
      } else {
        const n = fails + 1;
        setFails(n);
        add(<><b className="t-err">su: Authentication failure</b> <span className="t-note">· şifre yanlış, tekrar dene</span></>);
        if (n >= 2) add(<span className="t-note">ipucu: bana en çok ne dersin? ♥</span>);
        sfx("error");
      }
      focus();
      return;
    }

    if (phase === "grant") {
      add(<span>Grant read/write access to /dev/kalp? [yes/no]: <span className="t-cmd">{raw || "(boş)"}</span></span>);
      if (["yes", "y", "evet", "e"].includes(raw.toLocaleLowerCase("tr-TR"))) {
        runPayload();
      } else {
        add(<b className="t-err">Reddedildi. Vazgeçmiyorum… lütfen &apos;yes&apos; yaz ♥</b>);
        sfx("error");
        focus();
      }
    }
  };

  const answer = (v: string) => {
    setValue(v);
    later(30, () => inputRef.current?.form?.requestSubmit());
  };

  const autotype = () => {
    if (typing || phase !== "command") return;
    setTyping(true);
    setValue("");
    const chars = DEFAULT_COMMAND.split("");
    chars.forEach((_, i) =>
      later(70 + i * 55, () => {
        setValue(DEFAULT_COMMAND.slice(0, i + 1));
        sfx("key");
        if (i === chars.length - 1) {
          setTyping(false);
          focus();
        }
      }),
    );
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setLines(BOOT);
    setPhase("command");
    setFails(0);
    setValue("");
    focus();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1) sfx("key");
  };

  const title = phase === "password" ? `[sudo] password for ${USER}` : phase === "grant" ? "read/write → /dev/kalp ?" : phase === "complete" || phase === "payload" ? "heart.service — active" : `${USER}@kali: ~`;
  const label = phase === "command" ? "KOMUT GİR" : phase === "password" ? "PAROLA" : phase === "grant" ? "ERİŞİM ONAYI · YES / NO" : "";
  const placeholder = phase === "command" ? DEFAULT_COMMAND : phase === "password" ? "••••••••" : "yes";

  return (
    <div className="term" onClick={() => phase !== "complete" && phase !== "payload" && inputRef.current?.focus({ preventScroll: true })}>
      <div className="term-bar">
        <KaliMark className="term-kali" color="#3b82f6" />
        <span className="term-title">{title}</span>
        <span className="term-wm" aria-hidden="true"><i>–</i><i>▢</i><i>✕</i></span>
      </div>
      <div className="term-out" ref={outRef} role="log" aria-live="polite">
        {lines.map((l) => (
          <div key={l.id} className={`term-line ${l.cls ?? ""}`}>{l.node}</div>
        ))}
        {phase === "complete" && (
          <div className="term-line"><span className="t-ok">● heart.service</span> <span className="t-note">· hep buradaydı, hep senin içindi</span></div>
        )}
      </div>

      {phase === "command" || phase === "password" || phase === "grant" ? (
        <form className="term-in" onSubmit={submit} autoComplete="off">
          <div className="term-label"><span className="term-led" /> {label}</div>
          <div className="term-row">
            <span className={`term-caret${phase === "grant" ? " is-root" : ""}`} aria-hidden="true">{phase === "password" ? "▣" : phase === "grant" ? "#" : "$"}</span>
            <input
              ref={inputRef}
              type={phase === "password" ? "password" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete={phase === "password" ? "current-password" : "off"}
              enterKeyHint="send"
              aria-label={phase === "password" ? "Parola" : phase === "grant" ? "Erişim onayı" : "Terminal komutu"}
              readOnly={typing}
            />
            <button type="submit" className="term-send" aria-label="Gönder">↵</button>
          </div>
          <div className="term-chips">
            {phase === "command" && (
              <button type="button" className="term-chip" onClick={autotype} disabled={typing}>
                ⌨ {DEFAULT_COMMAND}
              </button>
            )}
            {phase === "grant" && (
              <>
                <button type="button" className="term-chip term-chip--yes" onClick={() => answer("yes")}>yes</button>
                <button type="button" className="term-chip" onClick={() => answer("no")}>no</button>
              </>
            )}
            {phase === "password" && <span className="term-chip term-chip--ghost">parolayı yalnızca sen bilirsin</span>}
          </div>
        </form>
      ) : phase === "payload" ? (
        <div className="term-in term-in--busy"><span className="term-led term-led--busy" /> PAYLOAD ÇALIŞIYOR…</div>
      ) : (
        <div className="term-done">
          <span className="term-seal" aria-hidden="true">♥</span>
          <span className="term-done__copy">
            <b>ÇEKİRDEK AÇIK</b>
            <small>Sahneyi yeniden oynat ya da aynı cümleyi 100 dilde dinle.</small>
          </span>
          <span className="term-done__btns">
            <button type="button" className="term-chip term-chip--yes" onClick={onStartSequence}>tekrar oynat ↺</button>
            <Link className="term-chip" href="/100-dil">100 dil →</Link>
            <button type="button" className="term-chip term-chip--icon" onClick={reset} aria-label="Terminali sıfırla" title="Terminali sıfırla">↻</button>
          </span>
        </div>
      )}
      <div className="term-foot">
        <span><i /> SİSTEM NORMAL</span>
        <span>{phase === "complete" ? "ERİŞİM VERİLDİ" : phase === "payload" ? "YÜKLENİYOR" : "GİRDİ BEKLENİYOR"}</span>
        <span>127.0.0.1 · /dev/kalp</span>
      </div>
    </div>
  );
}
