// «Prima e dopo»: barra da trascinare. A sinistra la giornata del titolare senza Jarvis, a destra con Jarvis,
// per il mestiere scelto (dati d'esempio in js/prima-dopo-dati.js). Nessuna rete, nessun archivio: tutto in memoria.
// Ogni riga (telefono, messaggi, agenda) ha le due versioni nella stessa cella, così restano allineate;
// la versione «con» è ritagliata con clip-path dalla posizione della barra (--x, in percento).
// Dito: si trascina in orizzontale, lo scorrimento verticale della pagina resta libero (touch-action: pan-y).
// Tastiera: la maniglia è un role=slider (frecce, Pagina su/giù, Inizio/Fine).
(function () {
  'use strict';
  var D = window.PRIMA_DOPO, DEMO = window.DEMO, T = D && D.testi;
  var sez = document.getElementById('prima-dopo');
  if (!D || !DEMO || !sez) return;
  var $ = function (s) { return sez.querySelector(s); };
  var banco = $('.pd-banco'), scelta = $('.pd-mestieri'), palco = $('.pd-palco'), righe = $('.pd-righe');
  var maniglia = $('.pd-maniglia'), annuncio = $('.pd-annuncio'), testa = $('.pd-attivita');
  if (!banco || !scelta || !palco || !righe || !maniglia) return;
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function annuncia(t) { if (!annuncio) return; annuncio.textContent = ''; setTimeout(function () { annuncio.textContent = t; }, 60); }
  function profili() { return (window.Sito && window.Sito.profili) || window.PROFILI || {}; }

  /* ---------- icone (disegnate qui, nessun file esterno) ---------- */
  var SVG = {
    tel: '<path d="M6.6 3.5l3 .4 1.4 4-2 1.6a12 12 0 006 6l1.6-2 4 1.4.4 3c-.2 1.2-1.3 2-2.5 2A17 17 0 013 6c0-1.2.8-2.3 2-2.5z"/>',
    posta: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.8 7l8.2 6 8.2-6"/>',
    agenda: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    luna: '<path d="M19 14.5A7.5 7.5 0 019.5 5a7.5 7.5 0 109.5 9.5z"/>'
  };
  function icona(n) { var s = el('span', 'pd-ico'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<svg viewBox="0 0 24 24">' + SVG[n] + '</svg>'; return s; }

  /* ---------- stato: solo in memoria ---------- */
  var k = null, x = 50, toccato = false, sceltoDaLui = false, chips = [];
  DEMO.ordine.forEach(function (chiave) {
    if (!D.mestieri[chiave] || !DEMO.mestieri[chiave]) return;
    var m = DEMO.mestieri[chiave], p = profili()[m.profilo] || {};
    var b = el('button', 'pd-chip', m.etichetta); b.type = 'button';
    b.setAttribute('data-mestiere', chiave); b.setAttribute('aria-pressed', 'false');
    if (p.colore) b.style.setProperty('--c', p.colore);
    b.addEventListener('click', function () {
      sceltoDaLui = true; scegli(chiave, true);
      if (window.PianoJarvis) window.PianoJarvis.suggerisci(chiave);
    });
    scelta.appendChild(b); chips.push(b);
  });

  // una riga: la stessa cella con le due versioni sovrapposte
  function riga(cls, fa) {
    var r = el('div', 'pd-riga ' + cls);
    var s = el('div', 'pd-lato pd-senza'), c = el('div', 'pd-lato pd-con');
    s.appendChild(el('span', 'sr', T.senza + ': ')); c.appendChild(el('span', 'sr', T.con + ': '));
    fa(s, D.mestieri[k].senza, 'senza'); fa(c, D.mestieri[k].con, 'con');
    r.appendChild(s); r.appendChild(c); return r;
  }
  function blocco(nome) {
    return function (box, lato, quale) {
      var v = lato[nome], top = el('div', 'pd-blocco-testa');
      var ic = icona(nome); if (quale === 'senza' && nome === 'tel') ic.classList.add('pd-squilla');
      top.appendChild(ic);
      if (v[0] != null) { var n = el('b', 'pd-num', String(v[0])); top.appendChild(n); }
      top.appendChild(el('span', 'pd-cosa', v[1]));
      box.appendChild(top); box.appendChild(el('p', 'pd-desc', v[2]));
    };
  }
  // l'agenda: una riga di testa e poi una riga per orario, così senza e con restano allineati
  function agenda(box, lato) {
    var top = el('div', 'pd-blocco-testa'); top.appendChild(icona('agenda'));
    top.appendChild(el('span', 'pd-cosa', D.mestieri[k].agenda));
    var buchi = lato.slot.filter(function (s) { return s[2] === 'buco' || s[2] === 'doppio'; }).length;
    top.appendChild(el('span', 'pd-conto ' + (buchi ? 'male' : 'bene'), buchi ? buchi + (buchi === 1 ? ' problema' : ' problemi') : 'nessun buco'));
    box.appendChild(top);
  }
  function slot(i) {
    return function (box, lato) {
      var s = lato.slot[i], d = el('div', 'pd-s ' + s[2]);
      d.appendChild(el('span', 'pd-s-ora', s[0]));
      d.appendChild(el('span', 'pd-s-t', s[1]));
      if (T.stati[s[2]]) d.appendChild(el('span', 'pd-s-stato', T.stati[s[2]]));
      box.appendChild(d);
    };
  }
  function sera(box, lato) { var p = el('p', 'pd-sera'); p.appendChild(icona('luna')); p.appendChild(document.createTextNode(lato.sera)); box.appendChild(p); }
  function intestazione(box, lato, quale) {
    box.appendChild(el('span', 'pd-lato-nome', quale === 'senza' ? T.senza : T.con));
    box.appendChild(el('span', 'pd-lato-ora', 'Ore ' + D.mestieri[k].ora + ', stesso giorno'));
  }

  function scegli(chiave, fuoco, zitto) {
    if (!D.mestieri[chiave] || !DEMO.mestieri[chiave]) return;
    k = chiave;
    var m = DEMO.mestieri[k], p = profili()[m.profilo] || {};
    sez.style.setProperty('--c', p.colore || '#5ad7ff');
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mestiere') === k ? 'true' : 'false'); });
    if (testa) testa.textContent = m.attivita + ' · attività di fantasia';
    righe.textContent = '';
    righe.appendChild(riga('pd-intesta', intestazione));
    righe.appendChild(riga('pd-tel', blocco('tel')));
    righe.appendChild(riga('pd-posta', blocco('posta')));
    righe.appendChild(riga('pd-agenda', agenda));
    D.mestieri[k].senza.slot.forEach(function (x, i) { righe.appendChild(riga('pd-slot-riga' + (i === D.mestieri[k].senza.slot.length - 1 ? ' ultima' : ''), slot(i))); });
    righe.appendChild(riga('pd-fine', sera));
    applica();
    if (fuoco) maniglia.focus({ preventScroll: true });
    if (!zitto) {
      var dm = D.mestieri[k], buchi = function (l) { return l.slot.filter(function (s) { return s[2] === 'buco' || s[2] === 'doppio'; }).length; };
      annuncia('Prima e dopo per ' + m.etichetta.toLowerCase() + ', esempio. Senza Jarvis: ' + (dm.senza.posta[0] || 0) + ' ' + dm.senza.posta[1] + ', ' + buchi(dm.senza) + ' problemi in agenda. Con Jarvis: ' + dm.con.posta[0] + ' ' + dm.con.posta[1] + ', ' + buchi(dm.con) + ' problemi in agenda. Usa la barra per confrontare.');
    }
  }

  /* ---------- la barra ---------- */
  var frame = 0;
  function applica() {
    frame = 0;
    var v = Math.round(x * 10) / 10;
    palco.style.setProperty('--x', v + '%');
    palco.style.setProperty('--xn', v);
    // la linea sta esattamente su x; la maniglia resta dentro il riquadro anche agli estremi
    var w = palco.clientWidth || 0, px = x / 100 * w, mezza = 26;
    palco.style.setProperty('--sposta', (w > mezza * 2 ? Math.max(mezza, Math.min(w - mezza, px)) - px : 0) + 'px');
    var r = Math.round(x);
    maniglia.setAttribute('aria-valuenow', String(r));
    maniglia.setAttribute('aria-valuetext', T.senza + ' ' + r + ' per cento, ' + T.con.toLowerCase() + ' ' + (100 - r) + ' per cento');
    palco.classList.toggle('pd-tutto-con', x < 3);
    palco.classList.toggle('pd-tutto-senza', x > 97);
  }
  function metti(v) { x = Math.max(0, Math.min(100, v)); if (!frame) frame = requestAnimationFrame(applica); }
  addEventListener('resize', function () { metti(x); });
  var corsa = 0;
  function vai(v) {                                   // pulsanti e invito: scorre verso v (subito col movimento ridotto)
    cancelAnimationFrame(corsa);
    if (ridotto) { metti(v); return; }
    var da = x, t0 = performance.now(), dur = 420;
    (function passo(t) {
      var q = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - q, 3);
      metti(da + (v - da) * e); if (q < 1) corsa = requestAnimationFrame(passo);
    })(t0);
  }

  // trascinamento relativo: col dito non salta dove si tocca (si sta solo scorrendo la pagina);
  // col mouse un clic senza trascinare porta la barra lì
  var g = null;
  palco.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    cancelAnimationFrame(corsa);
    g = { id: e.pointerId, x0: e.clientX, y0: e.clientY, v0: x, w: palco.getBoundingClientRect().width || 1, su: false, tipo: e.pointerType, sullaManiglia: maniglia.contains(e.target) };
    if (g.sullaManiglia) { g.su = true; palco.setPointerCapture(e.pointerId); palco.classList.add('pd-trascina'); }
  });
  palco.addEventListener('pointermove', function (e) {
    if (!g || e.pointerId !== g.id) return;
    var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.su) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
      g.su = true; toccato = true; palco.setPointerCapture(e.pointerId); palco.classList.add('pd-trascina');
    }
    toccato = true;
    metti(g.v0 + dx / g.w * 100);
  });
  function fine(e) {
    if (!g || e.pointerId !== g.id) return;
    if (!g.su && e.type === 'pointerup' && g.tipo === 'mouse') {
      var r = palco.getBoundingClientRect(); toccato = true; vai((e.clientX - r.left) / r.width * 100);
    }
    palco.classList.remove('pd-trascina'); g = null;
  }
  palco.addEventListener('pointerup', fine);
  palco.addEventListener('pointercancel', fine);
  palco.addEventListener('lostpointercapture', function () { palco.classList.remove('pd-trascina'); });

  maniglia.addEventListener('keydown', function (e) {
    var v = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = x - 5;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = x + 5;
    else if (e.key === 'PageDown') v = x - 25;
    else if (e.key === 'PageUp') v = x + 25;
    else if (e.key === 'Home') v = 0;
    else if (e.key === 'End') v = 100;
    if (v == null) return;
    e.preventDefault(); toccato = true; cancelAnimationFrame(corsa); metti(v);
  });

  sez.querySelectorAll('[data-pd-vai]').forEach(function (b) {
    b.addEventListener('click', function () {
      toccato = true; var v = +b.getAttribute('data-pd-vai'); vai(v);
      annuncia(v === 100 ? 'Tutta la giornata senza Jarvis.' : v === 0 ? 'Tutta la giornata con Jarvis.' : 'Metà e metà.');
    });
  });

  /* ---------- in vista: lo squillo gira solo quando si vede, e un invito a trascinare la prima volta ---------- */
  var invitato = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        palco.classList.toggle('pd-vivo', v.isIntersecting);
        if (v.isIntersecting && v.intersectionRatio > .35 && !invitato && !toccato && !ridotto) {
          invitato = true;
          setTimeout(function () { if (toccato) return; vai(66); setTimeout(function () { if (!toccato) vai(34); setTimeout(function () { if (!toccato) vai(50); }, 520); }, 520); }, 300);
        }
      });
    }, { threshold: [0, .35] }).observe(palco);
  } else palco.classList.add('pd-vivo');

  scegli(DEMO.ordine.filter(function (c) { return D.mestieri[c]; })[0], false, true);

  window.PrimaDopo = {
    // dalla demo o dalla giornata: segue il mestiere provato, se il visitatore non ne ha scelto uno qui
    suggerisci: function (c) { if (!sceltoDaLui && c !== k && D.mestieri[c]) scegli(c, false, true); },
    imposta: function (c) { scegli(c, false, true); },
    vai: function (v) { toccato = true; cancelAnimationFrame(corsa); metti(v); },
    stato: function () { return { mestiere: k, x: x }; }
  };
})();
