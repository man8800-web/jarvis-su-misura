// Dettagli da studio: cursore su misura, titoli che entrano parola per parola, frasi dei tratti di volo
// che respirano con lo scorrimento, luce che segue il dito sulle schede, cambio di profilo morbido.
// Tutto opzionale: senza questo file la pagina è identica, solo più ferma.
(function () {
  'use strict';
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var radice = document.documentElement;

  /* ---------- titoli parola per parola (solo quelli che compaiono allo scorrimento) ---------- */
  // Le parole restano testo vero nello stesso ordine: lettori di schermo e motori di ricerca leggono uguale.
  // Il pezzo colorato (.luce) entra come un blocco unico, così il suo gradiente non si spezza.
  if (!ridotto) $$('.rivela h2, h2.rivela').forEach(function (h) {
    if (h.dataset.parole) return;
    h.dataset.parole = '1';
    var i = 0;
    function avvolgi(contenuto) {
      var w = document.createElement('span'); w.className = 'parola';
      var d = document.createElement('span'); d.style.setProperty('--i', i++);
      d.appendChild(contenuto); w.appendChild(d); return w;
    }
    Array.prototype.slice.call(h.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var pezzi = n.textContent.split(/(\s+)/), frammento = document.createDocumentFragment();
        pezzi.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) frammento.appendChild(document.createTextNode(' '));
          else frammento.appendChild(avvolgi(document.createTextNode(p)));
        });
        h.replaceChild(frammento, n);
      } else if (n.nodeType === 1) {
        var w = avvolgi(document.createTextNode('')); h.replaceChild(w, n); w.firstChild.textContent = ''; w.firstChild.appendChild(n);
      }
    });
    h.classList.add('a-parole');
    // finita l'entrata si toglie la maschera: le ombre del testo tornano intere
    var ultimo = h.querySelector('.parola:last-child > span');
    if (ultimo) ultimo.addEventListener('transitionend', function () { h.classList.add('parole-fatte'); }, { once: true });
  });

  /* ---------- le frasi dei tratti di volo respirano con la velocità dello scorrimento ---------- */
  var frasi = $$('.soglia-frase');
  if (!ridotto && frasi.length) {
    var vel = 0, y0 = scrollY, t0 = performance.now(), giro = 0, resp = 0;
    // solo sulle frasi vicine allo schermo: scritta sulla radice, la variabile fa ricalcolare lo stile di tutta la pagina a ogni fotogramma
    var ultimo = '0';
    function respira(v) {
      if (v === ultimo) return;
      ultimo = v;
      frasi.forEach(function (f) {
        var r = f.parentNode.getBoundingClientRect();
        if (r.bottom > -innerHeight && r.top < innerHeight * 2 || v === '0') f.style.setProperty('--respiro', v);
      });
    }
    function passo() {
      giro = 0; vel *= .88; resp += (Math.min(1, vel) - resp) * .2;
      var attivo = vel > .004 || resp > .004;
      respira(attivo ? resp.toFixed(2) : '0');
      if (attivo) giro = requestAnimationFrame(passo);
    }
    addEventListener('scroll', function () {
      var ora = performance.now(), dt = Math.max(16, ora - t0);
      vel = Math.min(1.2, vel * .5 + Math.abs(scrollY - y0) / dt * .45); y0 = scrollY; t0 = ora;
      if (!giro) giro = requestAnimationFrame(passo);
    }, { passive: true });
  }

  /* ---------- luce che segue il dito sulle schede di vetro ---------- */
  var SCHEDE = '.potere, .servizio, .scheda-reparto, .lettore, .console, .forma-zona, .domande details, .passi li, .vivo-form';
  $$(SCHEDE).forEach(function (s) {
    if (s.querySelector(':scope > .luce-dito')) return;
    var l = document.createElement('span'); l.className = 'luce-dito'; l.setAttribute('aria-hidden', 'true');
    s.insertBefore(l, s.firstChild); s.classList.add('con-luce');
  });
  function illumina(e) {
    var s = e.target.closest && e.target.closest('.con-luce'); if (!s) return;
    var r = s.getBoundingClientRect();
    s.style.setProperty('--lx', (e.clientX - r.left).toFixed(0) + 'px');
    s.style.setProperty('--ly', (e.clientY - r.top).toFixed(0) + 'px');
    if (!s.classList.contains('illuminata')) {
      $$('.con-luce.illuminata').forEach(function (x) { if (x !== s) x.classList.remove('illuminata'); });
      s.classList.add('illuminata');
    }
  }
  addEventListener('pointermove', illumina, { passive: true });
  addEventListener('pointerdown', illumina, { passive: true });
  document.addEventListener('pointerout', function (e) {
    var s = e.target.closest && e.target.closest('.con-luce');
    if (s && !(e.relatedTarget && s.contains(e.relatedTarget))) s.classList.remove('illuminata');
  });

  /* ---------- cambio di profilo morbido (dove il browser ha le View Transitions) ---------- */
  if (document.startViewTransition && !ridotto) {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#profili .profilo');
      if (!b || !window.Sito || b.getAttribute('aria-pressed') === 'true') return;
      e.stopImmediatePropagation(); e.preventDefault();
      var k = b.getAttribute('data-chiave');
      radice.classList.add('vt-profilo');
      var vt = document.startViewTransition(function () { window.Sito.scegliProfilo(k, false); });
      vt.finished.then(function () { radice.classList.remove('vt-profilo'); }, function () { radice.classList.remove('vt-profilo'); });
    }, true);
  }

  /* ---------- cursore su misura: solo con mouse o trackpad, mai con il movimento ridotto ---------- */
  if (!fine || ridotto) return;
  var cur = document.createElement('div'); cur.className = 'cursore'; cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<i class="c-anello"><b class="c-testo"></b></i><i class="c-punto"></i>';
  document.body.appendChild(cur);
  var anello = cur.firstChild, punto = cur.lastChild, etichetta = anello.firstChild;
  radice.classList.add('cursore-su-misura');

  var MAGNETI = '.btn, .comando, .profilo, .vivo-suggerimenti button, .vivo-invia, .vivo-mic, .suono-interr, .menu a, .marchio, .suona, .chiudi, .orbita button';
  var TESTO = 'input, textarea, select, [contenteditable="true"], label';
  var mx = -100, my = -100, ax = -100, ay = -100, aw = 34, ah = 34, ar = 17, moto = 0, attivo = null, visto = false;

  function bersaglio(t) {
    if (!t || !t.closest) return null;
    if (t.closest(TESTO)) return 'testo';
    return t.closest(MAGNETI);
  }
  function giraCursore() {
    moto = 0;
    var vx, vy, vw = 34, vh = 34, vr = 17;
    if (attivo && attivo !== 'testo' && attivo.isConnected) {
      var r = attivo.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var cs = getComputedStyle(attivo).borderRadius;
      vx = cx + (mx - cx) * .12; vy = cy + (my - cy) * .12; vw = r.width + 12; vh = r.height + 12;
      vr = Math.min(parseFloat(cs) + 6 || 12, vh / 2);
      // il pulsante si sposta appena verso il puntatore (proprietà translate: non tocca le trasformazioni del sito)
      var lim = function (v) { return Math.max(-6, Math.min(6, v)).toFixed(1) + 'px'; };
      if (r.width < 320) attivo.style.translate = lim((mx - cx) * .14) + ' ' + lim((my - cy) * .2);
    } else { vx = mx; vy = my; }
    var k = .22;
    ax += (vx - ax) * k; ay += (vy - ay) * k; aw += (vw - aw) * k; ah += (vh - ah) * k; ar += (vr - ar) * k;
    anello.style.transform = 'translate3d(' + (ax - aw / 2).toFixed(1) + 'px,' + (ay - ah / 2).toFixed(1) + 'px,0)';
    anello.style.width = aw.toFixed(1) + 'px'; anello.style.height = ah.toFixed(1) + 'px'; anello.style.borderRadius = ar.toFixed(1) + 'px';
    punto.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    if (Math.abs(vx - ax) + Math.abs(vy - ay) + Math.abs(vw - aw) > .3) moto = requestAnimationFrame(giraCursore);
  }
  function muovi() { if (!moto) moto = requestAnimationFrame(giraCursore); }

  function lascia(el) { if (el && el !== 'testo' && el.style) el.style.translate = ''; }
  addEventListener('pointermove', function (e) {
    // col dito il cursore sparisce; mouse e penna lo tengono (il cursore di sistema è nascosto per tutti e due)
    if (e.pointerType === 'touch') { cur.classList.remove('visibile'); return; }
    mx = e.clientX; my = e.clientY;
    if (!visto) { visto = true; ax = mx; ay = my; }
    var b = bersaglio(e.target);
    if (b !== attivo) {
      lascia(attivo); attivo = b;
      cur.classList.toggle('su-magnete', !!b && b !== 'testo');
      cur.classList.toggle('su-testo', b === 'testo');
    }
    // la scritta compare dove la scena si può toccare o trascinare
    var scritta = '';
    var esplora = document.getElementById('esplora-hud');
    if (!b && esplora && !esplora.hidden && !e.target.closest('.esplora-hud > *')) scritta = 'Trascina';
    else if (!b && document.body.classList.contains('con-3d') && e.target.closest('.palco')) scritta = 'Avvicinati';
    if (etichetta.textContent !== scritta) { etichetta.textContent = scritta; cur.classList.toggle('con-scritta', !!scritta); }
    cur.classList.add('visibile');
    muovi();
  }, { passive: true });
  addEventListener('pointerdown', function () { cur.classList.add('premuto'); });
  addEventListener('pointerup', function () { cur.classList.remove('premuto'); });
  document.addEventListener('mouseleave', function () { cur.classList.remove('visibile'); lascia(attivo); attivo = null; });
  addEventListener('blur', function () { cur.classList.remove('visibile'); });
  addEventListener('scroll', function () { if (attivo && attivo !== 'testo') muovi(); }, { passive: true });
})();
