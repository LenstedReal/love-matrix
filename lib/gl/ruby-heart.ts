/**
 * Işın izlemeli (ray-marched) 3B yakut kalp — WebGL1, kütüphanesiz.
 * Geçişler: sahne → parlak kısım (¼ çözünürlük) → 2× ayrık Gauss bulanıklığı (bloom) → birleştirme
 * (bloom + kalpten yayılan ışık hüzmeleri + vinyet + film greni).
 * Yavaş cihazda çözünürlüğü kendiliğinden düşürür.
 */
import { heartbeatEnvelope, heartPhase } from "@/lib/audio";

export type HeartMode = 0 | 1 | 2; // yakut · obsidyen · dikişli

export type HeartOptions = {
  /** Kalbin yerleşeceği alan (ekran koordinatı). */
  slot: () => DOMRect | null;
  /** Arka planda bokeh ve kıvılcımlar. */
  ambient: boolean;
  /** Sayfa zemin rengi (0..1), kenarlar buna kararır. */
  bg: [number, number, number];
  /** Kalbin alana oranı. */
  fill?: number;
};

export type HeartController = {
  pulse(strong?: boolean): void;
  nextMode(): HeartMode;
  setMode(m: HeartMode): void;
  drag(dx: number): void;
  setDragging(on: boolean): void;
  resize(): void;
  setActive(on: boolean): void;
  destroy(): void;
};

const VS = "attribute vec2 a;varying vec2 v;void main(){v=a*0.5+0.5;gl_Position=vec4(a,0.,1.);}";

const SCENE = (prec: string) => `precision ${prec} float;
varying vec2 v;
uniform vec2 uRes;
uniform float uTime, uBeat, uKick, uYaw, uPitch, uShock, uAmbient;
uniform vec3 uHeart;
uniform vec3 uMode;
uniform vec3 uBg;
float seam;
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }
float map(vec3 p){
  p.xz = rot(uYaw)*p.xz;
  p.yz = rot(uPitch)*p.yz;
  vec3 q = p*32.0;
  float b = uBeat*0.8 + uKick*0.7;
  q *= 1.0 - 0.085*vec3(1.0,0.6,1.0)*b;
  float cx = 1.4*sin(q.y*0.55+0.6) + 0.6*sin(q.y*1.7);
  seam = abs(q.x - cx);
  float x = sqrt(q.x*q.x + 0.35);
  float y = 4.0 + (q.y - 1.25)*1.2 - x*sqrt(max((20.0-x)/15.0, 0.0));
  float z = q.z*(2.0 - y/15.0);
  float d = (sqrt(x*x + y*y + z*z) - 15.0)/3.0;
  d = max(d, (uMode.z*0.85 - seam)/3.0);
  return d/32.0;
}
vec3 normalAt(vec3 p){
  const vec2 e = vec2(1.0,-1.0)*0.0008;
  return normalize(e.xyy*map(p+e.xyy) + e.yyx*map(p+e.yyx) + e.yxy*map(p+e.yxy) + e.xxx*map(p+e.xxx));
}
vec3 envMap(vec3 r){
  vec3 c = vec3(0.012,0.0,0.01);
  c += vec3(1.0,0.06,0.32)*1.6*smoothstep(0.15,0.85,r.y)*smoothstep(0.95,0.15,abs(r.x));
  c += vec3(2.6)*exp(-(pow((r.x+0.5)*3.2,2.0) + pow((r.y-0.42)*4.2,2.0)));
  c += vec3(1.0,0.82,0.62)*1.1*smoothstep(0.45,0.95,r.x)*smoothstep(-0.5,0.3,r.y);
  c += vec3(0.7,0.0,0.22)*0.5*smoothstep(0.0,-0.8,r.y);
  return c;
}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  vec2 fc = gl_FragCoord.xy;
  vec2 suv = fc/uRes;
  float asp = uRes.x/uRes.y;
  vec2 hc = (fc - uHeart.xy)/uRes.y;
  float beat = uBeat*0.7 + uKick;
  float dark = uMode.y;
  vec3 bg = pow(uBg, vec3(2.2));
  vec3 col = mix(vec3(0.05,0.0,0.024), bg, smoothstep(0.0,0.75,length(hc*vec2(0.9,1.1))*(uHeart.z > 0.0 ? uRes.y/uHeart.z*0.45 : 1.0)));
  col *= 1.0 - 0.45*dark;
  if (uAmbient > 0.5) {
    for (int l = 0; l < 3; l++){
      float fl = float(l), cell = 0.15 + fl*0.1;
      vec2 p = vec2(suv.x*asp, suv.y)/cell + vec2(fl*7.3, -uTime*(0.05 + fl*0.03));
      vec2 id = floor(p), f = fract(p) - 0.5;
      float h = hash(id + fl*13.1);
      vec2 o = vec2(hash(id+3.1), hash(id+7.7)) - 0.5;
      float r = 0.16 + 0.2*hash(id+11.0);
      float dd = length(f - o*0.45);
      float disc = smoothstep(r, r*0.72, dd);
      float rim = smoothstep(r, r*0.9, dd) - smoothstep(r*0.9, r*0.78, dd);
      vec3 bc = mix(vec3(1.0,0.07,0.38), vec3(1.0,0.75,0.5), step(0.86, hash(id+5.0)));
      float tw = 0.75 + 0.25*sin(uTime*0.8 + h*40.0);
      col += bc*(disc*0.026 + rim*0.022)*step(0.64, h)*tw*(1.0 - fl*0.22)*(1.0 + beat*0.25);
    }
    for (int l = 0; l < 2; l++){
      float fl = float(l);
      vec2 sp = vec2(suv.x*asp, suv.y)*vec2(24.0 + fl*14.0, 16.0 + fl*10.0) + vec2(fl*3.7, -uTime*(1.1 + fl*0.7));
      vec2 sid = floor(sp), sf = fract(sp) - 0.5;
      float sh = hash(sid + fl*9.0);
      vec2 so = vec2(hash(sid+1.3), hash(sid+2.7)) - 0.5;
      float sd = length(sf - so*0.6);
      float tw = 0.5 + 0.5*sin(uTime*5.0 + sh*60.0);
      col += mix(vec3(1.0,0.32,0.6), vec3(1.0), dark)*exp(-sd*sd*(700.0 + fl*500.0))*tw*step(0.93, sh)*(0.9 - fl*0.35)*smoothstep(0.0,0.35,suv.y);
    }
  }
  if (uShock < 1.6){
    float rr = (0.1 + uShock*0.75)*(uHeart.z/uRes.y)*2.0;
    float w = (0.004 + uShock*0.012)*(uHeart.z/uRes.y)*2.0;
    float ring = exp(-pow((length(hc) - rr)/w, 2.0));
    col += mix(vec3(1.0,0.12,0.42), vec3(0.9,0.3,0.6), dark)*ring*pow(1.0 - uShock/1.6, 2.0)*0.4;
  }
  vec2 uv = (fc - uHeart.xy)/(uHeart.z*0.5);
  float minD = 9.0;
  if (dot(uv,uv) < 3.2){
    vec3 ro = vec3(0.0,0.0,3.0);
    vec3 rd = normalize(vec3(uv*0.14, -1.0));
    float t = 2.25; bool hit = false;
    for (int i = 0; i < 90; i++){
      float d = map(ro + rd*t);
      minD = min(minD, d);
      if (d < 0.00035*t){ hit = true; break; }
      t += d;
      if (t > 3.75) break;
    }
    vec3 ruby = vec3(0.42,0.004,0.035), obs = vec3(0.012,0.004,0.01);
    vec3 alb = mix(ruby, obs, dark);
    if (!hit) col += mix(vec3(1.0,0.03,0.22), vec3(0.45,0.08,0.22), dark)*exp(-minD*48.0)*(0.14 + beat*0.22)*smoothstep(3.2,1.2,dot(uv,uv));
    if (hit){
      vec3 p = ro + rd*t;
      vec3 n = normalAt(p);
      map(p);
      vec3 V = -rd;
      float ndv = max(dot(n,V), 0.0);
      float F = 0.04 + 0.96*pow(1.0 - ndv, 5.0);
      vec3 L1 = normalize(vec3(-0.6,0.7,0.8)), L2 = normalize(vec3(0.85,0.15,-0.25));
      float dif = clamp((dot(n,L1) + 0.35)/1.35, 0.0, 1.0);
      vec3 sss = vec3(0.9,0.015,0.08)*pow(1.0 - ndv, 2.4)*0.5*(1.0 - dark*0.75);
      vec3 core = vec3(0.9,0.05,0.18)*pow(ndv, 2.5)*(0.06 + 0.45*beat)*(1.0 - dark*0.7);
      float sp1 = pow(max(dot(n, normalize(L1+V)), 0.0), 140.0)*3.0;
      float sp2 = pow(max(dot(n, normalize(L2+V)), 0.0), 50.0)*1.1;
      vec3 hcol = alb*dif*0.95 + sss + core;
      hcol += F*envMap(reflect(rd,n))*1.1 + vec3(1.0,0.95,0.97)*sp1 + vec3(1.0,0.78,0.55)*sp2;
      hcol += vec3(0.0,0.92,1.0)*uMode.z*exp(-seam*1.8)*(1.3 + beat*1.0);
      col = hcol;
    }
  }
  col = aces(col*0.95);
  col = pow(col, vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}`;

const BRIGHT = `precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 px;
void main(){vec3 c=(texture2D(t,v+px*vec2(-1.,-1.)).rgb+texture2D(t,v+px*vec2(1.,-1.)).rgb+texture2D(t,v+px*vec2(-1.,1.)).rgb+texture2D(t,v+px*vec2(1.,1.)).rgb)*0.25;
float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(0.55,1.0,l),1.);}`;

const BLUR = `precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 dir;
void main(){vec3 c=texture2D(t,v).rgb*0.2270270270;
c+=(texture2D(t,v+dir*1.3846153846).rgb+texture2D(t,v-dir*1.3846153846).rgb)*0.3162162162;
c+=(texture2D(t,v+dir*3.2307692308).rgb+texture2D(t,v-dir*3.2307692308).rgb)*0.0702702703;
gl_FragColor=vec4(c,1.);}`;

const COMPOSITE = `precision mediump float;varying vec2 v;uniform sampler2D scene;uniform sampler2D bloom;
uniform vec2 center;uniform vec2 res;uniform float time;uniform float rays;uniform float vig;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){vec3 c=texture2D(scene,v).rgb;vec3 b=texture2D(bloom,v).rgb;
vec2 d=(v-center)*(0.85/24.0);vec2 p=v;float w=1.0;vec3 r=vec3(0.);
for(int i=0;i<24;i++){p-=d;r+=texture2D(bloom,p).rgb*w;w*=0.9;}
c+=b*0.5+r*(rays/14.0);
vec2 q=v-0.5;q.x*=res.x/res.y;c*=1.0-vig*pow(length(q)*1.25,2.4);
c+=(hash(v*res+fract(time*7.0)*311.0)-0.5)*0.03;
gl_FragColor=vec4(c,1.);}`;

type Target = { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };

export function mountRubyHeart(canvas: HTMLCanvasElement, opts: HeartOptions): HeartController | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const prec = hp && hp.precision > 0 ? "highp" : "mediump";

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error("shader");
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "compile");
    return s;
  };
  const program = (fs: string) => {
    const p = gl.createProgram();
    if (!p) throw new Error("program");
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "a");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
    return p;
  };

  let pScene: WebGLProgram, pBright: WebGLProgram, pBlur: WebGLProgram, pComp: WebGLProgram;
  try {
    pScene = program(SCENE(prec));
    pBright = program(BRIGHT);
    pBlur = program(BLUR);
    pComp = program(COMPOSITE);
  } catch (e) {
    console.warn("[ruby-heart]", e);
    return null;
  }
  const loc = (p: WebGLProgram, names: string[]) => {
    const o: Record<string, WebGLUniformLocation | null> = {};
    names.forEach((n) => (o[n] = gl.getUniformLocation(p, n)));
    return o;
  };
  const uS = loc(pScene, ["uRes", "uTime", "uBeat", "uKick", "uYaw", "uPitch", "uShock", "uAmbient", "uHeart", "uMode", "uBg"]);
  const uB = loc(pBright, ["t", "px"]);
  const uBl = loc(pBlur, ["t", "dir"]);
  const uC = loc(pComp, ["scene", "bloom", "center", "res", "time", "rays", "vig"]);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const makeTarget = (w: number, h: number): Target => {
    const tex = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer() as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  };
  const freeTarget = (t: Target | null) => {
    if (!t) return;
    gl.deleteTexture(t.tex);
    gl.deleteFramebuffer(t.fb);
  };

  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let scale = Math.min(DPR, window.innerWidth < 700 ? 1.05 : 1.2);
  const MAXS = Math.min(DPR, 1.5);
  const MINS = 0.4;
  let W = 2, H = 2;
  let S: Target | null = null, A: Target | null = null, B: Target | null = null;
  let heart: [number, number, number] = [1, 1, 100];
  let cssW = 1, cssH = 1;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(1, r.width);
    cssH = Math.max(1, r.height);
    const nw = Math.max(2, Math.round(cssW * scale));
    const nh = Math.max(2, Math.round(cssH * scale));
    if (nw !== W || nh !== H || !S) {
      W = nw;
      H = nh;
      canvas.width = W;
      canvas.height = H;
      freeTarget(S);
      freeTarget(A);
      freeTarget(B);
      S = makeTarget(W, H);
      const bw = Math.max(2, Math.round(W / 4)), bh = Math.max(2, Math.round(H / 4));
      A = makeTarget(bw, bh);
      B = makeTarget(bw, bh);
    }
    const s = opts.slot();
    const fill = opts.fill ?? 0.8;
    if (s) {
      const cx = s.left + s.width / 2 - r.left;
      const cy = s.top + s.height / 2 - r.top;
      const hh = Math.min(s.height * fill, s.width * fill * 0.86, 520);
      heart = [cx * (W / cssW), (cssH - cy) * (H / cssH), hh * (H / cssH)];
    }
  };

  let kick = 0, shockT = 9, yawDrag = 0, dragging = false, mode: HeartMode = 0;
  const modeW = [1, 0, 0];
  let raf = 0, active = true, destroyed = false;
  const t0 = performance.now();
  let last = t0, acc = 0, frames = 0;

  const bindTex = (unit: number, tex: WebGLTexture) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
  };
  const draw = (target: Target | null, w: number, h: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, w, h);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    if (!active || destroyed) return;
    raf = requestAnimationFrame(frame);
    if (!S || !A || !B) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const sec = (now - t0) / 1000;
    acc += dt;
    frames++;
    if (frames >= 30) {
      const avg = acc / frames;
      if (avg > 0.026 && scale > MINS) {
        scale = Math.max(MINS, scale * 0.85);
        resize();
      } else if (avg < 0.0155 && scale < MAXS) {
        scale = Math.min(MAXS, scale * 1.06);
        resize();
      }
      acc = 0;
      frames = 0;
    }
    kick *= Math.pow(0.02, dt);
    shockT += dt;
    for (let i = 0; i < 3; i++) modeW[i] += ((i === mode ? 1 : 0) - modeW[i]) * Math.min(1, dt * 5);
    if (!dragging) yawDrag *= Math.pow(0.08, dt);
    const sway = reduce ? 0 : Math.sin(sec * 0.55) * 0.55 + Math.sin(sec * 0.21) * 0.15;

    // 1) sahne
    gl.useProgram(pScene);
    gl.uniform2f(uS.uRes, W, H);
    gl.uniform1f(uS.uTime, sec);
    gl.uniform1f(uS.uBeat, heartbeatEnvelope(heartPhase(sec)));
    gl.uniform1f(uS.uKick, kick);
    gl.uniform1f(uS.uYaw, sway + yawDrag);
    gl.uniform1f(uS.uPitch, reduce ? 0 : 0.12 + Math.sin(sec * 0.37) * 0.08);
    gl.uniform1f(uS.uShock, shockT);
    gl.uniform1f(uS.uAmbient, opts.ambient ? 1 : 0);
    gl.uniform3f(uS.uHeart, heart[0], heart[1], heart[2]);
    gl.uniform3f(uS.uMode, modeW[0], modeW[1], modeW[2]);
    gl.uniform3f(uS.uBg, opts.bg[0], opts.bg[1], opts.bg[2]);
    draw(S, W, H);
    // 2) parlak kısım
    gl.useProgram(pBright);
    bindTex(0, S.tex);
    gl.uniform1i(uB.t, 0);
    gl.uniform2f(uB.px, 1 / W, 1 / H);
    draw(A, A.w, A.h);
    // 3) bulanıklık (2 tur)
    gl.useProgram(pBlur);
    gl.uniform1i(uBl.t, 0);
    for (const step of [1, 2.2]) {
      bindTex(0, A.tex);
      gl.uniform2f(uBl.dir, step / A.w, 0);
      draw(B, B.w, B.h);
      bindTex(0, B.tex);
      gl.uniform2f(uBl.dir, 0, step / B.h);
      draw(A, A.w, A.h);
    }
    // 4) birleştir
    gl.useProgram(pComp);
    bindTex(0, S.tex);
    bindTex(1, A.tex);
    gl.uniform1i(uC.scene, 0);
    gl.uniform1i(uC.bloom, 1);
    gl.uniform2f(uC.center, heart[0] / W, heart[1] / H);
    gl.uniform2f(uC.res, W, H);
    gl.uniform1f(uC.time, sec);
    gl.uniform1f(uC.rays, 0.55 + kick * 0.6);
    gl.uniform1f(uC.vig, opts.ambient ? 0.5 : 0.25);
    draw(null, W, H);
  };

  const onResize = () => resize();
  window.addEventListener("resize", onResize);
  resize();
  raf = requestAnimationFrame((t) => {
    last = t;
    frame(t);
  });

  return {
    pulse(strong = false) {
      kick = Math.min(1.2, kick + (strong ? 1 : 0.6));
      shockT = 0;
    },
    nextMode() {
      mode = ((mode + 1) % 3) as HeartMode;
      kick = 1.2;
      shockT = 0;
      return mode;
    },
    setMode(m) {
      mode = m;
    },
    drag(dx) {
      yawDrag += dx;
    },
    setDragging(on) {
      dragging = on;
    },
    resize,
    setActive(on) {
      if (on === active || destroyed) return;
      active = on;
      if (on) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else cancelAnimationFrame(raf);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      freeTarget(S);
      freeTarget(A);
      freeTarget(B);
      S = A = B = null;
      [pScene, pBright, pBlur, pComp].forEach((p) => gl.deleteProgram(p));
      gl.deleteBuffer(buf);
    },
  };
}
