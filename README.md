# Love Matrix — Next.js edition

Tek bir kişiye adanmış sinematik bir web deneyimi: Kali terminali, parçacıklardan kalp ve aynı cümle yüz dilde. Ek bağımlılık yok.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4 (available alongside the custom visual system)
- WebGL (ray-marched yakut kalp + bloom, parçacık motoru), Canvas matrix yağmuru, Web Audio phonk, Web Speech

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` on your device. For testing from another device on the same network, use the local IP shown by your terminal on port 3000.

## Production build

```bash
npm run build
npm start
```

## Akış

0. **Kali açılışı** — ejderha logosu, yükleme çubuğu, boot mesajları (oturumda bir kez).
1. **Ana sayfa** — canlı 3B yakut kalp (WebGL), 4 adımlık protokol, Kali terminali, 100 dil şeridi.
2. **Kali terminali** — `sudo su - kalbin` (telefonda tek dokunuşla yazdırılır) → parola → root prompt'u → `chmod +rw /dev/kalp` izni (`yes`) → payload.
3. **Sinematik sahne** — Instagram hikâyesindeki sürüm (8524b64) ve Kali sürümü (love2-8-10.html) birebir, müziğin vuruşlarına kilitli: toz → `3 · 2 · 1` → `ROOT ACCESS · AUTHENTICATED · LENSTEDREAL` → `YU · ARE · MY · LOVE` → parçacık kalp + nabız → dönen 3B kalp → `I LOVE 🫦❤️‍🔥 YOU SEVGILIM` → toz → baştan.
4. **/100-dil** — aynı cümle 100 dilde; her cümle kendi dilinin sesiyle okunur (cihaz sesi → Google ses servisi → yoksa "ses yok" uyarısı; yanlış dilin sesiyle asla okunmaz).

Müzik dış dosya kullanmaz: 140 BPM phonk tarayıcıda üretilir (808, cowbell, clap, swing hi-hat, reverb). Sesli okuma sırasında müzik kısılır.

## Parola

Parola kodda düz yazılmaz, yalnızca özeti tutulur (`components/terminal-gate.tsx` → `PASS_HASHES`).
Büyük/küçük harf, boşluk ve Türkçe karakter farkı önemsizdir. Yeni parolanın özetini üretmek için:

```bash
node -e 'const f=s=>s.toLocaleLowerCase("tr-TR").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]/g,"");function c(t,e=0x6b616c70){let h1=0xdeadbeef^e,h2=0x41c6ce57^e;for(let i=0;i<t.length;i++){const ch=t.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)}console.log(c(f(process.argv[1])))' "yeni parola"
```

Çıkan değeri `PASS_HASHES` içine yaz. İpucu metni aynı dosyada (`ipucu: …`).

**Güvenlik notu:** Bu romantik bir oyun kapısıdır, gerçek kimlik doğrulama değildir. Gerçek hesaplar veya özel veriler için kullanma.

## Termux / Android ARM64

The `dev` and `build` scripts use Next.js Webpack explicitly because Turbopack native bindings are not available on every Android ARM64 Termux environment.

```bash
npm install
npm run dev
# open http://127.0.0.1:3000

npm run build
```

The homepage content is deliberately visible before client-side observers initialize, so a hydration or observer failure does not leave sections hidden. The eye illustration uses fixed SVG coordinates to keep server and browser markup identical.
