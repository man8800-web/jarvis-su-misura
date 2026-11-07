// «Una giornata sul tuo mestiere», la parte 3D: il corpo del telefono (titanio e vetro), un alone del colore
// del mestiere e i messaggi che volano verso il telefono o partono da lì, guidati dallo scorrimento.
// Lo schermo NON è disegnato qui: è HTML vero (giornata-mestiere.js) che segue i quattro angoli del vetro
// proiettati a ogni fotogramma. Stessa copia di Three.js della sezione «si assembla»: niente scaricamenti doppi.
import * as T from './costruzione/vendor/three.ridotto.js';

const tela = document.querySelector('#mestiere .mg-tela');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dolce = t => t * t * (3 - 2 * t);

// misure in unità di scena: il vetro ha le stesse proporzioni dello schermo HTML (320 × 692)
const SW = 0.69, SH = SW * 692 / 320, CORNICE = 0.03;
const W = SW + CORNICE * 2, H = SH + CORNICE * 2, R = 0.118;
const PROF = 0.06, SMUSSO = 0.012, FRONTE = PROF / 2 + SMUSSO;

let rend;
try {
  rend = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { rend = null; }
if (!rend) { window.dispatchEvent(new Event('telefono3d-perso')); throw new Error('niente WebGL'); }
rend.setClearColor(0x000000, 0);
rend.toneMapping = T.ACESFilmicToneMapping;
rend.toneMappingExposure = 1.08;
const scena = new T.Scene();
const cam = new T.PerspectiveCamera(24, 1, 0.1, 40);

// ambiente: una stanza buia con strisce di luce, per riflessi veri sul metallo e sul vetro
{
  const stanza = new T.Scene();
  stanza.add(new T.Mesh(new T.BoxGeometry(20, 12, 20), new T.MeshBasicMaterial({ color: 0x0d131d, side: T.BackSide })));
  const striscia = (w, h, x, y, z, c, ry) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry || 0; stanza.add(m);
  };
  striscia(10, 1.2, 0, 5.4, 0, new T.Color(3.6, 3.8, 4.2), 0);
  striscia(1.1, 8, -8.5, 0, 1, new T.Color(1.3, 2.0, 2.8), Math.PI / 2);
  striscia(0.8, 7, 8.5, 0.5, -1, new T.Color(2.8, 2.0, 1.1), Math.PI / 2);
  striscia(6, 0.7, 0, -5.4, 0, new T.Color(1.0, 1.2, 1.5), 0);
  striscia(4, 6, 0, 0, 9, new T.Color(0.7, 0.8, 1.0), 0);
  const pm = new T.PMREMGenerator(rend);
  scena.environment = pm.fromScene(stanza, 0.04).texture;
  pm.dispose();
}

function rettangolo(w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ---- il telefono ---- */
const telefono = new T.Group(); scena.add(telefono);
const corpoGeo = new T.ExtrudeGeometry(rettangolo(W - SMUSSO * 2, H - SMUSSO * 2, R - SMUSSO), { depth: PROF, bevelEnabled: true, bevelThickness: SMUSSO, bevelSize: SMUSSO, bevelSegments: 5, curveSegments: 18 });
corpoGeo.translate(0, 0, -PROF / 2);
const titanio = new T.MeshPhysicalMaterial({ color: 0x8c96a3, metalness: 0.95, roughness: 0.3, envMapIntensity: 1.25, clearcoat: 0.3, clearcoatRoughness: 0.4 });
telefono.add(new T.Mesh(corpoGeo, titanio));
// il vetro davanti: nero profondo, lucido
const vetroGeo = new T.ExtrudeGeometry(rettangolo(W - 0.012, H - 0.012, R - 0.006), { depth: 0.002, bevelEnabled: false, curveSegments: 18 });
const vetro = new T.Mesh(vetroGeo, new T.MeshPhysicalMaterial({ color: 0x020307, metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }));
vetro.position.z = FRONTE - 0.0005; telefono.add(vetro);
// tasti laterali
const tasto = (x, y, h) => {
  const m = new T.Mesh(new T.BoxGeometry(0.012, h, 0.03), titanio);
  m.position.set(x, y, 0); telefono.add(m);
};
tasto(-W / 2 - 0.004, 0.42, 0.07); tasto(-W / 2 - 0.004, 0.27, 0.13); tasto(-W / 2 - 0.004, 0.11, 0.13); tasto(W / 2 + 0.004, 0.3, 0.2);
// il dorso con le fotocamere (si vede di sbieco)
{
  const isola = new T.Mesh(new T.ExtrudeGeometry(rettangolo(0.27, 0.27, 0.07), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), titanio);
  isola.position.set(-W / 2 + 0.2, H / 2 - 0.2, -FRONTE - 0.012); telefono.add(isola);
  const lente = new T.MeshPhysicalMaterial({ color: 0x05070c, metalness: 0.2, roughness: 0.05, clearcoat: 1 });
  [[-0.055, 0.055], [0.055, -0.055], [-0.055, -0.055]].forEach(([x, y]) => {
    const l = new T.Mesh(new T.CylinderGeometry(0.042, 0.042, 0.02, 28), lente);
    l.rotation.x = Math.PI / 2; l.position.set(-W / 2 + 0.2 + x, H / 2 - 0.2 + y, -FRONTE - 0.022); telefono.add(l);
  });
}

/* ---- alone del mestiere ---- */
function sfumatura() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
const morbido = sfumatura();
const alone = new T.Mesh(new T.PlaneGeometry(1.5, 2.3), new T.MeshBasicMaterial({ map: morbido, color: 0x5ad7ff, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
alone.position.z = -0.9; scena.add(alone);
const anello = new T.Mesh(new T.TorusGeometry(0.56, 0.004, 8, 120), new T.MeshBasicMaterial({ color: 0x5ad7ff, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false }));
anello.rotation.x = Math.PI / 2.15; anello.position.y = -H / 2 - 0.06; scena.add(anello);

/* ---- i messaggi in volo ---- */
const COLORI = { in: new T.Color(0x5ad7ff), out: new T.Color(0x5fe3a1), oro: new T.Color(0xf3cd73) };
const bollaGeo = new T.ExtrudeGeometry(rettangolo(0.25, 0.14, 0.05), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 8 });
bollaGeo.center();
const bolle = [];
for (let i = 0; i < 10; i++) {
  const g = new T.Group();
  const m = new T.Mesh(bollaGeo, new T.MeshBasicMaterial({ color: 0x5ad7ff, transparent: true }));
  const riga1 = new T.Mesh(new T.PlaneGeometry(0.15, 0.016), new T.MeshBasicMaterial({ color: 0x03111a, transparent: true, opacity: 0.55 }));
  const riga2 = riga1.clone(); riga2.scale.x = 0.62;
  riga1.position.set(-0.01, 0.02, 0.0125); riga2.position.set(-0.038, -0.022, 0.0125);
  const luce = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshBasicMaterial({ map: morbido, color: 0x5ad7ff, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
  luce.position.z = -0.02;
  g.add(luce, m, riga1, riga2); g.visible = false; scena.add(g);
  bolle.push({ g, m, luce, righe: [riga1, riga2] });
}
const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(), Pv = new T.Vector3();
function bezier(a, b, c, t, out) {
  const u = 1 - t;
  return out.set(u * u * a.x + 2 * u * t * b.x + t * t * c.x, u * u * a.y + 2 * u * t * b.y + t * t * c.y, u * u * a.z + 2 * u * t * b.z + t * t * c.z);
}
function posaVoli(voli) {
  bolle.forEach(b => { b.g.visible = false; });
  voli.slice(0, bolle.length).forEach((v, k) => {
    const b = bolle[k];
    if (v.t <= 0.001 || v.t >= 0.999) return;
    const t = dolce(v.t), col = v.oro ? COLORI.oro : COLORI[v.dir];
    const ang = v.n > 1 ? (v.i / (v.n - 1) - 0.5) * 1.5 : 0;
    // i messaggi dei clienti arrivano da lontano, a sinistra; le risposte partono verso destra
    if (v.dir === 'in') { A.set(-2.3, 1.05, 1.1); B.set(-1.2, 1.25, 0.9); C.set(0.0, 0.55, FRONTE + 0.05); }
    else { A.set(0.05, -0.05, FRONTE + 0.05); B.set(0.9, 0.35 + ang * 0.4, 0.8); C.set(2.4, 0.4 + ang * 1.0, 0.4 + Math.abs(ang) * 0.3); }
    bezier(A, B, C, t, Pv);
    b.g.position.copy(Pv);
    const vicino = v.dir === 'in' ? 1 - clamp((t - 0.78) / 0.22, 0, 1) : clamp(t / 0.16, 0, 1);
    const lontano = v.dir === 'in' ? clamp(t / 0.12, 0, 1) : 1 - clamp((t - 0.82) / 0.18, 0, 1);
    const a = Math.min(vicino, lontano), s = v.dir === 'in' ? 1 - t * 0.45 : 0.55 + t * 0.6;
    b.g.scale.setScalar(Math.max(0.01, s));
    b.g.rotation.set(0, (v.dir === 'in' ? 0.5 : -0.5) * (1 - t), (v.dir === 'in' ? -0.15 : 0.12) * (1 - t));
    b.m.material.color.copy(col); b.luce.material.color.copy(col);
    b.m.material.opacity = a; b.luce.material.opacity = 0.5 * a; b.righe.forEach(r => { r.material.opacity = 0.55 * a; });
    b.g.visible = a > 0.01;
  });
}

/* ---- inquadratura, misura, proiezione ---- */
// le misure arrivano dal ResizeObserver: leggerle a ogni fotogramma costringerebbe la pagina a ricalcolarsi
let cssW = 0, cssH = 0, daMisurare = true;
function misura() {
  if (!daMisurare) return cssW > 0 && cssH > 0;
  daMisurare = false;
  if (!cssW || !cssH) return false;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  rend.setPixelRatio(dpr); rend.setSize(cssW, cssH, false);
  cam.aspect = cssW / cssH;
  const tan = Math.tan(T.MathUtils.degToRad(cam.fov / 2));
  const d = Math.max((H + 0.12) / 0.9, (W + 0.36) / 0.9 / cam.aspect) / (2 * tan);
  cam.position.set(0, 0, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
  return true;
}
const angoli = [new T.Vector3(-SW / 2, SH / 2, 0), new T.Vector3(SW / 2, SH / 2, 0), new T.Vector3(SW / 2, -SH / 2, 0), new T.Vector3(-SW / 2, -SH / 2, 0)];
const V = new T.Vector3();
function proietta() {
  const q = [];
  for (const a of angoli) {
    V.set(a.x, a.y, FRONTE + 0.0016).applyMatrix4(telefono.matrixWorld).project(cam);
    if (V.z > 1) return null;
    q.push([(V.x + 1) / 2 * cssW, (1 - V.y) / 2 * cssH]);
  }
  return q;
}

/* ---- il giro: si disegna solo quando qualcosa cambia (scorrimento, inerzia, messaggi in volo) ---- */
let fonte = null, visibile = false, attivo = false, ultimo = 0, fermi = 0;
const cur = { ry: 0.1, rx: -0.05 }, misure = [];
const coloreAlone = new T.Color(0x5ad7ff);
let coloreScritto = '';
function giro(ora) {
  if (!visibile || document.hidden || !fonte) { attivo = false; return; }
  const dt = Math.min(0.05, (ora - (ultimo || ora)) / 1000);
  if (ultimo) { misure.push(ora - ultimo); if (misure.length > 240) misure.shift(); }
  ultimo = ora;
  if (!misura()) { attivo = false; return; }
  const s = fonte.stato(), k = 1 - Math.exp(-dt * 7);
  const dy = s.ry - cur.ry, dx = s.rx - cur.rx;
  cur.ry += dy * k; cur.rx += dx * k;
  telefono.rotation.set(cur.rx, cur.ry, 0);
  if (s.colore && s.colore !== coloreScritto) { coloreScritto = s.colore; coloreAlone.set(s.colore); alone.material.color.copy(coloreAlone); anello.material.color.copy(coloreAlone); }
  anello.rotation.z = cur.ry * 2;
  const voli = s.voli || [];
  posaVoli(voli);
  rend.render(scena, cam);
  telefono.updateMatrixWorld();
  fonte.proiezione(proietta(), cur.ry);
  // fermo da qualche fotogramma e niente in volo: il giro si spegne finché lo scorrimento non lo risveglia
  const inVolo = voli.some(v => v.t > 0.001 && v.t < 0.999);
  fermi = (Math.abs(dy) < 0.0004 && Math.abs(dx) < 0.0004 && !inVolo) ? fermi + 1 : 0;
  if (fermi > 3) { attivo = false; ultimo = 0; return; }
  requestAnimationFrame(giro);
}
function avvia() { fermi = 0; if (attivo || !visibile || !fonte) return; attivo = true; ultimo = 0; requestAnimationFrame(giro); }
new IntersectionObserver(v => { visibile = v[0].isIntersecting; avvia(); }, { rootMargin: '80px' }).observe(tela);
new ResizeObserver(v => { const r = v[0].contentRect; cssW = r.width; cssH = r.height; daMisurare = true; avvia(); }).observe(tela);
document.addEventListener('visibilitychange', avvia);
tela.addEventListener('webglcontextlost', e => { e.preventDefault(); attivo = false; fonte = null; window.dispatchEvent(new Event('telefono3d-perso')); });

window.Telefono3D = {
  collega(f) { fonte = f; daMisurare = true; avvia(); },
  // lo scorrimento risveglia il giro
  sveglia: avvia,
  // tempi tra un fotogramma e l'altro (ultimi 240): servono alla prova dei 60 fps
  misure() {
    if (!misure.length) return null;
    const o = misure.slice().sort((a, b) => a - b), media = misure.reduce((a, b) => a + b, 0) / misure.length;
    return { fotogrammi: misure.length, fps: +(1000 / media).toFixed(1), p95ms: +o[Math.floor(o.length * 0.95)].toFixed(1), azzera() { misure.length = 0; } };
  },
  azzera() { misure.length = 0; }
};
window.dispatchEvent(new Event('telefono3d-pronto'));
