// «La squadra al lavoro», la parte 3D: una sala rotonda con una postazione per specialista attorno al nucleo di Jarvis
// (idea del quartier generale di Jarvis, rifatta leggera per il telefono). Ogni specialista è un manichino stilizzato
// con la visiera del suo colore, seduto alla scrivania, che batte sui tasti davanti a uno schermo olografico.
// I compiti volano dal nucleo alla postazione, poi al revisore, poi tornano al nucleo ad aspettare il sì.
// I pulsanti NON sono qui: sono HTML vero (squadra-lavoro.js) che segue le teste proiettate a ogni fotogramma.
// Stessa copia di Three.js delle altre sezioni 3D: niente scaricamenti doppi.
import * as T from './costruzione/vendor/three.ridotto.js';

const tela = document.querySelector('#al-lavoro .sl-tela');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let rend;
try {
  rend = new T.WebGLRenderer({ canvas: tela, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) { rend = null; }
if (!rend) { window.dispatchEvent(new Event('sala3d-perso')); throw new Error('niente WebGL'); }
rend.setClearColor(0x040811, 1);
rend.toneMapping = T.ACESFilmicToneMapping;
rend.toneMappingExposure = 1.1;
rend.outputColorSpace = T.SRGBColorSpace;
const scena = new T.Scene();
const cam = new T.PerspectiveCamera(34, 1, 0.1, 80);
const SRGB = t => (t.colorSpace = T.SRGBColorSpace, t);
const additivo = (o = {}) => new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false, ...o });
function tela2D(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return SRGB(new T.CanvasTexture(c)); }

// ambiente: una stanza buia con strisce di luce, per i riflessi sul metallo
{
  const stanza = new T.Scene();
  stanza.add(new T.Mesh(new T.BoxGeometry(30, 14, 30), new T.MeshBasicMaterial({ color: 0x0a1220, side: T.BackSide })));
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, m = new T.Mesh(new T.PlaneGeometry(3, 1.4), new T.MeshBasicMaterial({ color: new T.Color().setHSL((190 + i * 14) / 360, .7, i % 2 ? .35 : .55), side: T.DoubleSide }));
    m.position.set(Math.cos(a) * 12, 3, Math.sin(a) * 12); m.lookAt(0, 3, 0); stanza.add(m);
  }
  const tetto = new T.Mesh(new T.PlaneGeometry(10, 10), new T.MeshBasicMaterial({ color: 0x9fd8ff, side: T.DoubleSide }));
  tetto.position.y = 6.8; tetto.rotation.x = Math.PI / 2; stanza.add(tetto);
  const pm = new T.PMREMGenerator(rend);
  scena.environment = pm.fromScene(stanza, 0.04).texture;
  pm.dispose();
}
const sole = new T.DirectionalLight(0xe4eeff, 1.4); sole.position.set(4, 10, 7); scena.add(sole);
const luceJ = new T.PointLight(0x5ad7ff, 22, 9, 1.6); luceJ.position.set(0, 1.6, 0); scena.add(luceJ);

/* ---- pavimento: disco scuro e griglia di cerchi ---- */
const R = 3.3;
const pav = new T.Mesh(new T.CylinderGeometry(R + 2.2, R + 2.2, 0.06, 72), new T.MeshPhysicalMaterial({ color: 0x060a12, roughness: .32, metalness: .85, envMapIntensity: .5 }));
pav.position.y = -0.03; scena.add(pav);
const griglia = new T.Mesh(new T.PlaneGeometry(2 * (R + 2.2), 2 * (R + 2.2)), additivo({ opacity: .55, map: tela2D(512, 512, (x, w) => {
  const c = w / 2; x.strokeStyle = 'rgba(92,214,255,.32)'; x.lineWidth = 1.2;
  for (let r = 40; r < c; r += 36) { x.beginPath(); x.arc(c, c, r, 0, 6.283); x.stroke(); }
  x.strokeStyle = 'rgba(92,214,255,.14)';
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; x.beginPath(); x.moveTo(c + Math.cos(a) * 40, c + Math.sin(a) * 40); x.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); x.stroke(); }
  const g = x.createRadialGradient(c, c, 0, c, c, c); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = g; x.fillRect(0, 0, w, w);
}) }));
griglia.rotation.x = -Math.PI / 2; griglia.position.y = 0.005; scena.add(griglia);
const SFUMA = tela2D(128, 128, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });

/* ---- il nucleo di Jarvis ---- */
const nucleo = new T.Group(); nucleo.position.y = 1.35; scena.add(nucleo);
const sfera = new T.Mesh(new T.SphereGeometry(.34, 32, 20), new T.MeshBasicMaterial({ color: 0xbff1ff, toneMapped: false }));
nucleo.add(sfera);
const alone = new T.Mesh(new T.PlaneGeometry(2.6, 2.6), additivo({ map: SFUMA, color: 0x5ad7ff, opacity: .9 }));
nucleo.add(alone);
const ANELLI = [[.62, .3, .5], [.8, -.25, -.36], [.98, .14, .24]].map(([r, tilt, v], i) => {
  const m = new T.Mesh(new T.TorusGeometry(r, .012, 6, 96), additivo({ color: i === 1 ? 0x9fa8ff : 0x5ad7ff, opacity: .85 }));
  m.rotation.x = Math.PI / 2 + tilt; nucleo.add(m); return { m, v };
});
const colonna = new T.Mesh(new T.CylinderGeometry(.5, .75, 3, 32, 1, true), additivo({ color: 0x5ad7ff, opacity: .07 }));
colonna.position.y = 1.5; scena.add(colonna);
const piede = new T.Mesh(new T.PlaneGeometry(2.4, 2.4), additivo({ map: SFUMA, color: 0x5ad7ff, opacity: .5 }));
piede.rotation.x = -Math.PI / 2; piede.position.y = .01; scena.add(piede);

/* ---- gli schermi: un solo foglio disegnato (4 x 2 riquadri), ogni schermo ne prende uno con le sue coordinate ---- */
const SC = { w: 160, h: 96, col: 4 };
const fogli = document.createElement('canvas'); fogli.width = SC.w * SC.col; fogli.height = SC.h * 2;
const fx = fogli.getContext('2d');
const texSchermi = SRGB(new T.CanvasTexture(fogli));
const matSchermi = additivo({ map: texSchermi, opacity: .95 });

/* ---- materiali e forme comuni ---- */
const GEO = {
  piano: new T.RoundedBoxGeometry(1.15, .05, .56, 2, .02), gamba: new T.BoxGeometry(1.0, .66, .05), filo: new T.BoxGeometry(1.15, .014, .02),
  seduta: new T.BoxGeometry(.44, .06, .42), schienale: new T.BoxGeometry(.44, .5, .05),
  busto: new T.CylinderGeometry(.15, .19, .5, 14), testa: new T.SphereGeometry(.13, 18, 12), visiera: new T.BoxGeometry(.2, .045, .05),
  braccio: new T.CylinderGeometry(.042, .036, .42, 8), coscia: new T.BoxGeometry(.13, .1, .36), schermo: new T.PlaneGeometry(1.0, .6),
  bagliore: new T.PlaneGeometry(1.9, 1.9), aureola: new T.TorusGeometry(.24, .014, 6, 48)
};
const MAT = {
  banco: new T.MeshPhysicalMaterial({ color: 0x31435c, roughness: .3, metalness: .75, envMapIntensity: 1.4 }),
  corpo: new T.MeshPhysicalMaterial({ color: 0xdfe7f1, roughness: .38, metalness: .15, envMapIntensity: .9 }),
  scuro: new T.MeshPhysicalMaterial({ color: 0x3a4658, roughness: .5, metalness: .4, envMapIntensity: .7 })
};

let postazioni = [], fili = null, versioneFatta = -1;
function svuota() {
  for (const p of postazioni) {
    scena.remove(p.g);
    p.g.traverse(o => { if (o.userData.geo) o.geometry.dispose(); if (o.userData.mat) o.material.dispose(); });
  }
  postazioni = [];
  if (fili) { scena.remove(fili); fili.geometry.dispose(); fili.material.dispose(); fili = null; }
}
function costruisci(colori) {
  svuota();
  const n = colori.length;
  colori.forEach((hex, i) => {
    const c = new T.Color(hex), a = i / n * Math.PI * 2;
    const g = new T.Group(); g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); g.rotation.y = a; scena.add(g);
    // locale: -z guarda il nucleo. Scrivania verso il nucleo, specialista dietro, rivolto al nucleo.
    const piano = new T.Mesh(GEO.piano, MAT.banco); piano.position.set(0, .72, -.12); g.add(piano);
    const gamba = new T.Mesh(GEO.gamba, MAT.banco); gamba.position.set(0, .37, -.36); g.add(gamba);
    const filo = new T.Mesh(GEO.filo, new T.MeshBasicMaterial({ color: c, toneMapped: false })); filo.userData.mat = true; filo.position.set(0, .72, .16); g.add(filo);
    const seduta = new T.Mesh(GEO.seduta, MAT.scuro); seduta.position.set(0, .44, .5); g.add(seduta);
    const schienale = new T.Mesh(GEO.schienale, MAT.scuro); schienale.position.set(0, .72, .72); schienale.rotation.x = -.12; g.add(schienale);
    // lo specialista
    const corpo = new T.Group(); corpo.position.set(0, 0, .46); g.add(corpo);
    const busto = new T.Mesh(GEO.busto, MAT.corpo); busto.position.y = .76; busto.rotation.x = .12; corpo.add(busto);
    const testa = new T.Mesh(GEO.testa, MAT.corpo); testa.position.set(0, 1.14, -.04); corpo.add(testa);
    const visiera = new T.Mesh(GEO.visiera, new T.MeshBasicMaterial({ color: c, toneMapped: false })); visiera.userData.mat = true; visiera.position.set(0, .01, -.11); testa.add(visiera);
    for (const s of [-1, 1]) { const k = new T.Mesh(GEO.coscia, MAT.corpo); k.position.set(s * .09, .5, -.12); corpo.add(k); }
    const braccia = [-1, 1].map(s => {
      const perno = new T.Group(); perno.position.set(s * .2, .97, -.02); corpo.add(perno);
      const b = new T.Mesh(GEO.braccio, MAT.corpo); b.position.y = -.21; perno.add(b);
      perno.rotation.x = -1.05; perno.rotation.z = s * .12; return perno;
    });
    // lo schermo olografico, rivolto allo specialista
    const geoS = GEO.schermo.clone(), uv = geoS.attributes.uv, cx = i % SC.col, cy = Math.floor(i / SC.col) % 2;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (cx + uv.getX(k)) / SC.col, 1 - (cy + 1 - uv.getY(k)) / 2);
    const schermo = new T.Mesh(geoS, matSchermi); schermo.userData.geo = true; schermo.position.set(0, 1.2, -.3); schermo.rotation.x = -.18; schermo.renderOrder = 2; g.add(schermo);
    const bagliore = new T.Mesh(GEO.bagliore, additivo({ map: SFUMA, color: c, opacity: .28 })); bagliore.userData.mat = true;
    bagliore.rotation.x = -Math.PI / 2; bagliore.position.set(0, .015, .05); g.add(bagliore);
    const aureola = new T.Mesh(GEO.aureola, additivo({ color: c, opacity: 0 })); aureola.userData.mat = true;
    aureola.rotation.x = Math.PI / 2; aureola.position.set(0, 1.5, .42); g.add(aureola);
    postazioni.push({ g, a, c, corpo, testa, braccia, bagliore, aureola, fase: i * 1.7, colpo: 0, luce: .3, sel: 0, cella: [cx, cy], ritmo: 0 });
  });
  // fili dal nucleo a ogni postazione, colorati per stato
  const pos = new Float32Array(n * 6), col = new Float32Array(n * 6);
  colori.forEach((hex, i) => {
    const a = i / n * Math.PI * 2, d = R - .7;
    pos.set([Math.sin(a) * .45, .03, Math.cos(a) * .45, Math.sin(a) * d, .03, Math.cos(a) * d], i * 6);
  });
  const gf = new T.BufferGeometry(); gf.setAttribute('position', new T.BufferAttribute(pos, 3)); gf.setAttribute('color', new T.BufferAttribute(col, 3));
  fili = new T.LineSegments(gf, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scena.add(fili);
}

/* ---- il compito che vola: una scintilla con la scia ---- */
const scia = [];
for (let k = 0; k < 7; k++) {
  const m = new T.Mesh(new T.PlaneGeometry(1, 1), additivo({ map: SFUMA, color: 0xffffff, opacity: 1 - k / 7 }));
  m.scale.setScalar(.55 - k * .06); m.visible = false; scena.add(m); scia.push(m);
}
const A = new T.Vector3(), B = new T.Vector3(), M = new T.Vector3(), Pv = new T.Vector3();
function punto(i, out) {
  if (i < 0 || !postazioni[i]) return out.set(0, 1.35, 0);
  const p = postazioni[i]; return out.set(Math.sin(p.a) * (R - .3), 1.25, Math.cos(p.a) * (R - .3));
}
function lungoArco(t, out) {
  const u = 1 - t; out.set(0, 0, 0).addScaledVector(A, u * u).addScaledVector(M, 2 * u * t).addScaledVector(B, t * t); return out;
}

/* ---- disegno degli schermi: righe di testo finte che si scrivono, barra d'avanzamento, spunta quando è fatto ---- */
function disegnaSchermi(stati, colori, ora) {
  fx.clearRect(0, 0, fogli.width, fogli.height);
  postazioni.forEach((p, i) => {
    const [cx, cy] = p.cella, x0 = cx * SC.w, y0 = cy * SC.h, w = SC.w, h = SC.h, st = stati[i], col = colori[i];
    fx.save(); fx.translate(x0, y0);
    fx.fillStyle = 'rgba(8,20,34,.9)'; fx.fillRect(3, 3, w - 6, h - 6);
    fx.strokeStyle = col; fx.globalAlpha = .9; fx.lineWidth = 2; fx.strokeRect(4, 4, w - 8, h - 8); fx.globalAlpha = 1;
    fx.fillStyle = col; fx.fillRect(10, 11, 34, 6); fx.globalAlpha = .45; fx.fillRect(48, 11, 22, 6); fx.globalAlpha = 1;
    const vel = st === 'lavora' || st === 'controlla' ? 3.2 : st === 'riceve' ? 1.6 : .45;
    p.ritmo += vel * .12;
    const righe = 5, scritte = p.ritmo % (righe + 2);
    for (let r = 0; r < righe; r++) {
      const larg = 30 + ((i * 37 + r * 53) % 80), pieno = clamp(scritte - r, 0, 1);
      fx.fillStyle = 'rgba(190,225,255,.22)'; fx.fillRect(10, 26 + r * 10, larg, 4);
      if (pieno > 0) { fx.fillStyle = 'rgba(220,240,255,.85)'; fx.fillRect(10, 26 + r * 10, larg * pieno, 4); }
    }
    if (st === 'lavora' || st === 'controlla' || st === 'riceve') {
      const avanz = (ora / (st === 'controlla' ? 1900 : 2500) + i * .3) % 1;
      fx.fillStyle = 'rgba(255,255,255,.12)'; fx.fillRect(10, h - 18, w - 20, 6);
      fx.fillStyle = col; fx.fillRect(10, h - 18, (w - 20) * avanz, 6);
    }
    if (st === 'fatto' || st === 'controlla') {
      fx.strokeStyle = st === 'fatto' ? '#5fe3a1' : col; fx.lineWidth = 5; fx.lineCap = 'round';
      fx.beginPath(); fx.moveTo(w - 46, 40); fx.lineTo(w - 36, 50); fx.lineTo(w - 18, 30); fx.stroke();
    }
    fx.restore();
  });
  texSchermi.needsUpdate = true;
}

/* ---- misure e inquadratura: tutta la sala dentro la tela, in verticale e in orizzontale ---- */
let cssW = 0, cssH = 0, daMisurare = true, pxMax = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.5 : 2), dist = 12;
const EL = .72;   // elevazione della camera (radianti)
function misura() {
  if (!daMisurare) return cssW > 0 && cssH > 0;
  daMisurare = false;
  if (!cssW || !cssH) return false;
  const px = Math.min(pxMax, Math.sqrt(1.4e6 / (cssW * cssH)));
  rend.setPixelRatio(Math.max(1, px)); rend.setSize(cssW, cssH, false);
  cam.aspect = cssW / cssH;
  const tanV = Math.tan(cam.fov * Math.PI / 360), tanH = tanV * cam.aspect, raggio = R + .95;
  dist = Math.max(raggio / tanH, (raggio * Math.sin(EL) + 1.25) / tanV) + raggio * .12;
  cam.updateProjectionMatrix();
  return true;
}

/* ---- il giro: gira solo quando la sala è sullo schermo ---- */
let fonte = null, visibile = false, attivo = false, ultimo = 0, versione = -1, az = 0, azVoluto = 0, vagare = 0, ultimoSchermo = 0;
const misure = [];
let lenti = 0, finestra = 0, nFin = 0, ridottoPx = false;
const coloreJ = new T.Color(0x5ad7ff), oro = new T.Color(0xf3cd73), tmp = new T.Color(), Vp = new T.Vector3();
function giro(ora) {
  if (!visibile || document.hidden || !fonte) { attivo = false; ultimo = 0; return; }
  const dt = Math.min(.05, (ora - (ultimo || ora)) / 1000);
  if (ultimo) {
    const d = ora - ultimo; misure.push(d); if (misure.length > 240) misure.shift();
    // tela troppo lenta: prima meno pixel, poi si torna al 2D (mai per un singolo scatto)
    finestra += d; nFin++;
    if (finestra > 2000) {
      const media = finestra / nFin; finestra = 0; nFin = 0;
      if (media > 40 && !/[?&]sala3d=1\b/.test(location.search)) {
        if (!ridottoPx) { ridottoPx = true; pxMax = 1; daMisurare = true; }
        else if (++lenti >= 2) { ferma(); window.dispatchEvent(new Event('sala3d-perso')); return; }
      } else lenti = 0;
    }
  }
  ultimo = ora;
  if (!misura()) { attivo = false; return; }
  const s = fonte.stato();
  if (s.versione !== versione) { versione = s.versione; costruisci(s.colori); }
  const n = postazioni.length, t = ora / 1000;

  // camera: lo specialista scelto viene davanti (si vede il suo schermo da sopra la spalla); senza scelta, ondeggia piano
  if (s.sel >= 0 && postazioni[s.sel]) azVoluto = postazioni[s.sel].a;
  else if (!s.fermo) { vagare += dt * .1; azVoluto = Math.sin(vagare) * .45; }
  let dAz = ((azVoluto - az + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  az += dAz * (1 - Math.exp(-dt * 2.6));
  cam.position.set(Math.sin(az) * Math.cos(EL) * dist, Math.sin(EL) * dist + .4, Math.cos(az) * Math.cos(EL) * dist);
  cam.lookAt(0, .55, 0);

  // nucleo: respira; oro quando un lavoro aspetta il sì
  const attesa = s.centro === 'attesa';
  tmp.copy(attesa ? oro : coloreJ);
  alone.material.color.lerp(tmp, 1 - Math.exp(-dt * 4)); piede.material.color.copy(alone.material.color); luceJ.color.copy(alone.material.color);
  const resp = 1 + Math.sin(t * (attesa ? 4 : 1.6)) * (attesa ? .08 : .035);
  sfera.scale.setScalar(resp); alone.scale.setScalar(resp * (attesa ? 1.2 : 1));
  alone.quaternion.copy(cam.quaternion);
  for (const { m, v } of ANELLI) m.rotation.z += v * dt;

  // postazioni
  const col = fili ? fili.geometry.attributes.color : null;
  postazioni.forEach((p, i) => {
    const st = s.stati[i] || 'riposo', scelto = s.sel === i;
    const forte = st === 'lavora' || st === 'controlla' ? 1 : st === 'riceve' ? .6 : st === 'fatto' ? .45 : .12;
    p.luce += (forte - p.luce) * (1 - Math.exp(-dt * 5));
    p.sel += ((scelto ? 1 : 0) - p.sel) * (1 - Math.exp(-dt * 6));
    // le mani sui tasti: più veloci quando lavora
    const v = st === 'lavora' || st === 'controlla' ? 15 : 4.5, amp = st === 'lavora' || st === 'controlla' ? .16 : .06;
    p.braccia[0].rotation.x = -1.05 + Math.sin(t * v + p.fase) * amp;
    p.braccia[1].rotation.x = -1.05 + Math.sin(t * v + p.fase + 2.1) * amp;
    p.testa.rotation.x = Math.sin(t * .9 + p.fase) * .06 + (st === 'riceve' ? -.12 : .04);
    p.testa.rotation.y = Math.sin(t * .6 + p.fase) * .12;
    p.corpo.position.y = Math.sin(t * 1.2 + p.fase) * .006;
    p.bagliore.material.opacity = .14 + p.luce * .45 + p.sel * .25;
    p.aureola.material.opacity = p.sel * .9; p.aureola.rotation.z += dt * 1.5;
    p.aureola.position.y = 1.5 + Math.sin(t * 2) * .03;
    if (col) {
      const k = .1 + p.luce * .8 + p.sel * .3;
      tmp.copy(p.c).multiplyScalar(k);
      col.setXYZ(i * 2, tmp.r, tmp.g, tmp.b); col.setXYZ(i * 2 + 1, tmp.r, tmp.g, tmp.b);
    }
  });
  if (col) col.needsUpdate = true;
  if (ora - ultimoSchermo > 110) { ultimoSchermo = ora; disegnaSchermi(s.stati, s.colori, ora); }

  // il compito in volo
  const vl = s.volo;
  let tv = vl ? clamp((performance.now() - vl.t0) / vl.dur, 0, 1) : 1;
  if (vl && tv < 1) {
    punto(vl.da, A); punto(vl.a, B); M.addVectors(A, B).multiplyScalar(.5); M.y += 1.3;
    const c = vl.a >= 0 && postazioni[vl.a] ? postazioni[vl.a].c : oro;
    scia.forEach((m, k) => {
      const tk = clamp(tv - k * .035, 0, 1); m.visible = tk > 0 && tk < 1;
      lungoArco(tk, m.position); m.quaternion.copy(cam.quaternion); m.material.color.copy(c).lerp(tmp.set(0xffffff), k ? 0 : .6);
    });
  } else scia.forEach(m => { m.visible = false; });

  rend.render(scena, cam);

  // proiezione delle teste per i pulsanti HTML ([x, y, vicinanza 0-1])
  const punti = [];
  postazioni.forEach(p => {
    Vp.set(0, 1.12, .44).applyMatrix4(p.g.matrixWorld);   // centro della testa: l'anello trasparente del pulsante ci sta sopra
    const dCam = Vp.distanceTo(cam.position);
    Vp.project(cam);
    punti.push(Vp.z > 1 ? null : [(Vp.x + 1) / 2 * cssW, (1 - Vp.y) / 2 * cssH, clamp(1 - (dCam - dist + R) / (2 * R + 1), 0, 1)]);
  });
  Vp.set(0, 2.05, 0).project(cam);
  fonte.proiezione(punti, [(Vp.x + 1) / 2 * cssW, (1 - Vp.y) / 2 * cssH]);
  requestAnimationFrame(giro);
}
function avvia() { if (attivo || !visibile || !fonte || document.hidden) return; attivo = true; ultimo = 0; requestAnimationFrame(giro); }
function ferma() { fonte = null; attivo = false; }
new IntersectionObserver(v => { visibile = v[0].isIntersecting; avvia(); }, { rootMargin: '60px' }).observe(tela);
new ResizeObserver(v => { const r = v[0].contentRect; cssW = r.width; cssH = r.height; daMisurare = true; avvia(); }).observe(tela);
document.addEventListener('visibilitychange', avvia);
tela.addEventListener('webglcontextlost', e => { e.preventDefault(); ferma(); window.dispatchEvent(new Event('sala3d-perso')); });

window.Sala3D = {
  collega(f) { fonte = f; daMisurare = true; avvia(); },
  sveglia: avvia,
  // tempi tra un fotogramma e l'altro (ultimi 240): servono alla prova dei 60 fps
  misure() {
    if (!misure.length) return null;
    const o = misure.slice().sort((a, b) => a - b), media = misure.reduce((a, b) => a + b, 0) / misure.length;
    return { fotogrammi: misure.length, fps: +(1000 / media).toFixed(1), p95ms: +o[Math.floor(o.length * .95)].toFixed(1), px: rend.getPixelRatio() };
  },
  azzera() { misure.length = 0; }
};
window.dispatchEvent(new Event('sala3d-pronto'));
