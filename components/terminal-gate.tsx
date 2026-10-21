"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";

const VALID_PASSWORDS = ["my_darling", "sevgilim", "aşkım", "lenstedreal", "kalbim", "flawless"];
const DEFAULT_COMMAND = "sudo su - kalbin";

type Phase = "command" | "password" | "grant" | "complete";
type LogEntry = { id: number; content: ReactNode; className?: string };
type Props = { onStartSequence: () => void };

export default function TerminalGate({ onStartSequence }: Props) {
  const [phase, setPhase] = useState<Phase>("command");
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, className: "log-muted", content: "Linux kali 6.6.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC x86_64" },
    { id: 2, className: "log-muted", content: "System initialization sequence complete." },
    { id: 3, className: "log-warning", content: <><strong>[!] Target partition: /dev/kalp</strong> <span className="log-note">(kilitli alan · erişim yalnızca kalbe ait)</span></> },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const nextId = useRef(4);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs]);

  useEffect(() => () => { audioRef.current?.close().catch(() => {}); }, []);

  const play = (type: "key" | "access" | "error") => {
    try {
      const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioRef.current) audioRef.current = new AudioCtor();
      const audio = audioRef.current;
      if (audio.state === "suspended") void audio.resume();
      const now = audio.currentTime;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type === "key" ? "square" : type === "access" ? "sawtooth" : "triangle";
      const start = type === "key" ? 690 + Math.random() * 120 : type === "access" ? 135 : 350;
      const end = type === "key" ? 650 : type === "access" ? 900 : 170;
      const duration = type === "key" ? 0.035 : 0.42;
      oscillator.frequency.setValueAtTime(start, now);
      oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
      gain.gain.setValueAtTime(type === "key" ? 0.016 : 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch { /* Browser sound is optional. */ }
  };

  const addLog = (content: ReactNode, className = "") => {
    setLogs((previous) => [...previous, { id: nextId.current++, content, className }]);
  };

  const focusInput = () => window.setTimeout(() => inputRef.current?.focus(), 80);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue.trim();
    setInputValue("");

    if (phase === "command") {
      const command = value || DEFAULT_COMMAND;
      addLog(<>
        <div className="terminal-prompt-line"><span className="prompt-user">lenstedreal</span><span className="prompt-at">㉿</span><span className="prompt-host">kalbin</span><span className="prompt-dash"> — [<strong>~</strong>]</span></div>
        <div><span className="prompt-arrow">└─$</span> {command}</div>
        <div className="log-note log-note--standalone">(kalbimin sistemine tam yetkiyle girmeye çalışıyorsun)</div>
      </>);
      setPhase("password");
      setMessage("Parola gerekli · PASSWD");
      focusInput();
      return;
    }

    if (phase === "password") {
      const masked = "•".repeat(Math.max(value.length, 1));
      if (VALID_PASSWORDS.includes(value.toLocaleLowerCase("tr-TR"))) {
        addLog(<><span className="log-muted">[sudo] password for lenstedreal: {masked}</span></>);
        addLog(<><strong className="log-success">[ROOT ACCESS GRANTED]</strong> <span className="log-pink">♥</span></>);
        addLog(<><span className="log-muted">Requesting read/write privileges to </span><span className="log-blue">/kalp/*</span><span className="log-note"> (kalbin her yerine erişim isteniyor)</span></>);
        addLog(<span className="log-blue">Flawless, kalbimi okumana izin veriyor musun?</span>);
        play("access");
        setPhase("grant");
        setMessage("Kalp erişimi · YES / NO");
        focusInput();
      } else {
        addLog(<span className="log-muted">[sudo] password for lenstedreal: {masked}</span>);
        addLog(<><strong className="log-error">su: Authentication failure</strong> <span className="log-note">(şifre yanlış, tekrar dene)</span></>);
        setMessage("Kimlik doğrulanamadı · RETRY");
        play("error");
        focusInput();
      }
      return;
    }

    if (phase === "grant") {
      addLog(<>Grant root access: {value || "(empty)"}</>);
      if (["yes", "y", "evet"].includes(value.toLowerCase())) {
        addLog(<><strong className="log-success">[OK] Privileges escalated. Executing payload...</strong></>);
        addLog(<span className="log-note">(onaylandı — kalbin çekirdeği başlatılıyor)</span>);
        setPhase("complete");
        setMessage("Core online · erişim verildi");
        play("access");
        window.setTimeout(() => onStartSequence(), 680);
      } else {
        addLog(<strong className="log-error">Reddedildi. Vazgeçmiyorum Flawless... Lütfen 'yes' yaz ♥</strong>);
        setMessage("Onay bekleniyor · YES");
        play("error");
        focusInput();
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key.length === 1) play("key");
  };

  const reset = () => {
    setPhase("command");
    setInputValue("");
    setMessage("");
    nextId.current = 4;
    setLogs([
      { id: 1, className: "log-muted", content: "Linux kali 6.6.0-kali1-amd64 #1 SMP PREEMPT_DYNAMIC x86_64" },
      { id: 2, className: "log-muted", content: "System initialization sequence complete." },
      { id: 3, className: "log-warning", content: <><strong>[!] Target partition: /dev/kalp</strong> <span className="log-note">(kilitli alan · erişim yalnızca kalbe ait)</span></> },
    ]);
    focusInput();
  };

  const promptTitle = phase === "password" ? "[sudo] password for lenstedreal:" : phase === "grant" ? "Grant root access to heart? (yes/no):" : phase === "complete" ? "heart.service — active (running)" : "lenstedreal@kalbin:~";
  const inputType = phase === "password" ? "password" : "text";
  const placeholder = phase === "command" ? "sudo su - kalbin" : phase === "password" ? "••••••••••" : phase === "grant" ? "yes" : "core already unlocked";

  return (
    <div className="terminal-window">
      <div className="terminal-titlebar">
        <div className="terminal-traffic" aria-hidden="true"><span /><span /><span /></div>
        <div className="terminal-title"><span className="terminal-title__icon">⌘</span><span>{promptTitle}</span></div>
        <span className="terminal-live"><i /> LIVE</span>
      </div>
      <div className="terminal-meta"><span>LOVE MATRIX SHELL</span><span>SESSION / 001</span><span>ENCRYPTION: FEELINGS</span></div>
      <div className="terminal-output" role="log" aria-live="polite" aria-relevant="additions text">
        {logs.map((entry) => <div className={`terminal-log ${entry.className}`} key={entry.id}>{entry.content}</div>)}
        {phase === "complete" && <div className="terminal-log"><span className="log-success">Active: active (running) since system boot</span> <span className="log-note">(hep buradaydı, hep senin içindi)</span></div>}
        <div ref={logsEndRef} />
      </div>
      {phase !== "complete" ? (
        <form className="terminal-input-area" onSubmit={submit} autoComplete="off">
          <div className="terminal-input-label"><span className="terminal-input-led" /> {message || (phase === "command" ? "ENTER COMMAND" : phase === "password" ? "ENTER PASSPHRASE" : "CONFIRM HEART ACCESS")}</div>
          <div className="terminal-input-row">
            <span className="terminal-caret">{phase === "password" ? "▣" : phase === "grant" ? "▶" : "$"}</span>
            <input
              ref={inputRef}
              type={inputType}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              aria-label={phase === "password" ? "Love Matrix parolası" : phase === "grant" ? "Kalp erişim onayı" : "Terminal komutu"}
            />
            <button type="submit" aria-label="Terminal komutunu gönder"><span>↗</span></button>
          </div>
        </form>
      ) : (
        <div className="terminal-complete">
          <div className="terminal-complete__seal"><span>♥</span></div>
          <div><strong>CORE UNLOCKED</strong><small>Animasyonu yeniden başlatabilir veya terminal akışını sıfırlayabilirsin.</small></div>
          <button className="terminal-replay" onClick={onStartSequence}>REPLAY SEQUENCE <span>↗</span></button>
          <button className="terminal-reset" onClick={reset} aria-label="Terminali sıfırla" title="Terminali sıfırla">↻</button>
        </div>
      )}
      <div className="terminal-footer"><span><i /> SYSTEM NOMINAL</span><span>{phase === "complete" ? "ACCESS GRANTED" : "AWAITING INPUT"}</span><span>LOCAL HEART / 127.0.0.1</span></div>
    </div>
  );
}
