// Barra dei comandi: Mani (webcam), Squadra, Piano 10 s, Galassia libera. Più il pulsante WhatsApp.
// La webcam si accende SOLO dopo un clic dell'utente e dopo il consenso del browser.
// Il riconoscimento delle mani gira dentro la pagina: nessun fotogramma viene inviato o salvato.
(function () {
  'use strict';
  var CFG = window.JARVIS_CONFIG || { media: {} };
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var assoluto = function (p) { return new URL(p, document.baseURI).href; };

  /* ---------- WhatsApp (compare solo se il numero è in config.js) ---------- */
  (function () {
    var a = $('#whatsapp'), n = (CFG.whatsappNumero || '').replace(/\D/g, '');
    if (!a || n.length < 8 || n.length > 15) return;
    a.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent('Ciao Manuel, ho visto il sito di Jarvis su misura e vorrei parlarne.');
    a.hidden = false;
  })();

  /* ---------- pannelli ---------- */
  var cmd = { mani: $('#cmd-mani'), squadra: $('#cmd-squadra'), piano: $('#cmd-piano'), galassia: $('#cmd-galassia') };
  var pan = { mani: $('#pan-mani'), piano: $('#pan-piano') };
  var maniAttive = false;

  function sincronizza() {
    if (cmd.mani) cmd.mani.setAttribute('aria-pressed', (!pan.mani.hidden || maniAttive) ? 'true' : 'false');
    if (cmd.piano) cmd.piano.setAttribute('aria-pressed', !pan.piano.hidden ? 'true' : 'false');
  }
  function chiudiPannelli() { pan.mani.hidden = true; pan.piano.hidden = true; sincronizza(); }
  function apri(nome) {
    var altro = nome === 'mani' ? 'piano' : 'mani';
    pan[altro].hidden = true; pan[nome].hidden = false; sincronizza();
    var f = pan[nome].querySelector('input,button.btn'); if (f) f.focus({ preventScroll: true });
  }
  function alterna(nome) { if (pan[nome].hidden) apri(nome); else { pan[nome].hidden = true; sincronizza(); if (cmd[nome]) cmd[nome].focus({ preventScroll: true }); } }
  window.Pannelli = { chiudiTutti: chiudiPannelli };

  cmd.mani.addEventListener('click', function () { alterna('mani'); });
  cmd.piano.addEventListener('click', function () { alterna('piano'); });
  $$('[data-chiudi]').forEach(function (b) {
    b.addEventListener('click', function () { var p = b.closest('.pannello'); p.hidden = true; sincronizza(); var k = p.id === 'pan-mani' ? cmd.mani : cmd.piano; if (k) k.focus({ preventScroll: true }); });
  });

  /* ---------- squadra: giro automatico degli specialisti ---------- */
  cmd.squadra.addEventListener('click', function () {
    var acceso = cmd.squadra.getAttribute('aria-pressed') !== 'true';
    var z = $('#squadra'); if (acceso && z) z.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth' });
    var attivo = window.Sito ? window.Sito.tourSquadra(acceso) : false;
    cmd.squadra.setAttribute('aria-pressed', attivo ? 'true' : 'false');
  });

  /* ---------- galassia libera ---------- */
  var hud = $('#esplora-hud'), sott = $('#sottotitolo'), btnCom = $('#commento-play'), audioCom = $('#audio-commento'), tela = $('#galassia');
  var inEsplora = false;
  var COMMENTO = [
    'Questa è la galassia di Jarvis.',
    'Ogni punto di luce è una cosa da ricordare: un documento, una scadenza, un cliente.',
    'Un assistente che dimentica tutto non serve a niente.',
    'Il tuo Jarvis ricorda, prepara e ti avvisa.',
    'Ma le cose importanti partono solo con il tuo sì.',
    'Ora puoi tornare al sito. Raccontagli cosa ti serve.'
  ];
  var cap = { i: 0, id: null, attivo: false };
  var haAudio = !!(CFG.media && CFG.media.commento);
  if (haAudio) { audioCom.src = CFG.media.commento; audioCom.load(); audioCom.addEventListener('error', function () { haAudio = false; etichettaCommento(); }); }
  function etichettaCommento() { btnCom.textContent = haAudio ? 'Ascolta il commento di Jarvis' : 'Leggi il commento di Jarvis'; }
  etichettaCommento();

  function fermaCommento() {
    cap.attivo = false; clearTimeout(cap.id); btnCom.setAttribute('aria-pressed', 'false');
    if (haAudio) { audioCom.pause(); audioCom.currentTime = 0; }
    sott.textContent = '';
    etichettaCommento();
  }
  function passoCommento() {
    if (!cap.attivo) return;
    if (cap.i >= COMMENTO.length) { fermaCommento(); return; }
    sott.textContent = COMMENTO[cap.i++];
    cap.id = setTimeout(passoCommento, 4800);
  }
  btnCom.addEventListener('click', function () {
    if (cap.attivo) { fermaCommento(); return; }
    cap.attivo = true; cap.i = 0; btnCom.setAttribute('aria-pressed', 'true'); btnCom.textContent = 'Ferma il commento';
    if (haAudio) { var p = audioCom.play(); if (p && p.catch) p.catch(function () { /* resta il testo */ }); }
    passoCommento();
  });
  if (haAudio) audioCom.addEventListener('ended', fermaCommento);

  function blocca(si) {
    ['main', '.piede', '#testata', '#whatsapp'].forEach(function (s) {
      var e = $(s); if (!e) return;
      if (si) e.setAttribute('inert', ''); else e.removeAttribute('inert');
    });
  }
  function entraEsplora() {
    if (!(window.galassia && window.galassia.pronta)) {
      cmd.galassia.setAttribute('aria-pressed', 'false');
      var s = $('#mani-stato'); if (s) { s.textContent = 'La galassia 3D non è disponibile su questo dispositivo o browser.'; s.className = 'stato-pan male'; }
      apri('mani');
      return;
    }
    chiudiPannelli(); if (window.Sito) { window.Sito.tourSquadra(false); cmd.squadra.setAttribute('aria-pressed', 'false'); }
    inEsplora = true; document.body.classList.add('esplora'); hud.hidden = false; blocca(true);
    window.galassia.esplora(true); cmd.galassia.setAttribute('aria-pressed', 'true');
    $('#esplora-esci').focus({ preventScroll: true });
  }
  function esciEsplora() {
    if (!inEsplora) return;
    inEsplora = false; fermaCommento(); document.body.classList.remove('esplora'); hud.hidden = true; blocca(false);
    if (window.galassia) window.galassia.esplora(false);
    cmd.galassia.setAttribute('aria-pressed', 'false'); cmd.galassia.focus({ preventScroll: true });
  }
  cmd.galassia.addEventListener('click', function () { if (inEsplora) esciEsplora(); else entraEsplora(); });
  $('#esplora-esci').addEventListener('click', esciEsplora);

  // trascinamento con mouse e dita, rotellina e pizzico
  (function () {
    var punti = {}, distPrima = 0;
    function conta() { return Object.keys(punti).length; }
    function dist() { var k = Object.keys(punti); if (k.length < 2) return 0; var a = punti[k[0]], b = punti[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
    tela.addEventListener('pointerdown', function (e) {
      if (!inEsplora) return;
      punti[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { tela.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      distPrima = dist();
    });
    tela.addEventListener('pointermove', function (e) {
      var p = punti[e.pointerId]; if (!p || !inEsplora || !window.galassia) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (conta() >= 2) { var d = dist(); if (distPrima > 0 && d > 0) window.galassia.zoom(clamp(d / distPrima, .9, 1.1)); distPrima = d; }
      else window.galassia.ruota(dx * .6, dy * .6);
    });
    function lascia(e) { delete punti[e.pointerId]; distPrima = dist(); }
    tela.addEventListener('pointerup', lascia); tela.addEventListener('pointercancel', lascia);
    tela.addEventListener('wheel', function (e) {
      if (!inEsplora || !window.galassia) return; e.preventDefault();
      window.galassia.zoom(e.deltaY < 0 ? 1.08 : .93);
    }, { passive: false });
  })();

  /* ---------- tasto Esc ---------- */
  addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!pan.mani.hidden || !pan.piano.hidden) { chiudiPannelli(); return; }
    if (inEsplora) esciEsplora();
  });

  /* ---------- controllo con le mani (webcam, tutto in locale) ---------- */
  var Mani = (function () {
    var stato = $('#mani-stato'), bOn = $('#mani-accendi'), bOff = $('#mani-spegni');
    var box = $('#anteprima-cam'), video = $('#cam'), punti = $('#cam-punti'), presa = $('#presa');
    var pctx = punti.getContext('2d');
    var mp = null, lm = null, stream = null, raf = 0, ultimoT = -1, ultimaDet = 0, occupato = false;
    var prec = [null, null], stringe = [false, false], distDue = 0;

    function dire(t, tipo) { stato.textContent = t; stato.className = 'stato-pan' + (tipo ? ' ' + tipo : ''); }
    function distanza(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

    async function carica() {
      if (lm) return;
      dire('Carico il riconoscimento delle mani (circa 20 MB, solo la prima volta). Resta tutto sul tuo dispositivo…');
      mp = mp || await import(assoluto('js/lib/mani/visione.mjs'));
      var fileset = { wasmLoaderPath: assoluto('js/lib/mani/caricatore.js'), wasmBinaryPath: assoluto('js/lib/mani/motore.wasm') };
      var opz = function (d) {
        return { baseOptions: { modelAssetPath: assoluto('js/lib/mani/modello-mani.task'), delegate: d }, runningMode: 'VIDEO', numHands: 2,
                 minHandDetectionConfidence: .6, minHandPresenceConfidence: .6, minTrackingConfidence: .6 };
      };
      try { lm = await mp.HandLandmarker.createFromOptions(fileset, opz('GPU')); }
      catch (e) { lm = await mp.HandLandmarker.createFromOptions(fileset, opz('CPU')); }
    }

    async function accendi() {
      if (maniAttive || occupato) return;
      occupato = true; bOn.disabled = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        dire('Questo browser non permette di usare la webcam (serve una pagina https o localhost).', 'male'); bOn.disabled = false; occupato = false; return;
      }
      try {
        dire('Il browser ti chiederà il permesso per la webcam. Se rifiuti, il sito funziona uguale.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
      } catch (e) {
        var n = e && e.name;
        dire(n === 'NotAllowedError' ? 'Permesso negato: nessuna immagine è stata acquisita. Puoi continuare con mouse o dito.' :
             n === 'NotFoundError' ? 'Non trovo nessuna webcam su questo dispositivo.' :
             n === 'NotReadableError' ? 'La webcam è usata da un\'altra app. Chiudila e riprova.' : 'Webcam non disponibile.', 'male');
        bOn.disabled = false; occupato = false; return;
      }
      try { await carica(); }
      catch (e) {
        if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null;
        dire('Non sono riuscito a caricare il riconoscimento delle mani. La galassia resta comandabile con mouse o dito.', 'male');
        bOn.disabled = false; occupato = false; return;
      }
      video.srcObject = stream; video.muted = true;
      try { await video.play(); } catch (e) { /* ok */ }
      maniAttive = true; occupato = false; box.hidden = false; bOff.hidden = false; bOn.hidden = true; bOn.disabled = false;
      prec = [null, null]; stringe = [false, false]; distDue = 0; ultimoT = -1;
      dire('Mani attive. Avvicina pollice e indice per afferrare la galassia, muovi la mano per girarla; con due mani che si allontanano ti avvicini.', 'bene');
      if (window.galassia && window.galassia.pronta && !inEsplora) entraEsplora();
      sincronizza(); ciclo();
    }

    function spegni(msg) {
      maniAttive = false; cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null;
      video.srcObject = null; box.hidden = true; bOff.hidden = true; bOn.hidden = false; bOn.disabled = false;
      presa.classList.remove('si'); pctx.clearRect(0, 0, punti.width, punti.height);
      if (lm) { try { lm.close(); } catch (e) { /* ok */ } lm = null; }
      dire(msg || 'Webcam spenta. Nessuna immagine è stata salvata o inviata.');
      sincronizza();
    }

    function disegna(mani) {
      var w = video.videoWidth || 640, h = video.videoHeight || 480;
      if (punti.width !== w) { punti.width = w; punti.height = h; }
      pctx.clearRect(0, 0, w, h);
      mani.forEach(function (m, k) {
        pctx.fillStyle = stringe[k] ? '#5fe3a1' : '#5ad7ff';
        m.forEach(function (p, i) { pctx.beginPath(); pctx.arc(p.x * w, p.y * h, (i === 4 || i === 8) ? 5 : 2.5, 0, 6.283); pctx.fill(); });
      });
    }

    function gestisci(res) {
      var mani = (res && res.landmarks) || [];
      disegna(mani);
      var punte = [null, null], nStringe = 0;
      for (var k = 0; k < 2; k++) {
        var m = mani[k];
        if (!m) { stringe[k] = false; prec[k] = null; continue; }
        var grandezza = distanza(m[0], m[9]) || .1, r = distanza(m[4], m[8]) / grandezza;
        stringe[k] = stringe[k] ? r < .42 : r < .27;          // isteresi: stringe a 0.27, lascia a 0.42
        var c = { x: (m[4].x + m[8].x) / 2, y: (m[4].y + m[8].y) / 2 };
        if (stringe[k]) {
          nStringe++; punte[k] = c;
          if (prec[k] && nStringe === 1 && !(mani[1] && stringe[0] && stringe[1]) && window.galassia) {
            // l'immagine è speculare: muovere la mano a destra fa girare a destra
            window.galassia.ruota(-(c.x - prec[k].x) * innerWidth * .07, (c.y - prec[k].y) * innerHeight * .07);
          }
          prec[k] = c;
        } else prec[k] = null;
      }
      if (stringe[0] && stringe[1] && punte[0] && punte[1] && window.galassia) {
        var d = distanza(punte[0], punte[1]);
        if (distDue > 0) window.galassia.zoom(clamp(d / distDue, .92, 1.08));
        distDue = d;
      } else distDue = 0;
      presa.classList.toggle('si', stringe[0] || stringe[1]);
    }

    function ciclo() {
      if (!maniAttive) return;
      var ora = performance.now();
      if (lm && video.readyState >= 2 && video.currentTime !== ultimoT && ora - ultimaDet > 45) {
        ultimoT = video.currentTime; ultimaDet = ora;
        try { gestisci(lm.detectForVideo(video, ora)); } catch (e) { spegni('Il riconoscimento delle mani si è fermato. Puoi riaccendere la webcam.'); return; }
      }
      raf = requestAnimationFrame(ciclo);
    }

    bOn.addEventListener('click', accendi);
    bOff.addEventListener('click', function () { spegni(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && maniAttive) spegni('Webcam spenta perché hai cambiato scheda. Nessuna immagine è stata salvata.'); });
    addEventListener('pagehide', function () { if (maniAttive) spegni(); });
    return { spegni: spegni };
  })();
})();
