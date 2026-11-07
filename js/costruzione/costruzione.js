// La scena dell'assemblaggio: un nucleo e otto alloggiamenti. I moduli arrivano da lontano, si orientano
// e si agganciano a filo; il nucleo si accende man mano. Titanio spazzolato, un solo accento caldo.
// Si carica solo quando la sezione è vicina (js/costruzione/avvio.js). Se qualcosa va storto, avvio.js
// ripiega sull'elenco: il contenuto vero è l'elenco, la scena lo accompagna.
import * as T from './vendor/three.ridotto.js';

const tela = document.getElementById('assembla-tela');
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BASE = 0x050810, ORO = 0xf3cd73, ORO_C = new T.Color(ORO);
const N = 8, RAGGIO = 2.15;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dolce = t => t * t * (3 - 2 * t);
const uscita = t => 1 - Math.pow(1 - t, 3);

const rend = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: false, powerPreference: 'high-performance' });
rend.setClearColor(BASE, 1);
rend.toneMapping = T.ACESFilmicToneMapping;
rend.toneMappingExposure = 1.05;
const scena = new T.Scene();
const cam = new T.PerspectiveCamera(34, 1, 0.1, 80);

// ambiente: una stanza buia con due strisce luminose, solo per dare riflessi veri al metallo
{
  const stanza = new T.Scene();
  const buio = new T.MeshBasicMaterial({ color: 0x141c28, side: T.BackSide });
  stanza.add(new T.Mesh(new T.BoxGeometry(20, 12, 20), buio));
  const striscia = (w, h, x, y, z, c, ry) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; stanza.add(m);
  };
  striscia(11, 1.4, 0, 5.4, 0, new T.Color(4, 4.2, 4.5), 0);
  striscia(9, 0.9, 0, -5.4, 0, new T.Color(1.2, 1.4, 1.7), 0);
  striscia(0.9, 8, 0, 0, -9, new T.Color(1.6, 1.7, 1.9), 0);
  striscia(1, 7, -9, 0, 2, new T.Color(1.4, 1.9, 2.6), Math.PI / 2);
  striscia(1, 6, 9, 0.5, -2, new T.Color(2.6, 1.9, 1.1), Math.PI / 2);
  const pm = new T.PMREMGenerator(rend);
  scena.environment = pm.fromScene(stanza, 0.04).texture;
  pm.dispose();
}

const titanio = new T.MeshPhysicalMaterial({ color: 0xbcc4ce, metalness: 0.92, roughness: 0.36, envMapIntensity: 1.35 });
const titanioScuro = new T.MeshPhysicalMaterial({ color: 0x5b6470, metalness: 0.9, roughness: 0.45, envMapIntensity: 1.0 });

/* ---- nucleo ---- */
const nucleo = new T.Group(); scena.add(nucleo);
const anima = new T.Mesh(new T.IcosahedronGeometry(0.42, 3), new T.MeshBasicMaterial({ color: ORO }));
nucleo.add(anima);
const reticolo = new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(0.62, 1)), new T.LineBasicMaterial({ color: ORO, transparent: true, opacity: 0.0 }));
nucleo.add(reticolo);
const anello = (r, sp, rx, ry) => {
  const m = new T.Mesh(new T.TorusGeometry(r, sp, 20, 160), titanio);
  m.rotation.set(rx, ry, 0); nucleo.add(m); return m;
};
const anelli = [anello(0.95, 0.018, Math.PI / 2.4, 0), anello(1.12, 0.012, Math.PI / 2, Math.PI / 4), anello(1.3, 0.008, 1.1, -0.6)];
const luceNucleo = new T.PointLight(ORO, 0, 9, 1.6); nucleo.add(luceNucleo);

/* ---- alloggiamenti e moduli ---- */
const LAR = 0.86, ALT = 0.5, PRO = 0.24;
const geoModulo = new T.RoundedBoxGeometry(LAR, ALT, PRO, 4, 0.045);
const geoBordo = new T.EdgesGeometry(new T.BoxGeometry(LAR + 0.04, ALT + 0.04, PRO + 0.04));
const geoStriscia = new T.PlaneGeometry(LAR * 0.7, 0.028);

const posti = [];
for (let i = 0; i < N; i++) {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2;
  const y = (i % 2 ? 0.34 : -0.34);
  const p = new T.Vector3(Math.cos(a) * RAGGIO, y, Math.sin(a) * RAGGIO);
  const g = new T.Group(); g.position.copy(p);
  g.lookAt(0, y, 0); g.rotateY(Math.PI);                       // il fronte guarda fuori
  scena.add(g);
  const bordo = new T.LineSegments(geoBordo, new T.LineBasicMaterial({ color: 0x7d93ad, transparent: true, opacity: 0.34 }));
  g.add(bordo);
  const tacche = new T.Mesh(new T.PlaneGeometry(LAR * 0.5, 0.012), new T.MeshBasicMaterial({ color: 0x7d93ad, transparent: true, opacity: 0.22 }));
  tacche.position.z = PRO / 2 + 0.003; g.add(tacche);
  posti.push({ g, bordo, tacche, p, y, modulo: null, collega: null });
}
// il filo che va dal modulo al nucleo
for (const s of posti) {
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array([0, 0, 0, s.p.x * 0.8, s.p.y * 0.8, s.p.z * 0.8]), 3));
  const seg = new T.LineSegments(geo, new T.LineBasicMaterial({ color: ORO, transparent: true, opacity: 0 }));
  scena.add(seg); s.collega = seg;
}

/* ---- polvere di fondo ---- */
const polvere = (() => {
  const n = 380, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 5 + Math.random() * 9, a = Math.random() * 6.283, b = (Math.random() - 0.5) * 6;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = b; pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
  const m = new T.Points(g, new T.PointsMaterial({ color: 0x9fb4cc, size: 0.028, transparent: true, opacity: 0.55, depthWrite: false }));
  scena.add(m); return m;
})();

/* ---- scintille dell'aggancio ---- */
const SC = 90;
const scPos = new Float32Array(SC * 3), scVel = new Float32Array(SC * 3), scVita = new Float32Array(SC);
const scGeo = new T.BufferGeometry(); scGeo.setAttribute('position', new T.BufferAttribute(scPos, 3));
const scintille = new T.Points(scGeo, new T.PointsMaterial({ color: ORO, size: 0.045, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending }));
scena.add(scintille);
let scCursore = 0;
function sprizza(p, n) {
  for (let k = 0; k < n; k++) {
    const i = scCursore++ % SC;
    scPos[i * 3] = p.x; scPos[i * 3 + 1] = p.y; scPos[i * 3 + 2] = p.z;
    const v = 0.4 + Math.random() * 1.1, a = Math.random() * 6.283, b = (Math.random() - 0.3) * 2;
    scVel[i * 3] = Math.cos(a) * v; scVel[i * 3 + 1] = b * v * 0.6; scVel[i * 3 + 2] = Math.sin(a) * v;
    scVita[i] = 0.5 + Math.random() * 0.5;
  }
}
for (let i = 0; i < SC; i++) scPos[i * 3 + 1] = -99;

/* ---- onda dell'aggancio ---- */
const onde = [];
function onda(p, colore) {
  const m = new T.Mesh(new T.TorusGeometry(0.4, 0.008, 8, 64), new T.MeshBasicMaterial({ color: colore, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending }));
  m.position.copy(p); m.lookAt(0, p.y, 0);
  scena.add(m); onde.push({ m, t: 0 });
}

/* ---- post-elaborazione: un bagliore misurato, niente di più ---- */
let comp = null, bloom = null;
try {
  comp = new T.EffectComposer(rend);
  comp.addPass(new T.RenderPass(scena, cam));
  bloom = new T.UnrealBloomPass(new T.Vector2(256, 256), 0.3, 0.6, 0.92);
  comp.addPass(bloom);
  comp.addPass(new T.OutputPass());
} catch (e) { comp = null; }

/* ---- stato ---- */
let livello = 0, livelloVisto = 0, voli = [], attaccati = 0, finito = false;
let px = 0, py = 0, pxv = 0, pyv = 0, t0 = performance.now(), ultimo = t0;
let dentro = false, visibile = !document.hidden, richiesto = false, larg = 0, alt = 0;

function misura() {
  const w = tela.clientWidth, h = tela.clientHeight;
  if (!w || !h || (w === larg && h === alt)) return;
  larg = w; alt = h;
  const dpr = Math.min(devicePixelRatio || 1, w < 520 ? 1.5 : 2);
  rend.setPixelRatio(dpr); rend.setSize(w, h, false);
  if (comp) { comp.setPixelRatio(dpr); comp.setSize(w, h); }
  cam.aspect = w / h;
  cam.fov = w / h < 1 ? 46 : 34;
  cam.updateProjectionMatrix();
}

function nuovoModulo(colore) {
  const g = new T.Group();
  g.add(new T.Mesh(geoModulo, titanio));
  const s = new T.Mesh(geoStriscia, new T.MeshBasicMaterial({ color: colore, side: T.DoubleSide }));
  s.position.set(0, -ALT * 0.22, PRO / 2 + 0.004); g.add(s);
  const lente = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.02, 24), titanioScuro);
  lente.rotation.x = Math.PI / 2; lente.position.set(-LAR * 0.3, ALT * 0.14, PRO / 2 + 0.006); g.add(lente);
  const punto = new T.Mesh(new T.SphereGeometry(0.016, 12, 12), new T.MeshBasicMaterial({ color: colore }));
  punto.position.set(-LAR * 0.3, ALT * 0.14, PRO / 2 + 0.018); g.add(punto);
  g.userData.striscia = s; g.userData.punto = punto;
  return g;
}

function aggancia(indice, colore) {
  return new Promise(risolvi => {
    const s = posti[indice % N];
    if (s.modulo) { risolvi(); return; }
    const c = new T.Color(colore || ORO);
    const m = nuovoModulo(c);
    scena.add(m); s.modulo = m;
    const dir = s.p.clone().normalize();
    const lat = new T.Vector3(-dir.z, 0, dir.x);
    const da = s.p.clone().addScaledVector(dir, 5.2).addScaledVector(lat, 2.4 * (indice % 2 ? 1 : -1)).add(new T.Vector3(0, 2.6 * (indice % 2 ? 1 : -1), 0));
    m.position.copy(da);
    m.quaternion.setFromEuler(new T.Euler(1.1, 0.8 * (indice % 2 ? 1 : -1), 0.6));
    const q1 = s.g.quaternion.clone();
    const durata = ridotto ? 0.001 : 1.15;
    voli.push({ s, m, da, durata, t: 0, q0: m.quaternion.clone(), q1, lat, risolvi, c });
    attaccati++;
    richiedi();
  });
}

function sistemaOnde(dt) {
  for (let i = onde.length - 1; i >= 0; i--) {
    const o = onde[i]; o.t += dt;
    const k = o.t / 0.9;
    if (k >= 1) { scena.remove(o.m); o.m.geometry.dispose(); o.m.material.dispose(); onde.splice(i, 1); continue; }
    o.m.scale.setScalar(1 + k * 2.6); o.m.material.opacity = 0.8 * (1 - k);
  }
}

function disegna(ora) {
  const dt = Math.min(0.05, (ora - ultimo) / 1000); ultimo = ora;
  const t = (ora - t0) / 1000;
  misura();

  // parallasse dolce col puntatore
  pxv += (px - pxv) * Math.min(1, dt * 3); pyv += (py - pyv) * Math.min(1, dt * 3);
  const orbita = ridotto ? 0.35 : t * 0.07;
  const ang = orbita + pxv * 0.45;
  const dist = cam.aspect < 1 ? 8.4 : 5.9;
  cam.position.set(Math.sin(ang) * dist, 1.35 + pyv * -0.5 + Math.sin(t * 0.21) * 0.12, Math.cos(ang) * dist);
  cam.lookAt(0, 0, 0);

  // nucleo: respira, si accende con il livello
  livelloVisto += (livello - livelloVisto) * Math.min(1, dt * 2.2);
  const respiro = 1 + Math.sin(t * 1.6) * 0.035 * (0.4 + livelloVisto);
  anima.scale.setScalar((0.42 + livelloVisto * 0.3) * respiro);
  anima.material.color.copy(ORO_C).multiplyScalar(0.3 + livelloVisto * 0.7);
  reticolo.material.opacity = clamp(livelloVisto * 1.1, 0, 0.7);
  reticolo.rotation.y = t * 0.35; reticolo.rotation.x = t * 0.21;
  luceNucleo.intensity = livelloVisto * 2.2;
  anelli[0].rotation.z = t * 0.5 * (0.2 + livelloVisto); anelli[1].rotation.z = -t * 0.34 * (0.2 + livelloVisto); anelli[2].rotation.x = 1.1 + Math.sin(t * 0.2) * 0.15;
  if (bloom) bloom.strength = 0.22 + livelloVisto * 0.22;

  // moduli in volo: si avvicinano, si orientano, si agganciano
  for (let i = voli.length - 1; i >= 0; i--) {
    const v = voli[i];
    v.t += dt;
    const k = clamp(v.t / v.durata, 0, 1);
    const e = uscita(k);
    const arrivo = v.s.p;
    // traiettoria curva: parte laterale, si raddrizza verso l'alloggiamento
    v.m.position.lerpVectors(v.da, arrivo, e);
    const curva = Math.sin(k * Math.PI) * 0.7;
    v.m.position.addScaledVector(v.lat, curva * (v.da.y > 0 ? 1 : -1));
    v.m.quaternion.slerpQuaternions(v.q0, v.q1, dolce(clamp((k - 0.15) / 0.75, 0, 1)));
    if (k >= 1) {
      v.m.position.copy(arrivo); v.m.quaternion.copy(v.q1);
      v.s.bordo.material.opacity = 0.0; v.s.tacche.material.opacity = 0;
      v.s.agganciato = ora;
      if (!ridotto) { onda(arrivo, v.c); sprizza(arrivo, 26); }
      v.risolvi();
      voli.splice(i, 1);
    }
  }

  // il filo verso il nucleo e il lampo dell'aggancio
  for (const s of posti) {
    if (!s.modulo) continue;
    const dopo = s.agganciato ? (ora - s.agganciato) / 1000 : 0;
    if (s.agganciato) {
      s.collega.material.opacity = clamp(dopo / 0.8, 0, 1) * (0.22 + livelloVisto * 0.3);
      const lampo = Math.max(0, 1 - dopo / 0.7);
            s.modulo.scale.setScalar(1 + lampo * 0.045);
    }
  }
  // scintille
  for (let i = 0; i < SC; i++) {
    if (scVita[i] <= 0) { scPos[i * 3 + 1] = -99; continue; }
    scVita[i] -= dt;
    scPos[i * 3] += scVel[i * 3] * dt; scPos[i * 3 + 1] += scVel[i * 3 + 1] * dt; scPos[i * 3 + 2] += scVel[i * 3 + 2] * dt;
    scVel[i * 3] *= 0.96; scVel[i * 3 + 1] *= 0.96; scVel[i * 3 + 2] *= 0.96;
  }
  scGeo.attributes.position.needsUpdate = true;
  sistemaOnde(dt);

  polvere.rotation.y = t * 0.012;

  if (comp) comp.render(); else rend.render(scena, cam);
}

/* ---- ciclo: gira solo quando serve ---- */
function ciclo(ora) {
  richiesto = false;
  if (!dentro || !visibile) return;
  disegna(ora);
  richiedi();
}
function richiedi() { if (!richiesto && dentro && visibile) { richiesto = true; ultimo = performance.now(); requestAnimationFrame(ciclo); } }

if ('IntersectionObserver' in window) {
  new IntersectionObserver(v => { dentro = v[0].isIntersecting; if (dentro) richiedi(); }, { rootMargin: '120px' }).observe(tela);
} else { dentro = true; }
document.addEventListener('visibilitychange', () => { visibile = !document.hidden; if (visibile) richiedi(); });
addEventListener('resize', () => { larg = 0; richiedi(); });
tela.parentElement.addEventListener('pointermove', e => {
  const r = tela.getBoundingClientRect();
  px = ((e.clientX - r.left) / r.width - 0.5) * 2; py = ((e.clientY - r.top) / r.height - 0.5) * 2;
});
tela.addEventListener('webglcontextlost', e => { e.preventDefault(); dentro = false; window.dispatchEvent(new CustomEvent('costruzione-persa')); });

function reset() {
  for (const v of voli) { v.risolvi(); }
  voli = [];
  for (const s of posti) {
    if (s.modulo) { scena.remove(s.modulo); s.modulo.traverse(o => { if (o.material && o.material !== titanio && o.material !== titanioScuro) o.material.dispose(); }); s.modulo = null; }
    s.agganciato = 0; s.collega.material.opacity = 0;
    s.bordo.material.opacity = 0.34; s.tacche.material.opacity = 0.22;
  }
  livello = 0; attaccati = 0; finito = false;
  richiedi();
}

window.Costruzione = {
  posti: N,
  aggancia,
  reset,
  nucleo(f) { livello = clamp(f, 0, 1); richiedi(); },
  pronto() { finito = true; livello = 1; richiedi(); },
};
misura();
rend.render(scena, cam);
window.dispatchEvent(new CustomEvent('costruzione-pronta'));
