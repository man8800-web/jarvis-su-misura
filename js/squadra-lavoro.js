// «La squadra al lavoro»: una sala d'esempio con gli specialisti alle loro postazioni e Jarvis al centro.
// Jarvis affida un compito, lo specialista ci lavora, il revisore ricontrolla, poi tutto aspetta il sì del titolare.
// Le postazioni sono pulsanti HTML veri (tastiera, lettore di schermo). Con il 3D (js/squadra-3d.js, caricato solo
// vicino alla sezione) i pulsanti seguono le teste degli specialisti proiettate a ogni fotogramma; senza 3D
// (movimento ridotto, ?3d=0, niente WebGL, scena globale in qualità bassa) restano in cerchio, in 2D.
// Dati: le squadre d'esempio di profili.js. Nessuna rete, nessun archivio: tutto in memoria.
(function () {
  'use strict';
  var sez = document.getElementById('al-lavoro');
  var PROFILI = window.PROFILI, ICONE = window.ICONE || {};
  if (!sez || !PROFILI) return;
  var $ = function (s) { return sez.querySelector(s); };
  var boxProfili = $('.sl-profili'), palco = $('.sl-palco'), boxPost = $('.sl-postazioni'), fili = $('.sl-fili'), centro = $('.sl-centro');
  var sc = { ico: $('.sl-ico'), nome: $('.sl-nome'), stato: $('.sl-stato'), fa: $('.sl-fa'), compito: $('.sl-compito'), mai: $('.sl-mai') };
  var registro = $('.sl-registro'), btPausa = $('.sl-pausa'), btPasso = $('.sl-passo'), annuncio = $('.sl-annuncio');
  if (!boxProfili || !palco || !boxPost || !registro) return;
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var COLORI = ['#5ad7ff', '#c38bff', '#f3cd73', '#5fe3a1', '#ff7eb6', '#ff9f43', '#9fe9ff', '#ffd27a'];
  var STATI = {
    riposo: 'In attesa di un compito', riceve: 'Riceve il compito da Jarvis', lavora: 'Al lavoro',
    fatto: 'Fatto: passato al revisore', controlla: 'Ricontrolla prima che il lavoro arrivi a te'
  };
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function icona(k) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONE[k] || ICONE.stella || '';   // costanti di profili.js, mai testo dell'utente
    return s;
  }
  function annuncia(t) { if (!annuncio) return; annuncio.textContent = ''; setTimeout(function () { annuncio.textContent = t; }, 60); }
  function minuscola(t) { return t.charAt(0).toLowerCase() + t.slice(1); }

  /* ---------- stato: solo in memoria ---------- */
  var chiave = '', sceltaUtente = false, agenti = [], sel = -1, rev = -1, versione = 0;
  var turno = 0, fase = 0, volo = null, centroStato = '', timer = null, fermaUtente = ridotto, visibile = false, treD = false;
  var DURATE = [1300, 2600, 2000, 2400];

  /* ---------- scelta dell'attività ---------- */
  var chips = [];
  Object.keys(PROFILI).forEach(function (k) {
    var p = PROFILI[k], b = el('button', 'sl-chip', p.nome); b.type = 'button';
    b.setAttribute('data-chiave', k); b.setAttribute('aria-pressed', 'false'); b.style.setProperty('--c', p.colore);
    b.addEventListener('click', function () { sceltaUtente = true; imposta(k); annuncia('Sala d\'esempio: ' + p.nome + ', ' + agenti.length + ' specialisti.'); });
    boxProfili.appendChild(b); chips.push(b);
  });

  function imposta(k) {
    if (!Object.prototype.hasOwnProperty.call(PROFILI, k) || k === chiave) return;
    chiave = k; versione++;
    var p = PROFILI[k];
    sez.style.setProperty('--sc', p.colore);
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-chiave') === k ? 'true' : 'false'); });
    boxPost.textContent = '';
    rev = -1;
    agenti = p.squadra.map(function (m, i) {
      var c = COLORI[i % COLORI.length];
      if (m[1] === 'scudo') rev = i;
      var b = el('button', 'sl-agente'); b.type = 'button';
      b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-stato', 'riposo'); b.style.setProperty('--c', c);
      var bolla = el('span', 'sl-bolla'); bolla.appendChild(icona(m[1])); bolla.setAttribute('aria-hidden', 'true');
      var pal = el('span', 'sl-pallino'); pal.setAttribute('aria-hidden', 'true');
      b.appendChild(bolla); b.appendChild(el('span', 'sl-etichetta', m[0])); b.appendChild(pal);
      b.addEventListener('click', function () { scegli(i, true); });
      boxPost.appendChild(b);
      return { b: b, c: c, nome: m[0], ic: m[1], testo: m[2], esempio: m[3], stato: 'riposo' };
    });
    sel = -1; turno = 0; fase = 0; volo = null; centroStato = '';
    registro.textContent = '';
    scheda();
    disponi2D();
    // col 3D acceso i pulsanti nuovi restano nascosti finché il primo fotogramma non li mette sulle teste
    // (se la squadra cambia con la sala fuori vista, altrimenti al rientro sbucherebbero fuori posto)
    if (treD) { agenti.forEach(function (a) { a.b.classList.add('fuori'); }); if (window.Sala3D) window.Sala3D.sveglia(); }
    riparti(900);
  }

  /* ---------- la scheda dello specialista ---------- */
  function scheda() {
    var a = agenti[sel];
    if (!a) {
      sez.style.removeProperty('--ac');
      sc.ico.textContent = ''; sc.ico.appendChild(icona('stella'));
      sc.nome.textContent = 'La sala'; sc.stato.textContent = agenti.length + ' specialisti d\'esempio e Jarvis al centro';
      sc.fa.textContent = 'Tocca uno specialista nella sala per vedere cosa fa.';
      sc.compito.textContent = ''; sc.mai.textContent = '';
      return;
    }
    sez.style.setProperty('--ac', a.c);
    sc.ico.textContent = ''; sc.ico.appendChild(icona(a.ic));
    sc.nome.textContent = a.nome; sc.stato.textContent = 'Adesso: ' + minuscola(STATI[a.stato]);
    sc.fa.textContent = a.testo;
    sc.compito.textContent = a.esempio;
    sc.mai.textContent = sel === rev
      ? 'Non decide al posto tuo: trova gli errori e li sistema prima che il lavoro ti arrivi.'
      : 'Da solo non manda, non pubblica, non compra e non conferma niente: quello resta a te.';
  }
  function scegli(i, dallUtente) {
    if (i < 0 || i >= agenti.length) return;
    sel = i;
    agenti.forEach(function (a, k) { a.b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    scheda();
    if (!treD) fili2D();
    // la scheda non è una regione viva (la simulazione ne cambia lo stato di continuo): si annuncia solo la scelta
    if (dallUtente) { annuncia(agenti[i].nome + ': ' + agenti[i].testo); if (window.Sala3D) window.Sala3D.sveglia(); }
  }

  /* ---------- la simulazione: affida, lavora, ricontrolla, aspetta il sì ---------- */
  function ordine() { var o = []; agenti.forEach(function (a, i) { if (i !== rev) o.push(i); }); return o; }
  function metti(i, s) {
    var a = agenti[i]; if (!a) return;
    a.stato = s; a.b.setAttribute('data-stato', s);
    if (i === sel) sc.stato.textContent = 'Adesso: ' + minuscola(STATI[s]);
  }
  function scrivi(t, tipo) {
    var li = el('li', tipo ? 'sl-' + tipo : null, t);
    registro.insertBefore(li, registro.firstChild);
    while (registro.children.length > 4) registro.removeChild(registro.lastChild);
    return t;
  }
  function vola(da, a) { volo = { da: da, a: a, t0: performance.now(), dur: ridotto ? 1 : 1100 }; }
  function passo() {
    var o = ordine(); if (!o.length) return '';
    var i = o[turno % o.length], a = agenti[i], r = agenti[rev], riga = '';
    if (fase === 0) {
      agenti.forEach(function (x, k) { if (k !== i) metti(k, 'riposo'); });
      centroStato = ''; metti(i, 'riceve'); vola(-1, i);
      riga = scrivi('Jarvis affida a ' + a.nome + ': ' + minuscola(a.esempio), 'affida');
      fase = 1;
    } else if (fase === 1) {
      metti(i, 'lavora'); volo = null;
      riga = scrivi(a.nome + ' ci lavora', 'lavora');
      fase = r ? 2 : 3;
    } else if (fase === 2) {
      metti(i, 'fatto'); metti(rev, 'controlla'); vola(i, rev);
      riga = scrivi(r.nome + ' ricontrolla il lavoro di ' + a.nome, 'controlla');
      fase = 3;
    } else {
      metti(i, 'riposo'); if (r) metti(rev, 'riposo');
      vola(r ? rev : i, -1); centroStato = 'attesa';
      riga = scrivi('Pronto. Aspetta il tuo sì: niente esce da solo.', 'si');
      fase = 0; turno++;
    }
    centro.classList.toggle('attesa', centroStato === 'attesa');
    if (!treD) fili2D();
    if (window.Sala3D) window.Sala3D.sveglia();
    return riga;
  }
  function attivo() { return !fermaUtente && visibile && !document.hidden; }
  function riparti(ritardo) {
    clearTimeout(timer); timer = null;
    if (!attivo()) return;
    timer = setTimeout(function giro() {
      if (!attivo()) { timer = null; return; }
      var f = fase; passo();
      timer = setTimeout(giro, DURATE[f]);
    }, ritardo == null ? 400 : ritardo);
  }
  function pausa(on) {
    fermaUtente = !!on;
    btPausa.setAttribute('aria-pressed', on ? 'true' : 'false');
    btPausa.textContent = on ? 'Riprendi la sala' : 'Ferma la sala';
    sez.classList.toggle('sl-ferma', !!on);
    if (on) { clearTimeout(timer); timer = null; } else riparti(300);
  }
  btPausa.addEventListener('click', function () { pausa(!fermaUtente); annuncia(fermaUtente ? 'Sala ferma. Usa «Passo dopo» per andare avanti.' : 'La sala riprende.'); });
  btPasso.addEventListener('click', function () { annuncia(passo()); if (!fermaUtente) riparti(DURATE[fase]); });
  if (ridotto) pausa(true);
  document.addEventListener('visibilitychange', function () { riparti(); });
  if ('IntersectionObserver' in window) {
    // la sala lavora finché si vede qualcosa: la sala o il suo diario (sul telefono stanno uno sotto l'altro)
    new IntersectionObserver(function (v) { var era = visibile; visibile = v[0].isIntersecting; if (visibile !== era) riparti(); }, { threshold: 0 }).observe($('.sl-zona') || palco);
  } else { visibile = true; }

  /* ---------- 2D: cerchio di postazioni e fili dal centro ---------- */
  var punti2D = [];
  function disponi2D() {
    var n = agenti.length;
    punti2D = agenti.map(function (a, i) {
      var ang = -Math.PI / 2 + i / n * Math.PI * 2;
      return [50 + Math.cos(ang) * 38, 50 + Math.sin(ang) * 36];
    });
    if (treD) return;
    agenti.forEach(function (a, i) { a.b.style.left = punti2D[i][0] + '%'; a.b.style.top = punti2D[i][1] + '%'; });
    centro.style.left = ''; centro.style.top = '';
    fili2D();
  }
  function fili2D() {
    if (!fili) return;
    fili.setAttribute('viewBox', '0 0 100 100'); fili.setAttribute('preserveAspectRatio', 'none');
    fili.textContent = '';
    punti2D.forEach(function (p, i) {
      var l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', 50); l.setAttribute('y1', 50); l.setAttribute('x2', p[0]); l.setAttribute('y2', p[1]);
      var st = agenti[i].stato, cls = 'sl-filo';
      if (st !== 'riposo') cls += ' acceso';
      if (i === sel) cls += ' scelto';
      l.setAttribute('class', cls); l.style.stroke = agenti[i].c;
      fili.appendChild(l);
    });
    centro.classList.toggle('attesa', centroStato === 'attesa');
  }

  /* ---------- 3D: i pulsanti seguono le teste proiettate ---------- */
  function suProiezione(punti, c) {
    if (!misPalco) misPalco = [palco.clientWidth, palco.clientHeight];
    agenti.forEach(function (a) { if (!a.mw) { a.mw = a.b.offsetWidth; a.mh = a.b.offsetHeight; } });   // letture prima delle scritture
    var W = misPalco[0], H = misPalco[1];
    for (var i = 0; i < agenti.length; i++) {
      var p = punti[i], a = agenti[i], b = a.b;
      if (!p) { b.classList.add('fuori'); continue; }
      b.classList.remove('fuori');
      // l'etichetta non esce mai dalla sala, nemmeno sul telefono stretto
      var mx = Math.min(W / 2, a.mw / 2 + 4), x = Math.max(mx, Math.min(W - mx, p[0])), y = Math.max(a.mh - 22, Math.min(H - 30, p[1]));   // il pulsante sporge 26 px sotto il punto (css)
      b.style.left = x.toFixed(1) + 'px'; b.style.top = y.toFixed(1) + 'px';
      b.style.zIndex = String(10 + Math.round(p[2] * 10));
    }
    if (c) { centro.style.left = c[0].toFixed(1) + 'px'; centro.style.top = c[1].toFixed(1) + 'px'; }
  }
  var sopra = false, misPalco = null;
  palco.addEventListener('pointerenter', function () { sopra = true; });
  palco.addEventListener('pointerleave', function () { sopra = false; });
  palco.addEventListener('focusin', function () { sopra = true; });
  palco.addEventListener('focusout', function () { sopra = false; });
  function stato3D() {
    return { versione: versione, colori: agenti.map(function (a) { return a.c; }), stati: agenti.map(function (a) { return a.stato; }),
      sel: sel, rev: rev, volo: volo, centro: centroStato, fermo: sopra || fermaUtente, colore: (PROFILI[chiave] || {}).colore || '#5ad7ff' };
  }
  function torna2D() {
    treD = false; sez.classList.remove('con-sala3d');
    agenti.forEach(function (a) { a.b.classList.remove('fuori'); a.b.style.zIndex = ''; });
    disponi2D();
  }
  var caricato = false;
  function carica3D() {
    if (caricato) return; caricato = true;
    if (ridotto || /[?&]3d=0\b/.test(location.search) || !('noModule' in HTMLScriptElement.prototype)) return;
    var q = document.body.getAttribute('data-qualita');
    if ((q === 'statico' || q === 'basso') && !/[?&]sala3d=1\b/.test(location.search)) return;
    var ok = false;
    try { var c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); ok = !!gl; if (gl) { var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) { ok = false; }
    if (!ok) return;
    window.addEventListener('sala3d-pronto', function () {
      if (!window.Sala3D) return;
      treD = true; sez.classList.add('con-sala3d');
      window.Sala3D.collega({ stato: stato3D, proiezione: suProiezione });
    }, { once: true });
    window.addEventListener('sala3d-perso', torna2D);
    var s = document.createElement('script'); s.type = 'module'; s.src = 'js/squadra-3d.js';
    s.onerror = function () { /* resta la sala 2D */ };
    document.head.appendChild(s);
  }

  /* ---------- avvio: la sala segue il profilo scelto più su, finché il visitatore non ne sceglie una qui ---------- */
  document.addEventListener('profilo-cambiato', function (e) { if (!sceltaUtente && e.detail) imposta(e.detail.chiave); });
  imposta((window.Sito && window.Sito.profiloAttuale && window.Sito.profiloAttuale()) || 'tutti');
  addEventListener('resize', function () { misPalco = null; agenti.forEach(function (a) { a.mw = 0; }); if (!treD) disponi2D(); });
  sez.classList.add('pronta');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (v) {
      if (v[0].isIntersecting) { io.disconnect(); if (window.requestIdleCallback) requestIdleCallback(carica3D, { timeout: 1200 }); else setTimeout(carica3D, 200); }
    }, { rootMargin: '900px 0px' });
    io.observe(sez);
  } else carica3D();

  window.SquadraLavoro = {
    stato: function () { return { chiave: chiave, n: agenti.length, sel: sel, rev: rev, turno: turno, fase: fase, stati: agenti.map(function (a) { return a.stato; }), ferma: fermaUtente, treD: treD, attesa: centroStato === 'attesa' }; },
    imposta: function (k) { sceltaUtente = true; imposta(k); },
    scegli: function (i) { scegli(i, true); },
    pausa: pausa,
    passo: passo
  };
})();
