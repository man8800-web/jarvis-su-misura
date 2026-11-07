// Suono della scena, spento finché il visitatore non lo accende. Tutto generato con WebAudio:
// nessun file, nessuna rete. Un tappeto a tre voci (ogni voce: due oscillatori leggermente scordati)
// in un filtro passa-basso; lo scorrimento apre il filtro e alza il volume, ogni atto ha il suo accordo,
// un tocco morbido al cambio di scena, clic leggeri mentre si scrive a Jarvis e un rintocco quando risponde.
(function () {
  'use strict';
  var btn = document.getElementById('suono');
  var AC = window.AudioContext || window.webkitAudioContext;
  var nop = function () {};
  window.Suono = { acceso: function () { return false; }, clic: nop, rintocco: nop, abbassa: nop, tocco: nop };
  if (!btn || !AC) return;
  btn.hidden = false;
  var testo = btn.querySelector('.suono-stato');

  // accordi per atto (Hz): nucleo raccolto, galassia aperta, plancia più bassa e calda
  var ACCORDI = {
    nucleo:   [110.00, 164.81, 246.94],   // la, mi, si
    galassia: [146.83, 220.00, 329.63],   // re, la, mi
    plancia:  [87.31, 130.81, 220.00]     // fa, do, la
  };
  var ctx = null, master, filtro, tappeto, luccica, bufRumore = null, voci = [], acceso = false, sotto = false;
  var vel = 0, ultimaY = scrollY, ultimoT = performance.now(), giro = 0, ultimoClic = 0;

  function costruisci() {
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22; comp.ratio.value = 6; comp.attack.value = .01; comp.release.value = .3;
    master = ctx.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(ctx.destination);

    filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 320; filtro.Q.value = .8;
    tappeto = ctx.createGain(); tappeto.gain.value = .05;
    filtro.connect(tappeto); tappeto.connect(master);
    ACCORDI.nucleo.forEach(function (f, i) {
      var g = ctx.createGain(); g.gain.value = i ? .22 : .32; g.connect(filtro);
      var coppia = [-7, 7].map(function (cent) {
        var o = ctx.createOscillator(); o.type = i ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = cent;
        o.connect(g); o.start(); return o;
      });
      voci.push(coppia);
    });
    // il respiro lento del filtro
    var lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = .07; lfoG.gain.value = 90; lfo.connect(lfoG); lfoG.connect(filtro.frequency); lfo.start();

    // luccichio della galassia: rumore filtrato in alto, acceso solo in quell'atto
    var n = ctx.sampleRate * 2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var rum = ctx.createBufferSource(); rum.buffer = buf; rum.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5200; bp.Q.value = 9;
    luccica = ctx.createGain(); luccica.gain.value = 0;
    rum.connect(bp); bp.connect(luccica); luccica.connect(master); rum.start();
    bufRumore = buf;
    atto(document.body.getAttribute('data-atto') || 'nucleo', true);
  }

  function atto(nome, subito) {
    if (!ctx) return;
    var acc = ACCORDI[nome] || ACCORDI.nucleo, t = ctx.currentTime;
    voci.forEach(function (coppia, i) { coppia.forEach(function (o) { o.frequency.setTargetAtTime(acc[i], t, subito ? .01 : 1.1); }); });
    luccica.gain.setTargetAtTime(nome === 'galassia' ? .012 : 0, t, .8);
  }

  // una nota breve con inviluppo morbido (usata da tocco e rintocco)
  function nota(f, vol, durata, tipo, ritardo) {
    if (!ctx || !acceso) return;
    var t = ctx.currentTime + (ritardo || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + durata);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + durata + .05);
  }

  function aggiorna() {
    giro = 0;
    if (!acceso || !ctx) return;
    vel *= .9;
    var t = ctx.currentTime, v = Math.min(1, vel);
    filtro.frequency.setTargetAtTime(320 + v * 1500, t, .12);
    tappeto.gain.setTargetAtTime(.05 + v * .05, t, .15);
    if (vel > .002) giro = requestAnimationFrame(aggiorna);
  }
  addEventListener('scroll', function () {
    var ora = performance.now(), dy = Math.abs(scrollY - ultimaY), dt = Math.max(16, ora - ultimoT);
    ultimaY = scrollY; ultimoT = ora;
    vel = Math.min(1.2, vel * .6 + dy / dt * .5);
    if (acceso && !giro) giro = requestAnimationFrame(aggiorna);
  }, { passive: true });

  // atto e scena arrivano come attributi del body (js/scena/avvio.js e scena.js)
  var scenaPrima = document.body.dataset.scena || '';
  new MutationObserver(function () {
    if (!acceso) return;
    atto(document.body.getAttribute('data-atto'));
    var s = document.body.dataset.scena || '';
    if (s && s !== scenaPrima) { scenaPrima = s; var acc = ACCORDI[document.body.getAttribute('data-atto')] || ACCORDI.nucleo; nota(acc[2] * 2, .035, 1.6); }
  }).observe(document.body, { attributes: true, attributeFilter: ['data-atto', 'data-scena'] });

  function livello() { return sotto ? .3 : 1; }
  function imposta(si) {
    acceso = si;
    if (si && !ctx) { try { costruisci(); } catch (e) { btn.hidden = true; acceso = false; return; } }
    if (!ctx) return;
    var t = ctx.currentTime;
    if (si) { ctx.resume(); master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(livello(), t, .5); atto(document.body.getAttribute('data-atto') || 'nucleo'); }
    else { master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(0, t, .15); setTimeout(function () { if (!acceso) ctx.suspend(); }, 700); }
    btn.setAttribute('aria-pressed', si ? 'true' : 'false');
    if (testo) testo.textContent = si ? 'acceso' : 'spento';
    document.dispatchEvent(new CustomEvent('suono-cambiato', { detail: si }));
  }
  btn.addEventListener('click', function () { imposta(!acceso); if (acceso) nota(659.25, .04, .9); });

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (acceso) ctx.resume();
  });
  // la voce demo e la voce di Jarvis vivo hanno la precedenza: il tappeto si abbassa
  var voce = document.getElementById('audio-voce');
  if (voce) {
    voce.addEventListener('play', function () { window.Suono.abbassa(true); });
    ['pause', 'ended'].forEach(function (ev) { voce.addEventListener(ev, function () { window.Suono.abbassa(false); }); });
  }

  window.Suono = {
    acceso: function () { return acceso; },
    abbassa: function (si) { sotto = !!si; if (ctx && acceso) master.gain.setTargetAtTime(livello(), ctx.currentTime, .25); },
    tocco: function () { nota(440, .03, 1.2); },
    // un tic di rumore brevissimo, al massimo uno ogni 40 ms
    clic: function () {
      if (!ctx || !acceso) return;
      var ora = performance.now(); if (ora - ultimoClic < 40) return; ultimoClic = ora;
      var t = ctx.currentTime, s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = bufRumore; hp.type = 'highpass'; hp.frequency.value = 2800 + Math.random() * 1600;
      g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03);
      s.connect(hp); hp.connect(g); g.connect(master); s.start(t, Math.random() * 1.5, .04);
    },
    // rintocco a campana: parziali non armoniche che si spengono a velocità diverse
    rintocco: function () {
      var acc = ACCORDI[document.body.getAttribute('data-atto')] || ACCORDI.nucleo, f = acc[1] * 4;
      nota(f, .05, 2.4); nota(f * 2.76, .018, 1.3); nota(f * 5.4, .008, .7); nota(f * 1.5, .025, 1.8, 'sine', .11);
    }
  };
})();
