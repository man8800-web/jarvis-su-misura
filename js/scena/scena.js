// La scena 3D continua di Jarvis: nucleo → galassia → plancia, guidata dallo scorrimento.
// Si carica dopo il primo disegno (js/scena/avvio.js). Se qualcosa va storto la pagina resta com'è,
// con lo sfondo di riserva: il testo non dipende mai dal 3D.
// Mantiene l'interfaccia window.galassia (ruota, zoom, esplora, pronta) usata da js/pannello.js.
import * as T from '../lib/grafica3d.js';
import { LIVELLI, livelloIniziale, creaMisuratore } from './qualita.js';
import { creaNucleo } from './nucleo.js';
import { creaGalassia } from './galassia.js';
import { creaPlancia, QUOTA } from './plancia.js';
import { creaFinale } from './finale.js';
import { creaRegia, nuovoStato, CAMPI } from './regia.js';

const corpo = document.body;
const tela = document.getElementById('galassia');
const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GIU = QUOTA + 4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function rinuncia(motivo) {
  corpo.classList.remove('con-3d');
  corpo.classList.add('senza-3d');
  if (tela) tela.style.display = 'none';
  if (motivo && window.console) console.info('Scena 3D non attiva:', motivo);
}

try { avvia(); } catch (e) { rinuncia(e && e.message); }

function avvia() {
  let inCorsa = false;                       // prima di tutto: richiedi() parte già dagli ingressi e dal profilo
  T.ColorManagement.enabled = false;         // i colori del sito restano quelli scritti: i conti di luce li fanno gli shader
  const voluta = new URLSearchParams(location.search).get('qualita');   // ?qualita=medio la fissa (serve alle prove)
  const fissato = !!voluta && Object.prototype.hasOwnProperty.call(LIVELLI, voluta);
  let nomeLivello = fissato ? voluta : livelloIniziale();
  const Q = LIVELLI[nomeLivello];

  const rend = new T.WebGLRenderer({ canvas: tela, antialias: false, alpha: false, powerPreference: 'high-performance' });
  rend.info.autoReset = false;
  rend.setClearColor(0x050810, 1);
  const pxMax = () => {
    const L = LIVELLI[misuratore.livello], w = tela.clientWidth || innerWidth, h = tela.clientHeight || innerHeight;
    return Math.min(devicePixelRatio || 1, L.px, Math.sqrt(L.mpx * 1e6 / (w * h)));
  };

  const scena = new T.Scene();
  const cam = new T.PerspectiveCamera(50, 1, .1, 900);

  const nucleo = creaNucleo(T, Q);
  const galassia = creaGalassia(T, Q);
  const plancia = creaPlancia(T, Q);
  scena.add(galassia.cielo, galassia.gruppo, plancia.piano, plancia.torri, nucleo.gruppo);
  let finale = LIVELLI[nomeLivello].post ? creaFinale(T, rend) : null;

  const regia = creaRegia();
  const misuratore = creaMisuratore(nomeLivello, applicaLivello, fissato);

  function applicaLivello(l) {
    const L = LIVELLI[l];
    rend.setPixelRatio(pxMax());
    nucleo.impostaPassi(L.passi);
    if (!L.post && finale) { finale.libera(); finale = null; }
    else if (L.post && !finale) finale = creaFinale(T, rend);
    plancia.torri.geometry.instanceCount = Math.min(L.torri, Q.torri);
    galassia.densita(Math.min(1, L.stelle / Q.stelle));
    misura(true);
    corpo.dataset.qualita = l;
    corpo.classList.toggle('scena-ferma', ridotto || l === 'statico');
  }

  /* ---------- misure ---------- */
  let W = 0, H = 0, stretto = false;
  function misura(forza) {
    const w = tela.clientWidth || innerWidth, h = tela.clientHeight || innerHeight;
    if (!forza && w === W && h === H) return;
    W = w; H = h; stretto = W < 980 || W / H < .8;
    rend.setPixelRatio(pxMax());
    rend.setSize(W, H, false);
    cam.aspect = W / H;
    cam.fov = stretto ? 62 : 50;
    cam.updateProjectionMatrix();
    const px = rend.getPixelRatio();
    galassia.u.uPx.value = px; nucleo.uGuscio.uPx.value = px;
    if (finale) finale.misura(rend);
    regia.misura();
  }
  misura(true);
  if ('ResizeObserver' in window) new ResizeObserver(() => { regia.misura(); richiedi(); }).observe(document.querySelector('main'));
  addEventListener('resize', () => { misura(); richiedi(); });

  /* ---------- ingressi: mouse, dito, giroscopio ---------- */
  const ptr = { x: 0, y: 0, px: 0, py: 0, vel: 0, dentro: false, ultimo: 0 };
  function punta(cx, cy) {
    const x = cx / innerWidth * 2 - 1, y = 1 - cy / innerHeight * 2;
    const ora = performance.now(), dt = Math.max(8, ora - ptr.ultimo);
    ptr.vel = Math.min(1, ptr.vel + Math.hypot(x - ptr.x, y - ptr.y) / dt * 12);
    ptr.x = x; ptr.y = y; ptr.dentro = true; ptr.ultimo = ora;
    richiedi();
  }
  addEventListener('pointermove', e => punta(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) punta(t.clientX, t.clientY); }, { passive: true });
  addEventListener('touchstart', e => { const t = e.touches[0]; if (t) punta(t.clientX, t.clientY); }, { passive: true });
  document.addEventListener('pointerleave', () => { ptr.dentro = false; });

  // giroscopio: solo dopo un tocco esplicito (iOS chiede il permesso; mai una richiesta automatica)
  const btnGiro = document.getElementById('muovi-telefono');
  let giroAttivo = false;
  function suGiro(e) {
    if (e.gamma == null) return;
    ptr.x = clamp(e.gamma / 30, -1, 1); ptr.y = clamp((45 - e.beta) / 30, -1, 1); ptr.dentro = true;
  }
  if (btnGiro && 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches && !ridotto) {
    btnGiro.hidden = false;
    btnGiro.addEventListener('click', async () => {
      if (giroAttivo) {
        removeEventListener('deviceorientation', suGiro); giroAttivo = false;
        btnGiro.setAttribute('aria-pressed', 'false'); return;
      }
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const r = await DeviceOrientationEvent.requestPermission();
          if (r !== 'granted') { btnGiro.textContent = 'Movimento non concesso'; return; }
        }
        addEventListener('deviceorientation', suGiro); giroAttivo = true;
        btnGiro.setAttribute('aria-pressed', 'true');
      } catch (e) { btnGiro.textContent = 'Movimento non disponibile'; }
    });
  }

  // scrivere nel modulo fa partire le onde dalla plancia
  let onda = 0;
  const modulo = document.getElementById('modulo');
  if (modulo) modulo.addEventListener('input', () => { onda = Math.min(1, onda + .35); ptr.vel = Math.min(1, ptr.vel + .15); richiedi(); });

  // passando su un senso si accende il suo anello
  let evid = -1;
  document.querySelectorAll('#poteri .potere').forEach((p, i) => {
    p.addEventListener('pointerenter', () => { evid = i; richiedi(); });
    p.addEventListener('pointerleave', () => { evid = -1; richiedi(); });
    p.addEventListener('focusin', () => { evid = i; richiedi(); });
    p.addEventListener('focusout', () => { evid = -1; richiedi(); });
  });

  /* ---------- la voce vera fa pulsare nucleo e galassia ---------- */
  let analizzatore = null, datiAudio = null, livelloAudio = 0;
  const audioVoce = document.getElementById('audio-voce');
  if (audioVoce) audioVoce.addEventListener('play', async () => {
    if (analizzatore || !(window.AudioContext || window.webkitAudioContext)) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state !== 'running') await ctx.resume();
      if (ctx.state !== 'running') { ctx.close(); return; }       // mai rischiare di ammutolire la voce
      const src = ctx.createMediaElementSource(audioVoce);
      analizzatore = ctx.createAnalyser(); analizzatore.fftSize = 256; analizzatore.smoothingTimeConstant = .7;
      src.connect(analizzatore); analizzatore.connect(ctx.destination);
      datiAudio = new Uint8Array(analizzatore.frequencyBinCount);
      window.Scena.audioCtx = ctx;
    } catch (e) { analizzatore = null; }
  });
  function leggiAudio() {
    if (!analizzatore || !audioVoce || audioVoce.paused) return 0;
    analizzatore.getByteFrequencyData(datiAudio);
    let s = 0; for (let i = 2; i < 40; i++) s += datiAudio[i];
    return clamp(s / (38 * 180), 0, 1);
  }

  /* ---------- profilo: colore e forma del mestiere ---------- */
  const coloreVoluto = new T.Color('#88e3e8');
  function suProfilo(chiave) {
    const S = window.Sito; if (!S || !S.profili) return;
    const p = S.profili[chiave] || S.profili.tutti; if (!p) return;
    coloreVoluto.set(p.colore).lerp(new T.Color('#ffffff'), .12);
    if (S.puntiForma) nucleo.impostaForma(S.puntiForma(p.forma, Q.guscio));
    richiedi();
  }
  document.addEventListener('profilo-cambiato', e => suProfilo(e.detail && e.detail.chiave));
  if (window.Sito && window.Sito.profiloAttuale) suProfilo(window.Sito.profiloAttuale());

  /* ---------- galassia libera (pannello dei comandi) ---------- */
  const lib = { attiva: false, yaw: 0, pitch: 0, vy: 0, vp: 0, zoom: 1, zoomVoluto: 1 };
  window.galassia = {
    ruota(dx, dy) { lib.vy += dx * .004; lib.vp += dy * .0025; richiedi(); },
    zoom(f) { lib.zoomVoluto = clamp(lib.zoomVoluto * f, .45, 2.6); richiedi(); },
    esplora(si) { lib.attiva = !!si; if (si) { lib.yaw = 0; lib.pitch = 0; } richiedi(); },
    pronta: true
  };
  window.Scena = {
    livello: () => misuratore.livello,
    info: () => ({ livello: misuratore.livello, chiamate: rend.info.render.calls, triangoli: rend.info.render.triangles, punti: rend.info.render.points, px: +rend.getPixelRatio().toFixed(2), forza: +nucleo.u.uForza.value.toFixed(2), geometrie: rend.info.memory.geometries, programmi: rend.info.programs.length }),
    // Jarvis «parla»: impulso sul nucleo e onde sulla plancia (servirà a Jarvis vivo)
    impulso(forza) { onda = Math.min(1, onda + (forza || .6)); ptr.vel = Math.min(1, ptr.vel + (forza || .6) * .5); richiedi(); },
    colore(hex) { coloreVoluto.set(hex); richiedi(); },
    audioCtx: null,
    salta() { primo = true; richiedi(); }      // porta subito la camera all'inquadratura (per le prove)
  };

  /* ---------- molla smorzata su ogni grandezza della regia ---------- */
  const voluto = nuovoStato(), att = nuovoStato(), vel = nuovoStato();
  const par = { x: 0, y: 0, vx: 0, vy: 0 };
  let primo = true;
  function molla(dt, w) {
    CAMPI.forEach(k => {
      const a = w * w * (voluto[k] - att[k]) - 2 * w * vel[k];
      vel[k] += a * dt; att[k] += vel[k] * dt;
    });
  }

  const linea = document.getElementById('linea');
  const frasi = [...document.querySelectorAll('.soglia-frase')];
  const centro = new T.Vector3(), dir = new T.Vector3(), tmp = new T.Vector3(), tmp2 = new T.Vector3();
  let idAttuale = '', t = 0, ultimo = performance.now(), pronta = false;
  const fermo = ridotto || misuratore.livello === 'statico';

  function frame(ora) {
    inCorsa = false;
    if (document.hidden) return;
    rend.info.reset();
    const dtMs = ora - ultimo; ultimo = ora;
    const dt = Math.min(.05, Math.max(.001, dtMs / 1000));
    const animato = !ridotto && misuratore.livello !== 'statico';
    if (animato) { t += dt; misuratore.misura(dtMs); } else if (t === 0) t = 14;
    misura(false);

    /* inquadratura voluta */
    const info = regia.valuta(scrollY, W, H, cam.fov, t, stretto, voluto, ridotto);
    if (info.id !== idAttuale) {
      // movimento ridotto: niente voli, un cambio d'inquadratura con una dissolvenza breve
      if (ridotto && idAttuale) { tela.style.opacity = '0'; setTimeout(() => { tela.style.opacity = ''; }, 120); }
      idAttuale = info.id; corpo.dataset.scena = info.id;
    }
    if (lib.attiva) {
      lib.yaw += lib.vy; lib.pitch = clamp(lib.pitch + lib.vp, -1.1, .9); lib.vy *= .93; lib.vp *= .93;
      lib.zoom += (lib.zoomVoluto - lib.zoom) * .08;
      Object.assign(voluto, { az: voluto.az + lib.yaw, el: clamp(.55 + lib.pitch, -.6, 1.45), ldist: Math.log(52 / lib.zoom), tx: 0, ty: 0, tz: 0, nx: 0, ny: 0,
        nuc: 1, morph: 0, guscio: .4, anelli: 0, filo: 0, gal: 1, cielo: 1, griglia: 0, scudo: 0, luce: 1, giu: 0 });
    }
    if (primo || !animato) { CAMPI.forEach(k => { att[k] = voluto[k]; vel[k] = 0; }); primo = false; }
    else molla(dt, lib.attiva ? 6 : 9);

    // parallasse del puntatore (molla a parte, più morbida)
    const px = ptr.dentro && animato ? ptr.x : 0, py = ptr.dentro && animato ? ptr.y : 0;
    par.vx += (40 * (px - par.x) - 2 * Math.sqrt(40) * par.vx) * dt; par.x += par.vx * dt;
    par.vy += (40 * (py - par.y) - 2 * Math.sqrt(40) * par.vy) * dt; par.y += par.vy * dt;

    /* camera */
    const s = att, dist = Math.exp(s.ldist);
    const az = s.az + par.x * .14, el = clamp(s.el - par.y * .07, -1.3, 1.5);
    centro.set(s.tx, s.ty, s.tz);
    cam.position.set(centro.x + dist * Math.cos(el) * Math.sin(az), centro.y + dist * Math.sin(el), centro.z + dist * Math.cos(el) * Math.cos(az));
    cam.lookAt(centro);
    cam.updateMatrixWorld();
    // spostamento dell'obiettivo: il bersaglio finisce nel punto di schermo scelto dall'ancora
    cam.updateProjectionMatrix();
    cam.projectionMatrix.elements[8] = -s.nx;
    cam.projectionMatrix.elements[9] = -s.ny;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

    /* nucleo */
    const g = nucleo.gruppo;
    g.position.set(0, s.giu * GIU, 0);
    const nuc = Math.max(.001, s.nuc);
    nucleo.sfera.scale.setScalar(nuc);
    nucleo.u.uCamLoc.value.copy(cam.position).sub(g.position).divideScalar(nuc);
    nucleo.uAlone.uScala.value = 3.6 * nuc;
    nucleo.colore.lerp(coloreVoluto, animato ? 1 - Math.exp(-dt * 3) : 1);

    // raggio dal puntatore contro la sfera, calcolato a mano
    tmp.set(par.x, par.y, .5).unproject(cam);
    dir.copy(tmp).sub(cam.position).normalize();
    tmp.copy(g.position).sub(cam.position);
    const proiez = tmp.dot(dir);
    tmp2.copy(cam.position).addScaledVector(dir, proiez);                  // punto del raggio più vicino al nucleo
    const lontano = tmp2.distanceTo(g.position), raggio = 1.15 * nuc;
    const tocca = ptr.dentro && animato && proiez > 0 && lontano < raggio * 1.6;
    if (tocca) {
      const dentro = Math.sqrt(Math.max(0, raggio * raggio - lontano * lontano));
      tmp2.addScaledVector(dir, -dentro).sub(g.position).normalize();
      nucleo.u.uTocco.value.lerp(tmp2, .25).normalize();
    }
    const forzaVoluta = tocca ? clamp(1.6 - lontano / raggio, 0, 1) : 0;
    nucleo.u.uForza.value += (forzaVoluta - nucleo.u.uForza.value) * (1 - Math.exp(-dt * 6));
    // le particelle del guscio cercano il dito, nella stessa molla del nucleo
    tmp.copy(cam.position).addScaledVector(dir, Math.max(proiez, 0)).sub(g.position);
    nucleo.uGuscio.uPunta.value.lerp(tmp, .2);
    const tiroVoluto = ptr.dentro && animato && proiez > 0 ? clamp(2.4 - tmp.length() / Math.max(nuc, .2) * .5, 0, 1) : 0;
    nucleo.uGuscio.uTiro.value += (tiroVoluto - nucleo.uGuscio.uTiro.value) * (1 - Math.exp(-dt * 5));

    livelloAudio += (leggiAudio() - livelloAudio) * .35;
    ptr.vel *= Math.exp(-dt * 2.2); onda *= Math.exp(-dt * 1.4);
    nucleo.u.uT.value = t;
    nucleo.u.uAgita.value = ptr.vel * .8;
    nucleo.u.uAudio.value = livelloAudio;
    nucleo.u.uLuce.value = s.luce;
    nucleo.uAlone.uForza.value = .3 * s.luce * (1 + livelloAudio * .8) * clamp((dist / nuc - 1) / 1.6, 0, 1);   // dentro il nucleo l'alone non c'è
    nucleo.uGuscio.uMorph.value = clamp(s.morph, 0, 1);
    nucleo.uGuscio.uForza.value = .85 * s.guscio * s.luce;
    nucleo.uAnelli.uForza.value = s.anelli * s.luce;
    nucleo.uAnelli.uEvid.value = idAttuale === 'poteri' ? evid : -1;
    nucleo.uFilo.uForza.value = s.filo * s.luce;
    nucleo.uScudo.uForza.value = s.scudo * s.luce;
    // il filo si accende come la scia della giornata (stessa formula di sito.js)
    if (linea && s.filo > .01) { const r = linea.getBoundingClientRect(); nucleo.uFilo.uProg.value = clamp((H * .65 - r.top) / Math.max(r.height, 1), 0, 1); }
    nucleo.visibilita();

    /* galassia, cielo, plancia */
    galassia.u.uT.value = t;
    galassia.u.uForza.value = .78 * s.gal * s.luce;
    galassia.u.uAudio.value = livelloAudio * (idAttuale === 'ascolta' ? 1 : .4);
    galassia.u.uTorsione.value = animato ? 1 : 0;
    galassia.uDisco.uForza.value = .55 * s.gal * s.luce * (1 + livelloAudio * .5) * clamp((dist - 1.2) / 3, 0, 1);
    galassia.gruppo.visible = s.gal > .01;
    galassia.uCielo.uForza.value = .9 * s.cielo;
    galassia.cielo.rotation.y = t * .003;
    plancia.u.uT.value = t;
    plancia.u.uForza.value = s.griglia * Math.min(1, s.luce + .2);
    plancia.u.uOnda.value = Math.min(1, onda + livelloAudio);
    plancia.u.uColore.value.copy(nucleo.colore);
    plancia.piano.visible = plancia.torri.visible = s.griglia > .01;
    plancia.uTorri.uForza.value = s.griglia * Math.min(1, s.luce + .15);

    // le frasi dei tratti di volo si accendono solo quando ci si è dentro
    if (!ridotto) for (const f of frasi) {
      const r = f.parentNode.getBoundingClientRect();
      if (r.bottom < -40 || r.top > H + 40) continue;
      const v = clamp(1.35 - Math.abs(r.top + r.height / 2 - H / 2) / (H * .62), 0, 1);
      f.style.opacity = v.toFixed(3);
      f.style.transform = 'translateY(' + ((1 - v) * (r.top + r.height / 2 > H / 2 ? 26 : -26)).toFixed(1) + 'px)';
    }

    if (finale) finale.disegna(rend, scena, cam, t);
    else rend.render(scena, cam);

    if (!pronta) {
      pronta = true;
      corpo.classList.add('con-3d');
      corpo.classList.remove('senza-3d');
      corpo.dataset.qualita = misuratore.livello;
      document.dispatchEvent(new Event('galassia-pronta'));
      document.dispatchEvent(new Event('scena-pronta'));
    }
    // ciclo continuo solo se animato; altrimenti si disegna a richiesta (scorrimento, mouse, cambi)
    const inMoto = animato || lib.attiva || Math.abs(lib.vy) > 1e-4;
    if (inMoto) richiedi();
  }
  function richiedi() { if (!inCorsa && !document.hidden) { inCorsa = true; requestAnimationFrame(frame); } }

  addEventListener('scroll', richiedi, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { ultimo = performance.now(); richiedi(); } });
  tela.addEventListener('webglcontextlost', e => { e.preventDefault(); corpo.classList.add('senza-3d'); corpo.classList.remove('con-3d'); frasi.forEach(f => { f.style.opacity = ''; f.style.transform = ''; }); });
  tela.addEventListener('webglcontextrestored', () => { corpo.classList.remove('senza-3d'); corpo.classList.add('con-3d'); misura(true); richiedi(); });

  if (fermo) corpo.classList.add('scena-ferma');
  rend.compile(scena, cam);
  richiedi();
}
