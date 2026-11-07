// «Il tuo Jarvis si assembla»: il visitatore racconta cosa gli serve, la pagina sceglie i moduli giusti
// da un catalogo reale e li aggancia uno alla volta. Tutto avviene nel browser: il testo non viene inviato.
// La scena 3D (costruzione.js) si carica solo quando la sezione è vicina; senza 3D resta l'elenco.
(function () {
  'use strict';
  var sez = document.getElementById('assemblaggio');
  if (!sez) return;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('assembla-form'), testo = $('assembla-testo'), nome = $('assembla-nome');
  var lista = $('assembla-moduli'), stato = $('assembla-stato'), orologio = $('assembla-orologio');
  var biglietto = $('assembla-biglietto'), bTitolo = $('assembla-b-titolo'), bCorpo = $('assembla-b-corpo');
  var btnVia = $('assembla-via'), btnVoce = $('assembla-voce'), btnSuono = $('assembla-suono');
  var andiamo = $('assembla-andiamo'), stampa = $('assembla-stampa'), tela = $('assembla-tela');
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* catalogo: cosa sa fare davvero un Jarvis su misura (le stesse cose descritte nel resto del sito) */
  var BASE = [
    { id: 'memoria', t: 'Memoria', d: 'Ricorda quello che gli affidi: clienti, abitudini, decisioni già prese.', c: 0x5ad7ff },
    { id: 'si', t: 'Il tuo sì', d: 'Le azioni importanti, come inviare o pagare, partono solo dopo la tua conferma.', c: 0xf3cd73 }
  ];
  var CATALOGO = [
    { id: 'posta', t: 'Posta', d: 'Smista i messaggi in arrivo e prepara le bozze di risposta. L\'invio resta a te.', c: 0x5ad7ff, k: /post|mail|messagg|pec|rispost|inbox/ },
    { id: 'agenda', t: 'Agenda', d: 'Tiene appuntamenti, scadenze e promemoria, e ti avvisa prima che si sovrappongano.', c: 0x5fe3a1, k: /agenda|appunt|calendar|riunion|scadenz|promemoria|prenot|orari/ },
    { id: 'preventivi', t: 'Preventivi e documenti', d: 'Prepara preventivi, offerte e lettere dal tuo listino e con il tuo modo di scrivere.', c: 0xf3cd73, k: /preventiv|fattur|document|contratt|offert|listino|ordin|pratich/ },
    { id: 'contenuti', t: 'Contenuti e social', d: 'Bozze di post, newsletter e testi nella tua voce. Si pubblica solo con il tuo via.', c: 0xc38bff, k: /social|post\b|instagram|facebook|linkedin|newsletter|contenut|marketing|blog|sito/ },
    { id: 'ricerca', t: 'Ricerca e confronto', d: 'Cerca, confronta prezzi e fornitori e ti porta le fonti, non solo le conclusioni.', c: 0xff9f43, k: /prezz|confront|acquist|fornitor|ricerc|cercar|mercato|concorren|offerte/ },
    { id: 'clienti', t: 'Clienti e richieste', d: 'Tiene in ordine chi ti scrive, a che punto è ogni richiesta e cosa va ripreso.', c: 0xff7eb6, k: /client|paziente|pazienti|assistenza|richiest|lead|contatt|ospit|studio/ },
    { id: 'numeri', t: 'Numeri e report', d: 'Raccoglie i dati che già hai e li trasforma in un resoconto leggibile ogni settimana.', c: 0x5ad7ff, k: /report|numeri|contabil|vendit|incass|budget|statistic|dati|excel|fogli|spese/ },
    { id: 'voce', t: 'Voce', d: 'Gli parli e ti risponde a voce, dal computer e dal telefono.', c: 0x5fe3a1, k: /voce|parl|telefon|chiam|dettar|vocale/ }
  ];
  var PREDEFINITI = ['posta', 'agenda', 'preventivi'];

  var token = 0, inCorso = false, parlaOn = false, suonoOn = false, scenaPronta = false, scenaCaricata = false;
  var inizio = 0, ticker = 0, ultimaConfigurazione = null;

  function pulisci(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function frammento(s, re) {
    var m = re.exec(s); if (!m) return '';
    var p = s.split(' '), pos = 0, idx = 0;
    for (var i = 0; i < p.length; i++) { if (pos + p[i].length >= m.index) { idx = i; break; } pos += p[i].length + 1; }
    var a = Math.max(0, idx - 2), b = Math.min(p.length, idx + 4);
    var f = p.slice(a, b).join(' ').replace(/^[,;.:\s]+|[,;.:\s]+$/g, '');
    return f.length > 70 ? f.slice(0, 68) + '…' : f;
  }
  function scegli(s) {
    var minuscolo = s.toLowerCase(), scelti = [];
    CATALOGO.forEach(function (m) { if (m.k.test(minuscolo)) scelti.push({ m: m, rif: frammento(s, m.k) }); });
    var generico = !scelti.length;
    if (generico) PREDEFINITI.forEach(function (id) { CATALOGO.forEach(function (m) { if (m.id === id) scelti.push({ m: m, rif: '' }); }); });
    return { scelti: scelti.slice(0, 6), generico: generico };
  }

  /* ---------- suono e voce: spenti finché il visitatore non li accende ---------- */
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, master = null;
  function audio() {
    if (!AC) return null;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function scatto(freq, durata, vol) {
    if (!suonoOn || !audio()) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + durata);
    f.type = 'lowpass'; f.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + durata + 0.02);
    // un colpo secco di rumore filtrato: il metallo che entra nell'alloggiamento
    var n = Math.floor(ctx.sampleRate * 0.05), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var r = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), rg = ctx.createGain();
    r.buffer = b; bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2; rg.gain.value = vol * 0.9;
    r.connect(bp); bp.connect(rg); rg.connect(master); r.start(t);
  }
  function accordoFinale() {
    if (!suonoOn || !audio()) return;
    var t = ctx.currentTime;
    [110, 164.81, 220, 329.63].forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 / (1 + i * 0.5), t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 3.3);
    });
  }
  // solo voci italiane del dispositivo: le voci «di rete» (per esempio quelle Google di Chrome)
  // manderebbero la frase, nome del visitatore compreso, ai server di chi le fornisce
  function voceLocale() {
    return speechSynthesis.getVoices().filter(function (v) { return /^it/i.test(v.lang) && v.localService; })[0] || null;
  }
  function di(frase) {
    if (!parlaOn || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      var v = voceLocale(); if (!v) return;
      var u = new SpeechSynthesisUtterance(frase);
      u.voice = v; u.lang = v.lang; u.rate = 0.98; u.pitch = 0.9; u.volume = 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* senza voce non cambia nulla */ }
  }
  function interruttore(btn, nomeEtichetta, get, set) {
    btn.addEventListener('click', function () {
      set(!get());
      btn.setAttribute('aria-pressed', get() ? 'true' : 'false');
      btn.textContent = nomeEtichetta + ': ' + (get() ? 'accesa' : 'spenta');
      if (nomeEtichetta === 'Voce' && !get() && 'speechSynthesis' in window) speechSynthesis.cancel();
      if (nomeEtichetta === 'Suono' && get()) { audio(); scatto(420, 0.12, 0.08); }
    });
  }
  interruttore(btnVoce, 'Voce', function () { return parlaOn; }, function (v) { parlaOn = v; });
  interruttore(btnSuono, 'Suono', function () { return suonoOn; }, function (v) { suonoOn = v; });
  if (!('speechSynthesis' in window)) { btnVoce.hidden = true; }
  else {
    // il pulsante compare solo se il dispositivo ha una voce italiana sua (le voci arrivano anche dopo)
    var controllaVoce = function () { btnVoce.hidden = !voceLocale(); };
    controllaVoce();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', controllaVoce);
  }
  if (!AC) { btnSuono.hidden = true; }

  /* ---------- la scena si carica quando la sezione è vicina ---------- */
  function senzaScena() { sez.classList.add('senza-scena'); scenaPronta = false; }
  function caricaScena() {
    if (scenaCaricata) return; scenaCaricata = true;
    if (/[?&]3d=0\b/.test(location.search) || !('noModule' in HTMLScriptElement.prototype) || !tela) { senzaScena(); return; }
    var ok = false;
    try {
      var c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl');
      ok = !!g; if (g) { var x = g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
    } catch (e) { ok = false; }
    if (!ok) { senzaScena(); return; }
    window.addEventListener('costruzione-pronta', function () { scenaPronta = true; }, { once: true });
    window.addEventListener('costruzione-persa', function () { scenaPronta = false; senzaScena(); });
    var s = document.createElement('script');
    s.type = 'module'; s.src = 'js/costruzione/costruzione.js';
    s.onerror = senzaScena;
    document.head.appendChild(s);
    setTimeout(function () { if (!scenaPronta && !window.Costruzione) senzaScena(); }, 9000);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (v) { if (v[0].isIntersecting) { io.disconnect(); if (window.requestIdleCallback) requestIdleCallback(caricaScena, { timeout: 1200 }); else setTimeout(caricaScena, 200); } }, { rootMargin: '900px 0px' });
    io.observe(sez);
  } else { caricaScena(); }

  /* ---------- l'assemblaggio ---------- */
  function attendi(ms) { return new Promise(function (r) { setTimeout(r, ridotto ? Math.min(ms, 80) : ms); }); }
  function tempo() {
    var s = Math.floor((performance.now() - inizio) / 1000);
    orologio.textContent = 'T+ ' + ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function riga(m, n, base, rif) {
    var li = document.createElement('li'); if (base) li.className = 'base';
    var a = document.createElement('span'); a.className = 'n'; a.textContent = ('0' + n).slice(-2);
    var b = document.createElement('span'); b.className = 't'; b.textContent = m.t;
    var c = document.createElement('span'); c.className = 'st'; c.textContent = 'Agganciato';
    var d = document.createElement('span'); d.className = 'd'; d.textContent = m.d;
    li.appendChild(a); li.appendChild(b); li.appendChild(c); li.appendChild(d);
    if (rif) { var r = document.createElement('span'); r.className = 'rq'; r.textContent = 'Dalla tua richiesta: «' + rif + '»'; li.appendChild(r); }
    lista.appendChild(li);
    requestAnimationFrame(function () { li.classList.add('visibile'); });
    return li;
  }
  function riepilogo(cfg, nomeV) {
    var elenco = cfg.map(function (x) { return x.m.t; });
    var s = nomeV ? 'Pronto, ' + nomeV + '.' : 'Pronto.';
    return { titolo: s, corpo: 'Ho messo insieme ' + cfg.length + ' moduli: ' + elenco.join(', ') + '. Questa è una dimostrazione: il tuo Jarvis vero lo costruiamo insieme, sulle tue regole e con i tuoi dati.' };
  }

  async function assembla(richiesta, nomeV) {
    var mio = ++token; inCorso = true;
    btnVia.disabled = true; btnVia.textContent = 'Assemblaggio in corso…';
    biglietto.classList.remove('in'); biglietto.hidden = true;
    lista.innerHTML = '';
    if (window.Costruzione) window.Costruzione.reset();
    var sc = scegli(richiesta);
    var tutti = BASE.map(function (m) { return { m: m, rif: '', base: true }; }).concat(sc.scelti);
    ultimaConfigurazione = { elementi: tutti, nome: nomeV, richiesta: richiesta };
    inizio = performance.now(); tempo(); clearInterval(ticker); ticker = setInterval(tempo, 500);

    stato.textContent = 'ANALISI DELLA RICHIESTA';
    di(sc.generico ? 'Non ho trovato indicazioni precise. Parto da una configurazione di base.' : 'Ho capito. Comincio ad assemblare.');
    await attendi(900); if (mio !== token) return;

    for (var i = 0; i < tutti.length; i++) {
      var e = tutti[i];
      stato.textContent = 'MODULO ' + (i + 1) + ' DI ' + tutti.length + ' · ' + e.m.t.toUpperCase();
      var li = riga(e.m, i + 1, e.base, e.rif);
      if (window.Costruzione && scenaPronta) {
        await window.Costruzione.aggancia(i, e.m.c);
        if (mio !== token) return;
        window.Costruzione.nucleo((i + 1) / tutti.length * 0.92);
      } else { await attendi(650); if (mio !== token) return; }
      li.classList.add('agganciato'); scatto(300 + i * 28, 0.16, 0.12);
      await attendi(ridotto ? 40 : 520); if (mio !== token) return;
    }
    stato.textContent = 'CONFIGURAZIONE COMPLETA · SISTEMA PRONTO';
    if (window.Costruzione && scenaPronta) window.Costruzione.pronto();
    clearInterval(ticker); tempo();
    accordoFinale();
    var r = riepilogo(tutti, nomeV);
    bTitolo.textContent = r.titolo; bCorpo.textContent = r.corpo;
    andiamo.setAttribute('data-tema', ('Il mio Jarvis: ' + tutti.slice(2).map(function (x) { return x.m.t; }).join(', ')).slice(0, 110));
    biglietto.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { biglietto.classList.add('in'); }); });
    di(r.titolo + ' ' + r.corpo);
    btnVia.disabled = false; btnVia.textContent = 'Assembla di nuovo'; inCorso = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (inCorso) return;
    var r = pulisci(testo.value);
    if (r.length < 8) {
      testo.setAttribute('aria-invalid', 'true');
      stato.textContent = 'SERVE UNA RIGA IN PIÙ: COSA VUOI CHE FACCIA?';
      testo.focus(); return;
    }
    testo.removeAttribute('aria-invalid');
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    assembla(r, pulisci(nome.value).replace(/[<>]/g, '').slice(0, 40));
    if (innerWidth <= 900) { var q = sez.querySelector('.colonna-scena'); if (q && q.scrollIntoView) q.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' }); }
  });
  stampa.addEventListener('click', function () { window.print(); });
})();
