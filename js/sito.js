// Cuore del sito: comparse, profili, giornata, squadra d'esempio, lettore della voce, video.
// Nessuna chiamata di rete, nessun cookie, nessun archivio nel browser.
(function () {
  'use strict';
  var CFG = window.JARVIS_CONFIG || { media: {} };
  var PROFILI = window.PROFILI || {};
  var ICONE = window.ICONE || {};
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var COLORI = ['#5ad7ff', '#c38bff', '#f3cd73', '#5fe3a1', '#ff7eb6', '#ff9f43'];
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo != null) e.textContent = testo;
    return e;
  }
  function iconaSvg(chiave) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    // le icone sono costanti scritte in profili.js (mai testo dell'utente)
    s.innerHTML = ICONE[chiave] || ICONE.stella || '';
    return s;
  }

  /* ---------- segnaposto compilati dalla configurazione ---------- */
  (function () {
    if (CFG.emailTitolare) {
      $$('.mail-titolare').forEach(function (n) {
        var a = el('a', null, CFG.emailTitolare);
        a.href = 'mailto:' + CFG.emailTitolare;
        n.textContent = '';
        n.appendChild(a);
      });
    }
    if (CFG.datiSocieta) $$('.dati-societa').forEach(function (n) { n.textContent = CFG.datiSocieta; });
  })();

  /* ---------- comparse allo scorrimento ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (voci) {
    voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.add('si'); io.unobserve(v.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  function osserva(e) { if (io) io.observe(e); else e.classList.add('si'); }
  $$('.rivela').forEach(osserva);

  /* ---------- testata, barra di avanzamento, scia della giornata ---------- */
  var testata = $('#testata'), barra = $('#barra'), linea = $('#linea');
  var inAttesa = false;
  function aggiornaScroll() {
    inAttesa = false;
    var y = window.scrollY || 0;
    var max = document.documentElement.scrollHeight - innerHeight;
    if (barra) barra.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
    if (testata) testata.classList.toggle('piena', y > 40);
    if (linea) {
      var r = linea.getBoundingClientRect();
      linea.style.setProperty('--p', clamp((innerHeight * .65 - r.top) / Math.max(r.height, 1), 0, 1).toFixed(3));
    }
  }
  addEventListener('scroll', function () { if (!inAttesa) { inAttesa = true; requestAnimationFrame(aggiornaScroll); } }, { passive: true });
  addEventListener('resize', aggiornaScroll);
  aggiornaScroll();

  /* ---------- iPhone che si anima solo se visibile ---------- */
  var iphone = $('#iphone');
  if (iphone && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (v) { iphone.classList.toggle('vivo', v[0].isIntersecting && !ridotto); }, { threshold: .25 }).observe(iphone);
  }

  /* ---------- video di apertura (spazio predisposto) ---------- */
  (function () {
    var v = $('#video-apertura');
    var src = CFG.media && CFG.media.video;
    if (!v) return;
    if (!src) { document.body.classList.add('senza-video'); v.removeAttribute('autoplay'); return; }
    v.addEventListener('error', function () { document.body.classList.add('senza-video'); });
    v.src = src;
    if (ridotto) { v.removeAttribute('autoplay'); v.controls = true; }
    else { var p = v.play(); if (p && p.catch) p.catch(function () { /* l'autoplay può essere bloccato */ }); }
  })();

  /* ---------- lettore della voce ---------- */
  (function () {
    var audio = $('#audio-voce'), btn = $('#suona'), pos = $('#posizione'), tela = $('#onda-voce');
    if (!audio || !btn) return;
    var tOra = $('#tempo-ora'), tTot = $('#tempo-tot'), stato = $('#stato-audio'), avviso = $('#avviso-audio');
    var src = CFG.media && CFG.media.voce;
    var barre = []; var seme = 7;
    for (var i = 0; i < 90; i++) { seme = (seme * 16807) % 2147483647; barre.push(.18 + (seme % 1000) / 1000 * .82 * Math.abs(Math.sin(i * .21 + 1.3))); }
    var ctx = tela ? tela.getContext('2d') : null, suona = false;
    var fmt = function (s) { s = isFinite(s) ? Math.floor(s) : 0; return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
    function disegna(t) {
      if (!ctx) return;
      var dpr = Math.min(devicePixelRatio || 1, 2), w = tela.clientWidth, h = tela.clientHeight;
      if (!w || !h) return;
      if (tela.width !== w * dpr) { tela.width = w * dpr; tela.height = h * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var prog = audio.duration ? audio.currentTime / audio.duration : 0, n = barre.length, pas = w / n;
      for (var i = 0; i < n; i++) {
        var k = barre[i] * (suona && !ridotto ? (.75 + .25 * Math.sin((t || 0) / 160 + i)) : 1);
        var bh = Math.max(3, k * h * .9);
        ctx.fillStyle = (i / n < prog) ? '#5ad7ff' : 'rgba(159,176,195,.35)';
        ctx.fillRect(i * pas + 1, (h - bh) / 2, Math.max(2, pas - 3), bh);
      }
    }
    function ciclo(t) { disegna(t); if (suona) requestAnimationFrame(ciclo); }
    function fermaTutto() { suona = false; btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-label', 'Riproduci la voce di Jarvis'); }
    if (!src) {
      btn.disabled = true; pos.disabled = true;
      if (avviso) avviso.hidden = false;
      if (stato) stato.textContent = 'In arrivo';
      disegna(0); addEventListener('resize', function () { disegna(0); });
      return;
    }
    audio.addEventListener('error', function () {
      btn.disabled = true; pos.disabled = true; if (avviso) avviso.hidden = false; if (stato) stato.textContent = 'Non disponibile';
    });
    audio.src = src; audio.load();
    audio.addEventListener('loadedmetadata', function () { tTot.textContent = fmt(audio.duration); disegna(0); });
    audio.addEventListener('timeupdate', function () {
      tOra.textContent = fmt(audio.currentTime);
      if (audio.duration) pos.value = String(Math.round(audio.currentTime / audio.duration * 1000));
      if (!suona) disegna(0);
    });
    audio.addEventListener('ended', function () { fermaTutto(); if (stato) stato.textContent = 'Finito'; audio.currentTime = 0; });
    btn.addEventListener('click', function () {
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { fermaTutto(); if (stato) stato.textContent = 'Non riesco a riprodurre'; });
        suona = true; btn.setAttribute('aria-pressed', 'true'); btn.setAttribute('aria-label', 'Metti in pausa'); if (stato) stato.textContent = 'In riproduzione';
        requestAnimationFrame(ciclo);
      } else { audio.pause(); fermaTutto(); if (stato) stato.textContent = 'In pausa'; }
    });
    pos.addEventListener('input', function () { if (audio.duration) { audio.currentTime = audio.duration * pos.value / 1000; disegna(0); } });
    addEventListener('resize', function () { disegna(0); });
    disegna(0);
  })();

  /* ---------- la forma del profilo (particelle che si trasformano) ---------- */
  var Forma = (function () {
    var tela = $('#forma'); if (!tela) return { vai: function () {} };
    var ctx = tela.getContext('2d'), N = 460, ps = [], colore = '#5ad7ff', visibile = true, t0 = performance.now();
    function cerchio(cx, cy, r, a0, a1, passi) {
      var out = [], i; a0 = a0 == null ? 0 : a0; a1 = a1 == null ? Math.PI * 2 : a1; passi = passi || 48;
      for (i = 0; i <= passi; i++) { var a = a0 + (a1 - a0) * i / passi; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      return out;
    }
    var FORME = {
      anello: function () { return [cerchio(0, 0, .9), cerchio(0, 0, .62), cerchio(0, 0, .22, 0, 6.283, 20), cerchio(.9, 0, .07, 0, 6.283, 8), cerchio(-.45, .54, .07, 0, 6.283, 8), cerchio(-.3, -.54, .07, 0, 6.283, 8)]; },
      borsa: function () { return [[[-.6, -.3], [.6, -.3], [.75, .85], [-.75, .85], [-.6, -.3]], cerchio(0, -.3, .32, Math.PI, Math.PI * 2, 24), [[-.3, 0], [-.3, .15]], [[.3, 0], [.3, .15]]]; },
      forbici: function () { return [cerchio(-.42, .55, .3), cerchio(.42, .55, .3), [[-.3, .3], [.55, -.9]], [[.3, .3], [-.55, -.9]], [[-.2, .2], [.45, -.7]]]; },
      bilancia: function () { return [[[0, -.9], [0, .8]], [[-.4, .8], [.4, .8]], [[-.85, -.6], [.85, -.6]], [[-.85, -.6], [-1, .05]], [[-.85, -.6], [-.7, .05]], cerchio(-.85, .05, .3, 0, Math.PI, 20), [[.85, -.6], [.7, .05]], [[.85, -.6], [1, .05]], cerchio(.85, .05, .3, 0, Math.PI, 20), cerchio(0, -.92, .07, 0, 6.283, 8)]; },
      posate: function () { return [[[-.45, .9], [-.45, -.1]], [[-.72, -.9], [-.72, -.1]], [[-.45, -.9], [-.45, -.1]], [[-.18, -.9], [-.18, -.1]], cerchio(-.45, -.1, .27, 0, Math.PI, 16), [[.35, .9], [.35, -.9], [.62, -.65], [.55, 0], [.55, .9], [.35, .9]]]; },
      valigetta: function () { return [[[-.9, -.4], [.9, -.4], [.9, .75], [-.9, .75], [-.9, -.4]], [[-.32, -.4], [-.32, -.72], [.32, -.72], [.32, -.4]], [[-.9, .1], [.9, .1]], [[-.12, 0], [.12, 0], [.12, .22], [-.12, .22], [-.12, 0]]]; },
      chiave: function () { return [cerchio(-.5, -.45, .36), cerchio(-.5, -.45, .14, 0, 6.283, 14), [[-.26, -.2], [.72, .78]], [[-.14, -.32], [.84, .66]], [[.72, .78], [.84, .66]], [[.45, .51], [.6, .36]], [[.6, .66], [.72, .54]]]; },
      casa: function () { return [[[-.85, .1], [0, -.72], [.85, .1]], [[-.62, .1], [-.62, .85], [.62, .85], [.62, .1]], [[-.16, .85], [-.16, .3], [.16, .3], [.16, .85]], [[.4, -.26], [.4, -.72], [.62, -.72], [.62, -.1]]]; }
    };
    function campiona(tracciati) {
      var lung = [], tot = 0;
      tracciati.forEach(function (p) { var l = 0; for (var i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); lung.push(l); tot += l; });
      var out = [];
      tracciati.forEach(function (p, k) {
        var n = Math.max(2, Math.round(N * lung[k] / tot)), l = lung[k], seg = [], acc = 0, i;
        for (i = 1; i < p.length; i++) { var d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); seg.push([acc, acc + d, p[i - 1], p[i]]); acc += d; }
        for (var j = 0; j < n; j++) {
          var s = l * j / n, g = seg[seg.length - 1];
          for (i = 0; i < seg.length; i++) if (s <= seg[i][1]) { g = seg[i]; break; }
          var u = g[1] > g[0] ? (s - g[0]) / (g[1] - g[0]) : 0;
          out.push([g[2][0] + (g[3][0] - g[2][0]) * u, g[2][1] + (g[3][1] - g[2][1]) * u]);
        }
      });
      while (out.length < N) out.push(out[out.length % Math.max(out.length, 1)] || [0, 0]);
      return out.slice(0, N);
    }
    for (var i = 0; i < N; i++) ps.push({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, tx: 0, ty: 0, z: (Math.random() - .5) * .5, f: Math.random() * 6.28 });
    function vai(chiave, col) {
      colore = col || colore;
      var gen = FORME[chiave] || FORME.anello, punti = campiona(gen());
      for (var i = 0; i < N; i++) { ps[i].tx = punti[i][0]; ps[i].ty = punti[i][1]; }
      if (ridotto) { ps.forEach(function (p) { p.x = p.tx; p.y = p.ty; }); disegna(0); }
    }
    function disegna(t) {
      var dpr = Math.min(devicePixelRatio || 1, 2), w = tela.clientWidth, h = tela.clientHeight;
      if (!w || !h) return;
      if (tela.width !== Math.round(w * dpr)) { tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = colore;
      var a = ridotto ? .35 : Math.sin(t * .0006) * .7, ca = Math.cos(a), sa = Math.sin(a), s = Math.min(w, h) * .42;
      for (var i = 0; i < N; i++) {
        var p = ps[i];
        p.x += (p.tx - p.x) * .07; p.y += (p.ty - p.y) * .07;
        var jx = ridotto ? 0 : Math.sin(t * .002 + p.f) * .012, jy = ridotto ? 0 : Math.cos(t * .0017 + p.f) * .012;
        var X = (p.x + jx) * ca + p.z * sa, Z = -(p.x + jx) * sa + p.z * ca, f = 1 / (1 + Z * .35);
        var px = w / 2 + X * s * f, py = h / 2 + (p.y + jy) * s * f, r = (1.2 + (1 - clamp(Z, -1, 1)) * .9) * (dpr > 1 ? 1 : 1);
        ctx.globalAlpha = clamp(.5 + (.5 - Z) * .6, .25, 1);
        ctx.beginPath(); ctx.arc(px, py, r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function giro(ora) { if (visibile && !document.hidden) disegna(ora - t0); if (!ridotto) requestAnimationFrame(giro); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (v) { visibile = v[0].isIntersecting; }, { threshold: 0 }).observe(tela);
    if (!ridotto) requestAnimationFrame(giro);
    addEventListener('resize', function () { if (ridotto) disegna(0); });
    return { vai: vai };
  })();

  /* ---------- la squadra d'esempio (orbita) ---------- */
  var Orbita = (function () {
    var box = $('#orbita'); if (!box) return { imposta: function () {}, tour: function () { return false; } };
    var tela = $('canvas', box), ctx = tela.getContext('2d');
    var nodi = [], sel = -1, fase = 0, vel = 0, sopra = false, trascina = false, ultimoX = 0, visibile = true, tourId = null;
    var scSr = { r: $('#scheda-reparto'), i: $('#sr-icona'), n: $('#sr-nome'), t: $('#sr-testo'), e: $('#sr-esempio') };

    function posiziona() {
      var n = nodi.length;
      nodi.forEach(function (o, i) {
        var a = fase + i / n * Math.PI * 2 - Math.PI / 2;
        o.a = a;
        o.b.style.left = (50 + Math.cos(a) * 38) + '%';
        o.b.style.top = (50 + Math.sin(a) * 38) + '%';
      });
    }
    function disegna(t) {
      var dpr = Math.min(devicePixelRatio || 1, 2), w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      if (tela.width !== Math.round(w * dpr)) { tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2;
      [.2, .38, .5].forEach(function (k, i) {
        ctx.beginPath(); ctx.arc(cx, cy, w * k, 0, 6.283);
        ctx.strokeStyle = i === 1 ? 'rgba(90,215,255,.28)' : 'rgba(140,200,255,.1)';
        ctx.setLineDash(i === 1 ? [3, 7] : []); ctx.lineWidth = 1; ctx.stroke();
      });
      ctx.setLineDash([]);
      nodi.forEach(function (o, i) {
        var x = cx + Math.cos(o.a) * w * .38, y = cy + Math.sin(o.a) * h * .38, att = i === sel;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y);
        ctx.strokeStyle = att ? o.c : 'rgba(140,200,255,.12)'; ctx.lineWidth = att ? 1.6 : 1; ctx.stroke();
        if (att) {
          var u = ridotto ? .5 : ((t / 1400) % 1);
          ctx.beginPath(); ctx.arc(cx + (x - cx) * u, cy + (y - cy) * u, 3, 0, 6.283); ctx.fillStyle = o.c; ctx.fill();
        }
      });
    }
    function giro(t) {
      if (visibile && !document.hidden) {
        if (!ridotto && !sopra && !trascina) fase += .0006 + vel;
        else if (trascina || Math.abs(vel) > .00001) fase += vel;
        vel *= .94; if (Math.abs(vel) < .000005) vel = 0;
        posiziona(); disegna(t);
      }
      requestAnimationFrame(giro);
    }
    function scegli(i, dallUtente) {
      if (i < 0 || i >= nodi.length) return;
      sel = i;
      nodi.forEach(function (o, k) { o.b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      var o = nodi[i];
      scSr.r.style.setProperty('--c', o.c);
      scSr.i.textContent = ''; scSr.i.appendChild(iconaSvg(o.ic));
      scSr.n.textContent = o.nome; scSr.t.textContent = o.testo; scSr.e.textContent = o.esempio;
      if (dallUtente) fermaTour();
      if (ridotto) disegna(0);
    }
    function imposta(squadra) {
      $$('.reparto', box).forEach(function (b) { b.remove(); });
      nodi = squadra.map(function (m, i) {
        var b = el('button', 'reparto'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', m[0] + ': ' + m[2]);
        var c = COLORI[i % COLORI.length];
        b.style.setProperty('--c', c); b.style.setProperty('--d', (squadra.length > 6 ? 44 : 50) + 'px');
        var sf = el('span', 'sfera'); sf.appendChild(iconaSvg(m[1]));
        b.appendChild(sf); b.appendChild(el('span', 'nome', m[0]));
        b.addEventListener('click', function () { scegli(i, true); });
        box.appendChild(b);
        return { b: b, c: c, nome: m[0], ic: m[1], testo: m[2], esempio: m[3] };
      });
      fase = 0; posiziona(); scegli(0, false);
    }
    function avanza() { scegli((sel + 1) % nodi.length, false); }
    function tour(on) {
      fermaTour();
      if (on) { tourId = setInterval(avanza, 3200); avanza(); }
      return !!tourId;
    }
    function fermaTour() {
      if (tourId) { clearInterval(tourId); tourId = null; var c = $('#cmd-squadra'); if (c) c.setAttribute('aria-pressed', 'false'); }
    }
    box.addEventListener('pointerenter', function () { sopra = true; });
    box.addEventListener('pointerleave', function () { sopra = false; trascina = false; box.classList.remove('presa'); });
    box.addEventListener('pointerdown', function (e) { if (e.target.closest('.reparto')) return; trascina = true; ultimoX = e.clientX; box.classList.add('presa'); });
    addEventListener('pointerup', function () { trascina = false; box.classList.remove('presa'); });
    addEventListener('pointermove', function (e) { if (!trascina) return; var dx = e.clientX - ultimoX; ultimoX = e.clientX; vel = dx * .0035; });
    box.style.touchAction = 'pan-y';
    if ('IntersectionObserver' in window) new IntersectionObserver(function (v) { visibile = v[0].isIntersecting; }, { threshold: 0 }).observe(box);
    requestAnimationFrame(giro);
    return { imposta: imposta, tour: tour, tourAttivo: function () { return !!tourId; } };
  })();

  /* ---------- profili ---------- */
  var chiaviProfili = Object.keys(PROFILI);
  var profiloAttuale = null;
  var boxProfili = $('#profili');
  var originali = linea ? $$('.momento', linea) : [];

  function costruisciMomento(m, i) {
    var a = el('article', 'momento rivela si'); a.style.setProperty('--c', COLORI[i % COLORI.length]);
    a.appendChild(el('span', 'punto')); a.lastChild.setAttribute('aria-hidden', 'true');
    a.appendChild(el('span', 'ora', m[0])); a.appendChild(el('h3', null, m[1])); a.appendChild(el('p', null, m[2]));
    var s = el('div', 'schermino'); s.setAttribute('aria-hidden', 'true');
    m[3].forEach(function (r, k) {
      if (k) s.appendChild(document.createElement('br'));
      if (r[0]) s.appendChild(el('span', r[0], r[1])); else s.appendChild(document.createTextNode(r[1]));
    });
    a.appendChild(s);
    return a;
  }
  function aggiornaGiornata(p) {
    if (!linea) return;
    $$('.momento', linea).forEach(function (m) { m.remove(); });
    if (p.giornata) p.giornata.forEach(function (m, i) { linea.appendChild(costruisciMomento(m, i)); });
    else originali.forEach(function (m) { linea.appendChild(m); m.classList.add('si'); });
    linea.classList.remove('cambia'); void linea.offsetWidth; linea.classList.add('cambia');
    aggiornaScroll();
  }
  function scegliProfilo(chiave, scorri) {
    var p = PROFILI[chiave]; if (!p) return false;
    profiloAttuale = chiave;
    document.documentElement.style.setProperty('--pc', p.colore);
    $$('.profilo', boxProfili).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-chiave') === chiave ? 'true' : 'false'); });
    $$('.nome-profilo').forEach(function (n) { n.textContent = p.nome; });
    $('#fs-nome').textContent = p.nome; $('#fs-frase').textContent = p.frase;
    var ul = $('#fs-esempi'); ul.textContent = '';
    p.esempi.forEach(function (e) { ul.appendChild(el('li', null, e)); });
    Forma.vai(p.forma, p.colore);
    aggiornaGiornata(p);
    Orbita.imposta(p.squadra);
    if (scorri) { var z = $('#trasforma .forma-zona'); if (z && z.scrollIntoView) z.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'center' }); }
    return true;
  }
  if (boxProfili) {
    chiaviProfili.forEach(function (k) {
      var p = PROFILI[k], b = el('button', 'profilo'); b.type = 'button'; b.setAttribute('data-chiave', k); b.setAttribute('aria-pressed', 'false');
      b.style.setProperty('--c', p.colore); b.appendChild(el('i')); b.appendChild(document.createTextNode(p.nome));
      b.addEventListener('click', function () { scegliProfilo(k, false); });
      boxProfili.appendChild(b);
    });
    var da = '';
    try { da = new URLSearchParams(location.search).get('profilo') || ''; } catch (e) { da = ''; }
    scegliProfilo(PROFILI[da] ? da : 'tutti', false);
  }

  /* ---------- interfaccia per gli altri script ---------- */
  window.Sito = {
    profili: PROFILI,
    scegliProfilo: scegliProfilo,
    profiloAttuale: function () { return profiloAttuale; },
    tourSquadra: Orbita.tour,
    tourAttivo: Orbita.tourAttivo
  };
  document.dispatchEvent(new Event('sito-pronto'));
})();
