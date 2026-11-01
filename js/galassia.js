// La galassia viva dello sfondo: bracci a spirale, stelle e nebulose.
// Espone window.galassia per il trascinamento (mouse, dita, mani).
import * as T from './lib/grafica3d.js';

const tela = document.getElementById('galassia');
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const piccolo = innerWidth < 768;

let rend;
try {
  rend = new T.WebGLRenderer({ canvas: tela, antialias: false, alpha: false, powerPreference: 'high-performance' });
} catch (e) { tela.style.display = 'none'; }

if (rend) {
  rend.setPixelRatio(Math.min(devicePixelRatio, piccolo ? 1.5 : 2));
  rend.setClearColor(0x02030a, 1);
  const scena = new T.Scene();
  const cam = new T.PerspectiveCamera(60, 1, 0.1, 400);

  // ---- stelle della galassia ----
  const N = piccolo ? 14000 : 30000;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), dim = new Float32Array(N), fase = new Float32Array(N);
  const c = new T.Color();
  const palette = [[0x5ad7ff, .5], [0xc38bff, .22], [0xf3cd73, .12], [0xff7eb6, .08], [0x5fe3a1, .08]];
  const scegli = () => { let r = Math.random(); for (const [h, p] of palette) { if ((r -= p) < 0) return h; } return 0x5ad7ff; };
  const BRACCI = 4, R = 15;
  for (let i = 0; i < N; i++) {
    const k = i * 3, nucleo = i < N * .16;
    let x, y, z;
    if (nucleo) {
      const r = Math.pow(Math.random(), 2.2) * 3.2, a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1;
      x = Math.cos(a) * r * Math.sqrt(1 - u * u); z = Math.sin(a) * r * Math.sqrt(1 - u * u); y = u * r * .45;
      c.set(0xffffff).lerp(new T.Color(0x9fe9ff), Math.random() * .6);
    } else {
      const d = Math.pow(Math.random(), 1.35) * R + .6, b = i % BRACCI;
      const a = b / BRACCI * Math.PI * 2 + d * .42, sparso = (Math.random() - .5) * (1.2 + d * .14) * Math.pow(Math.random(), .6);
      x = Math.cos(a + sparso * .25) * d + (Math.random() - .5) * .5;
      z = Math.sin(a + sparso * .25) * d + (Math.random() - .5) * .5;
      y = (Math.random() - .5) * (.9 - d / R * .6) * Math.pow(Math.random(), 2);
      c.set(scegli()).lerp(new T.Color(0xffffff), Math.max(0, .5 - d / R));
    }
    pos.set([x, y, z], k); col.set([c.r, c.g, c.b], k);
    dim[i] = nucleo ? 1 + Math.random() * 2 : .6 + Math.pow(Math.random(), 3) * 3.2;
    fase[i] = Math.random() * 6.283;
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setAttribute('dim', new T.BufferAttribute(dim, 1));
  geo.setAttribute('fase', new T.BufferAttribute(fase, 1));
  const mat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, vertexColors: true,
    uniforms: { uT: { value: 0 }, uPx: { value: rend.getPixelRatio() }, uLuce: { value: 1 } },
    vertexShader: `attribute float dim; attribute float fase; uniform float uT; uniform float uPx; varying vec3 vC; varying float vB;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
        vB = .65 + .35*sin(uT*1.6 + fase); vC = color;
        gl_PointSize = dim * uPx * 28. / -mv.z; }`,
    fragmentShader: `uniform float uLuce; varying vec3 vC; varying float vB;
      void main(){ vec2 p = gl_PointCoord - .5; float d = length(p); if(d>.5) discard;
        float a = smoothstep(.5,0.,d); a = a*a; gl_FragColor = vec4(vC * vB * uLuce, a); }`
  });
  const galassia = new T.Points(geo, mat);
  const gruppo = new T.Group(); gruppo.add(galassia); scena.add(gruppo);
  gruppo.rotation.x = .5;

  // ---- nebulose (sprite morbidi) ----
  const macchia = (() => { const k = document.createElement('canvas'); k.width = k.height = 128; const g = k.getContext('2d');
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(.4, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(k); })();
  [[0x5ad7ff, 0, 0, 0, 14], [0xc38bff, 6, 0, -3, 12], [0xff7eb6, -7, 0, 4, 9], [0xf3cd73, 2, 0, 7, 8], [0x5ad7ff, -5, 0, -8, 10]].forEach(([h, x, y, z, s]) => {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: macchia, color: h, transparent: true, opacity: .32, blending: T.AdditiveBlending, depthWrite: false }));
    sp.position.set(x, y, z); sp.scale.set(s, s, 1); gruppo.add(sp);
  });

  // ---- cielo lontano ----
  const M = piccolo ? 1500 : 3000, cp = new Float32Array(M * 3);
  for (let i = 0; i < M; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, r = 80 + Math.random() * 60;
    cp.set([Math.sqrt(1 - u * u) * Math.cos(a) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(a) * r], i * 3); }
  const cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(cp, 3));
  const cielo = new T.Points(cg, new T.PointsMaterial({ color: 0x9fb8d6, size: 1.1, sizeAttenuation: false, transparent: true, opacity: .55 }));
  scena.add(cielo);

  // ---- anello HUD ----
  const anello = new T.Mesh(new T.RingGeometry(16.5, 16.56, 180), new T.MeshBasicMaterial({ color: 0x5ad7ff, transparent: true, opacity: .22, side: T.DoubleSide }));
  anello.rotation.x = -Math.PI / 2; gruppo.add(anello);

  function misura() { const w = innerWidth, h = innerHeight; rend.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < 768 ? 75 : 58; cam.updateProjectionMatrix(); }
  addEventListener('resize', misura); misura();

  // stato del trascinamento con inerzia
  const st = { yaw: 0, pitch: 0, vy: 0, vp: 0, zoom: 1, zoomVoluto: 1, esplora: false };
  window.galassia = {
    ruota(dx, dy) { st.vy += dx * .005; st.vp += dy * .003; },
    zoom(f) { st.zoomVoluto = Math.min(1.8, Math.max(.45, st.zoomVoluto * f)); },
    esplora(si) { st.esplora = !!si; tela.style.opacity = si ? 1 : ''; },
    pronta: true
  };
  document.dispatchEvent(new Event('galassia-pronta'));

  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  let visibile = true;
  document.addEventListener('visibilitychange', () => { visibile = !document.hidden; if (visibile) requestAnimationFrame(giro); });

  let t0 = performance.now();
  function giro(ora) {
    if (!visibile) return;
    const t = (ora - t0) / 1000;
    const sc = scrollY / innerHeight;                 // 0 = apertura
    st.yaw += st.vy; st.pitch += st.vp; st.vy *= .93; st.vp *= .93;
    st.pitch = Math.max(-.9, Math.min(.9, st.pitch));
    st.zoom += (st.zoomVoluto - st.zoom) * .08;
    gruppo.rotation.y = (ridotto ? 0 : t * .035) + st.yaw + sc * .25;
    gruppo.rotation.x = .5 + st.pitch + Math.min(sc, 1.5) * .35;
    const dist = (piccolo ? 26 : 22) / st.zoom - Math.min(sc, 1) * 4;
    cam.position.set(mx * 2.2, 3.2 + my * -1.4 + Math.min(sc, 1) * 2, dist);
    cam.lookAt(0, 0, 0);
    cielo.rotation.y = t * .004;
    anello.material.opacity = .22 * Math.max(0, 1 - sc);
    mat.uniforms.uT.value = t;
    // lontano dall'apertura la galassia si attenua per lasciare leggere
    if (!st.esplora) tela.style.opacity = String(Math.max(.38, 1 - sc * .7));
    rend.render(scena, cam);
    if (!ridotto || st.esplora || st.vy || st.vp) requestAnimationFrame(giro);
    else setTimeout(() => requestAnimationFrame(giro), 250);
  }
  requestAnimationFrame(giro);
}
