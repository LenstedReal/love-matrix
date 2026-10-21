# Love Matrix — Next.js edition

A responsive, cinematic personal-universe experience inspired by the original Love Matrix terminal flow and the visual references: ASCII heart art, a blinking cosmic eye / black-hole motif, and clean editorial website layouts.

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4 (available alongside the custom visual system)
- CSS animations, SVG portal art, Canvas particle choreography, and Web Audio tones

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

## Original interaction flow retained

1. A short system boot sequence appears.
2. The user submits a terminal command (the original default remains `sudo su - kalbin`).
3. A password prompt checks the original Love Matrix passphrase list.
4. A second prompt asks for `yes`, `y`, or `evet` to grant heart access.
5. The full-screen sequence cycles through countdown, ROOT ACCESS, AUTHENTICATED, LENSTEDREAL, a particle heart, a rotating 3D-style heart, and `I LOVE YOU SEVGILIM`.

**Security note:** The original gate is an in-browser romantic easter egg, not real authentication. A passphrase list embedded in client-side JavaScript can be inspected. Never use this for real accounts, private data, or authorization of server resources.


## Termux / Android ARM64

The `dev` and `build` scripts use Next.js Webpack explicitly because Turbopack native bindings are not available on every Android ARM64 Termux environment.

```bash
npm install
npm run dev
# open http://127.0.0.1:3000

npm run build
```

The homepage content is deliberately visible before client-side observers initialize, so a hydration or observer failure does not leave sections hidden. The eye illustration uses fixed SVG coordinates to keep server and browser markup identical.
