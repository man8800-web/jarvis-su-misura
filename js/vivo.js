// Jarvis vivo: il visitatore scrive (o parla, dove il browser riconosce la voce sul dispositivo)
// e la pagina si ricompone attorno alla richiesta: titolo, squadra, giornata, servizi, scena 3D.
// Cervello a regole, tutto in locale: le risposte usano solo testi già presenti nel sito
// (profili.js, regole di piano.js, domande frequenti, schede). Nessuna rete, nessun archivio nel browser.
(function () {
  'use strict';
  var form = document.getElementById('vivo'); if (!form) return;
  var inp = document.getElementById('vivo-testo'), out = document.getElementById('vivo-risposta');
  var mic = document.getElementById('vivo-mic'), suggerimenti = document.getElementById('vivo-suggerimenti');
  var annuncio = document.getElementById('vivo-annuncio');   // regione per i lettori di schermo: il testo intero, una volta sola
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var testo = function (n) { return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; };

  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function profili() { return (window.Sito && window.Sito.profili) || window.PROFILI || {}; }

  /* ---------- la pagina che si ricompone ---------- */
  var h1Riga = $('#titolo .riga:nth-child(2) span'), statoSis = $('.stato-sistemi');
  var H1_ORIG = h1Riga ? h1Riga.textContent : '';
  var STATO_ORIG = statoSis ? testo(statoSis) : '';
  var TITOLI = {
    negozio: 'Jarvis, per il tuo negozio.', barbiere: 'Jarvis, per il tuo salone.', legale: 'Jarvis, per il tuo studio.',
    ristorante: 'Jarvis, per il tuo locale.', studio: 'Jarvis, per il tuo studio.', artigiano: 'Jarvis, per la tua impresa.',
    famiglia: 'Jarvis, per la tua famiglia.'
  };
  // ordine delle schede «Cosa costruiamo» per profilo (le chiavi vengono da data-tema dei pulsanti)
  var SERVIZI = {
    tutti: ['jarvis', 'app', 'sito', 'automazioni', 'video'],
    negozio: ['jarvis', 'video', 'sito', 'app', 'automazioni'],
    barbiere: ['jarvis', 'app', 'video', 'sito', 'automazioni'],
    legale: ['jarvis', 'automazioni', 'sito', 'app', 'video'],
    ristorante: ['jarvis', 'video', 'app', 'sito', 'automazioni'],
    studio: ['jarvis', 'automazioni', 'app', 'sito', 'video'],
    artigiano: ['jarvis', 'automazioni', 'sito', 'app', 'video'],
    famiglia: ['jarvis', 'app', 'automazioni', 'sito', 'video']
  };
  var CHIAVE_TEMA = { 'Il mio Jarvis su misura': 'jarvis', "Un'app su misura": 'app', 'Un sito web su misura': 'sito', "Un'automazione o un programma": 'automazioni', 'Video e contenuti social': 'video' };
  var boxServizi = $('#servizi .servizi');
  var schede = {};
  $$('.servizio', boxServizi).forEach(function (s, i) {
    var b = $('[data-tema]', s), k = b && CHIAVE_TEMA[b.getAttribute('data-tema')];
    if (k) { schede[k] = s; s.style.setProperty('view-transition-name', 'servizio-' + k); }
  });

  // effetto decodifica: le lettere passano da segni casuali al testo nuovo
  var decodId = 0;
  function decodifica(nodo, nuovo) {
    if (!nodo || nodo.textContent === nuovo) return;
    var mio = ++decodId;
    if (ridotto) { nodo.textContent = nuovo; return; }
    var segni = '▮▯◆◇/\\<>_—=+*', t0 = performance.now(), durata = 720;
    nodo.classList.add('decodifica');
    (function passo(ora) {
      if (mio !== decodId) return;
      var k = Math.min(1, (ora - t0) / durata), s = '';
      for (var i = 0; i < nuovo.length; i++) {
        var c = nuovo[i];
        s += (c === ' ' || i / nuovo.length < k * 1.15 - .15) ? c : segni[(Math.random() * segni.length) | 0];
      }
      nodo.textContent = s;
      if (k < 1) requestAnimationFrame(passo); else { nodo.textContent = nuovo; nodo.classList.remove('decodifica'); }
    })(t0);
  }

  function riordinaServizi(ordine, evidenzia, etichetta) {
    if (!boxServizi) return;
    function applica() {
      ordine.forEach(function (k) { if (schede[k]) boxServizi.appendChild(schede[k]); });
      Object.keys(schede).forEach(function (k) {
        var s = schede[k], sel = evidenzia.indexOf(k) >= 0, tag = $('.per-te', s);
        s.classList.toggle('scelto', sel);
        if (sel && !tag) { tag = el('span', 'per-te'); $('h3', s).before(tag); }
        if (tag) { if (sel) tag.textContent = etichetta; else tag.remove(); }
      });
    }
    // transizione morbida dove il browser la offre; la scena 3D non entra nella dissolvenza
    if (document.startViewTransition && !ridotto && visibile(boxServizi)) document.startViewTransition(applica);
    else applica();
  }
  function visibile(n) { var r = n.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }

  // segno di luce sulle sezioni appena cambiate, la prima volta che si vedono
  var ioRic = ('IntersectionObserver' in window) ? new IntersectionObserver(function (v) {
    v.forEach(function (x) { if (x.isIntersecting && x.target.classList.contains('ricomposta')) { x.target.classList.add('lampo'); setTimeout(function () { x.target.classList.remove('ricomposta', 'lampo'); }, 1600); } });
  }, { threshold: .2 }) : null;
  function segnaRicomposte(ids) {
    ids.forEach(function (id) { var s = document.getElementById(id); if (!s) return; s.classList.remove('lampo'); s.classList.add('ricomposta'); if (ioRic) { ioRic.unobserve(s); ioRic.observe(s); } });
  }

  // qualsiasi cambio di profilo (pulsanti, mini piano, Jarvis vivo) ricompone la pagina
  var ultimoProfilo = null, temaServizio = null;
  document.addEventListener('profilo-cambiato', function (e) {
    var k = e.detail && e.detail.chiave, p = profili()[k]; if (!p) return;
    if (k === ultimoProfilo && !temaServizio) return;
    var primo = ultimoProfilo === null; ultimoProfilo = k;
    if (primo && k === 'tutti') return;                     // all'apertura la pagina resta com'è scritta
    decodifica(h1Riga, TITOLI[k] || H1_ORIG);
    if (statoSis) {
      var i = $('i', statoSis); statoSis.textContent = ''; if (i) statoSis.appendChild(i);
      statoSis.appendChild(document.createTextNode(k === 'tutti' ? STATO_ORIG : 'Progettato intorno a te · ' + p.nome));
    }
    document.documentElement.style.setProperty('--vivo', p.colore);
    var ord = (SERVIZI[k] || SERVIZI.tutti).slice();
    if (temaServizio) { ord.splice(ord.indexOf(temaServizio), 1); ord.unshift(temaServizio); }
    riordinaServizi(ord, k === 'tutti' && !temaServizio ? [] : ord.slice(0, 2), temaServizio ? 'Quello che hai chiesto' : 'Utile per: ' + p.nome);
    segnaRicomposte(['trasforma', 'giornata', 'squadra', 'servizi']);
    temaServizio = null;                                     // vale solo per la richiesta che l'ha portato
  });

  /* ---------- le fonti: testi già scritti nella pagina ---------- */
  function domanda(frammento) {
    var d = $$('#domande details').filter(function (x) { return testo($('summary', x)).toLowerCase().indexOf(frammento) >= 0; })[0];
    return d ? { d: d, domanda: testo($('summary', d)), risposta: testo($('p', d)) } : null;
  }
  function servizio(k) {
    var s = schede[k]; if (!s) return null;
    return { titolo: testo($('h3', s)), forte: testo($('.forte', s)), voci: $$('li', s).map(testo) };
  }
  function vai(id, etichetta, extra) { var a = { etichetta: etichetta, vai: id }; if (extra) for (var k in extra) a[k] = extra[k]; return a; }

  // argomenti riconosciuti: parole chiave -> risposta composta da testi della pagina
  var ARGOMENTI = [
    // chi chiede con chi sta parlando ha una risposta vera: qui non c'è né una persona né un'intelligenza artificiale
    { id: 'natura', re: /\bchi (sei|parla)\b|\bsei (un |una |un')?\s*(robot|bot|umano|persona|macchina|vero|vera|programma|ia\b|ai\b|intelligenza)|\b(parlo|sto parlando) con (un|una|chi)\b|\bcon chi (parlo|sto|sta)\b/,
      fai: function () { return { frase: 'Sono un\'anteprima a regole di Jarvis, non una persona e nemmeno un\'intelligenza artificiale: rispondo solo con i testi di questa pagina. Il Jarvis vero lo costruisce Manuel, e a Manuel puoi scrivere.', azioni: [vai('#dietro', 'Chi c\'è dietro')] }; } },
    { id: 'prezzo', re: /\bcost(a|i|o|ano|erebbe|er[àa])\b|prezz|quanto (viene|si paga|spend|mi (fai|fa))|tariff|budget|soldi|\beur(o|i)?\b|€|preventiv[oi] per (me|jarvis)/,
      fai: function () { var f = domanda('quanto costa'); return f && { frase: f.risposta, azioni: [vai('#scrivi', 'Chiedi il preventivo', { tema: 'Preventivo per il mio Jarvis' }), apriDomanda(f.d, 'Le altre domande')] }; } },
    { id: 'dati', re: /\bdati\b|privacy|\bsicur|gdpr|riservat|password|chi (li )?vede|dove (finisc|vann)/,
      fai: function () {
        var p = $$('#dati .promesse li').slice(0, 3).map(function (li) { return testo($('div > b', li)) + ': ' + testo($('div > span', li)); });
        return { frase: 'Il controllo resta a te. Ecco come, parola per parola dalla pagina:', elenco: p, azioni: [vai('#dati', 'Vedi tutte le garanzie')] };
      } },
    { id: 'sbaglia', re: /sbagli|errore|errori|fidar|affidabil/,
      fai: function () { var f = domanda('può sbagliare'); return f && { frase: f.risposta, azioni: [apriDomanda(f.d, 'Leggi la risposta')] }; } },
    { id: 'autonomo', re: /da solo|da sé|automaticament|senza (chieder|il mio)|di testa sua|invia (lui|da)/,
      fai: function () { var f = domanda('da solo'); return f && { frase: f.risposta, azioni: [vai('#dati', 'Come resta il controllo a te')] }; } },
    { id: 'computer', re: /\bmac\b|windows|\bpc\b|computer|android|linux/,
      fai: function () { var f = domanda('computer particolare'); return f && { frase: f.risposta, azioni: [apriDomanda(f.d, 'Leggi la risposta')] }; } },
    { id: 'account', re: /account|abbonament|chatgpt|openai|claude|gemini|intelligenza artificiale/,
      fai: function () { var f = domanda('account'); return f && { frase: f.risposta, azioni: [apriDomanda(f.d, 'Leggi la risposta')] }; } },
    { id: 'programmare', re: /programmar|scrivere (il )?codice|(poco|non sono (un |una )?)tecnic|difficil|complicat|non sono (capace|pratic)/,
      fai: function () { var f = domanda('programmare'); return f && { frase: f.risposta, azioni: [vai('#percorso', 'Come funziona per te')] }; } },
    { id: 'iniziare', re: /cominci|inizi|partir|con poco|piano piano|prova(re)?\b/,
      fai: function () { var f = domanda('cominciare'); return f && { frase: f.risposta, azioni: [vai('#percorso', 'I quattro passi')] }; } },
    { id: 'percorso', re: /come funziona|come si (fa|parte)|installazion|installar|\btempi\b|quanto ci (vuole|mette)|\bpassi\b/,
      fai: function () {
        var p = $$('#percorso .passi li').map(function (li) { return testo($('h3', li)) + ': ' + testo($('p', li)); });
        return { frase: 'Quattro passi, dal primo messaggio a Jarvis in funzione:', elenco: p, azioni: [vai('#percorso', 'Guarda il percorso')] };
      } },
    { id: 'voce', re: /\bvoce\b|parla(?!re con|rne|rti)|ascolt|sentir|vocal/,
      fai: function () {
        var p = $$('#poteri .potere').filter(function (x) { return testo($('h3', x)) === 'Voce'; })[0];
        return { frase: p ? testo($('p', p)) : 'Gli parli e risponde a voce, in italiano.', azioni: [vai('#ascolta', 'Ascolta la sua voce')] };
      } },
    // posta e messaggi: i ruoli che li curano nel profilo di partenza, parola per parola da profili.js
    { id: 'posta', re: /\be-?mail\b|\bmail\b|\bposta\b|messaggi|whatsapp|\bpec\b/,
      fai: function () {
        var base = (profili().tutti || {}).squadra || [];
        var l = base.filter(function (m) { return m[0] === 'Segreteria' || m[0] === 'Assistente clienti'; }).map(function (m) { return m[0] + ': ' + m[2]; });
        return l.length ? { frase: 'Posta e messaggi: ecco chi se ne occupa nella squadra d\'esempio. Le risposte le prepara lui, l\'invio resta tuo.', elenco: l, azioni: [vai('#giornata', 'Guarda la giornata'), vai('#dati', 'Cosa parte solo col tuo sì')] } : null;
      } },
    { id: 'telefono', re: /iphone|cellular|smartphone|in tasca|fuori (casa|ufficio)|(dal|sul|nel|col) telefono|app (per il|sul|del) telefono|in giro/,
      fai: function () {
        var l = $$('#tasca .tasca-elenco li').map(function (li) { return testo($('div > b', li)) + ': ' + testo($('div > span', li)); });
        return { frase: testo($('#tasca .intro')), elenco: l, azioni: [vai('#tasca', 'Jarvis in tasca')] };
      } },
    { id: 'squadra', re: /squadra|specialist|agent[ei]|team|collaborator/,
      fai: function () { return { frase: testo($('#squadra .intro')), azioni: [vai('#squadra', 'Guarda la squadra', { giro: true })] }; } },
    { id: 'app', servizio: 'app', re: /\bapp\b|applicazion|prenotazion|gestional/ },
    { id: 'sito', servizio: 'sito', re: /\bsit[oi]\b|web|landing|pagina internet/ },
    { id: 'automazioni', servizio: 'automazioni', re: /automa|programm[ai] per|ripetitiv|fattur|document/ },
    { id: 'video', servizio: 'video', re: /video|social|instagram|tiktok|facebook|post\b|carosell|reel/ },
    { id: 'chi', re: /chi (siete|c'è|c’è|ti ha|lo fa)|manuel|dove (siete|sei|state)|\broma\b|persona vera/,
      fai: function () { return { frase: 'Dietro c\'è una persona vera. Le sue parole, dalla pagina: «' + testo($('#dietro .intro')) + '»', azioni: [vai('#dietro', 'Chi c\'è dietro')] }; } },
    // solo chi chiede di parlare con Manuel: «gestire le email» o «troppe chiamate» sono un bisogno, non un contatto
    { id: 'contatto', re: /contatt|scriverti|scrivervi|scrivere a (te|voi|manuel)|parlarne|parlare con|(tua|tuo|vostra|vostro) (e-?mail|whatsapp|numero)|chiamarti|chiamarvi|(ti|vi) chiamo|appuntament[oi]? con (te|voi|manuel)|voglio (lo|il mio)/,
      fai: function (q) { return { frase: 'Raccontagli cosa ti serve qui sotto: Manuel ti risponde di persona. La tua frase la porto io nel modulo, e puoi cambiarla prima di inviare.', azioni: [vai('#scrivi', 'Scrivi a Manuel', { frase: q })] }; } }
  ];
  function apriDomanda(d, etichetta) { return { etichetta: etichetta, vai: '#domande', apri: d }; }

  /* ---------- il cervello: capisce, compone, ricompone ---------- */
  function capisci(q) {
    var t = q.toLowerCase(), trovati = [];
    ARGOMENTI.forEach(function (a) { if (a.re.test(t)) trovati.push(a); });
    var nat = trovati.filter(function (a) { return a.id === 'natura'; });
    if (nat.length) trovati = nat;                          // «sei un'intelligenza artificiale?» non è una domanda sull'account
    // chi chiede di parlare con una persona ha la precedenza su tutto il resto
    var k = trovati.findIndex(function (a) { return a.id === 'contatto'; });
    if (k > 0) trovati.unshift(trovati.splice(k, 1)[0]);
    var chiave = window.Piano ? window.Piano.trova(t) : 'tutti';
    if (chiave === 'tutti' && /\bprivat|per me\b|casa mia|vita/.test(t)) chiave = 'famiglia';
    return { profilo: chiave, argomenti: trovati.slice(0, 2) };
  }

  function rispondi(q) {
    var c = capisci(q), P = profili(), blocchi = [], ricomposto = [];
    var srv = c.argomenti.filter(function (a) { return a.servizio; })[0];
    temaServizio = srv ? srv.servizio : null;

    if (c.profilo !== 'tutti') {
      var p = P[c.profilo], passi = window.Piano ? window.Piano.primiPassi(c.profilo) : [];
      var ord = window.Piano ? window.Piano.ORDINE : ['Si parte da qui', 'Poi si aggiunge', 'Infine'];
      blocchi.push({
        frase: 'Ho capito: ' + p.nome.toLowerCase() + '. ' + p.frase + ' Io partirei così:',
        elenco: passi.map(function (m, i) { return ord[i] + ': ' + m[0] + '. ' + m[2]; }),
        azioni: [vai('#giornata', 'Guarda la tua giornata'), vai('#squadra', 'La tua squadra', { giro: true })]
      });
      ricomposto = ['Titolo riscritto per ' + p.nome.toLowerCase(), 'Squadra d\'esempio: ' + p.squadra.length + ' specialisti', 'Giornata tipo del tuo mestiere', 'Servizi riordinati per te', 'Nucleo con la forma e il colore del tuo lavoro'];
    }
    if (srv) {
      var s = servizio(srv.servizio);
      if (s) blocchi.push({ frase: s.titolo + '. ' + s.forte, elenco: s.voci, azioni: [vai('#servizi', 'Vedi la scheda'), vai('#scrivi', 'Parliamone', { tema: $('[data-tema]', schede[srv.servizio]).getAttribute('data-tema') })] });
      if (!ricomposto.length) ricomposto = ['«' + s.titolo + '» portato in cima ai servizi'];
    }
    c.argomenti.forEach(function (a) { if (!a.servizio && a.fai) { var b = a.fai(q); if (b) blocchi.push(b); } });

    if (!blocchi.length) {
      if (/^(ciao|salve|buongiorno|buonasera|hey|ehi|ei)\b/.test(q.toLowerCase())) blocchi.push({ frase: 'Ciao. Dimmi che lavoro fai, o cosa ti fa perdere tempo: la pagina si ricompone attorno a te.' });
      else blocchi.push({
        frase: 'Questa non la so: sono un\'anteprima a regole e conosco solo quello che c\'è scritto qui. Capisco il tuo mestiere e domande su costi, dati, posta, voce, telefono, squadra, app, siti, automazioni e video. Per tutto il resto risponde Manuel.',
        azioni: [vai('#scrivi', 'Chiedilo a Manuel', { frase: q })]
      });
    }
    // un'azione per scrivere a Manuel c'è sempre, con la frase del visitatore come argomento
    var haScrivi = blocchi.some(function (b) { return (b.azioni || []).some(function (a) { return a.vai === '#scrivi'; }); });
    if (!haScrivi && c.profilo !== 'tutti') blocchi[0].azioni.push(vai('#scrivi', 'Parliamone', { tema: 'Il mio Jarvis su misura', frase: q }));

    if (c.profilo !== 'tutti' && window.Sito) window.Sito.scegliProfilo(c.profilo, false);
    else if (srv) {
      // solo un servizio: la pagina porta in cima quello e lascia il profilo com'è
      var att = (window.Sito && window.Sito.profiloAttuale()) || 'tutti', o = (SERVIZI[att] || SERVIZI.tutti).slice();
      o.splice(o.indexOf(srv.servizio), 1); o.unshift(srv.servizio);
      riordinaServizi(o, [srv.servizio], 'Quello che hai chiesto'); segnaRicomposte(['servizi']);
      temaServizio = null;                                   // non deve restare appeso al prossimo clic su un profilo
    }
    mostra(q, blocchi.slice(0, 2), ricomposto);
  }

  /* ---------- la risposta a schermo: scritta lettera per lettera, poi i pulsanti ---------- */
  var scriviId = 0;
  function mostra(q, blocchi, ricomposto) {
    var mio = ++scriviId;
    out.textContent = ''; out.hidden = false;
    // se la risposta nasce sotto il bordo dello schermo (telefono), la porta in vista
    requestAnimationFrame(function () {
      var r = out.getBoundingClientRect();
      if (r.top > innerHeight * .55) out.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
    });
    var tu = el('p', 'vivo-tu'); tu.appendChild(el('span', 'sr', 'Hai scritto: ')); tu.appendChild(document.createTextNode(q)); out.appendChild(tu);
    var box = el('div', 'vivo-jarvis'); out.appendChild(box);
    var parlato = [];
    var coda = [];
    blocchi.forEach(function (b) {
      var p = el('p', 'vivo-frase'); box.appendChild(p); coda.push([p, b.frase]); parlato.push(b.frase);
      if (b.elenco && b.elenco.length) { var ul = el('ul', 'vivo-elenco'); b.elenco.forEach(function (x) { ul.appendChild(el('li', null, x)); }); box.appendChild(ul); }
      if (b.azioni && b.azioni.length) {
        var az = el('div', 'vivo-azioni');
        b.azioni.forEach(function (a) { az.appendChild(pulsante(a)); });
        box.appendChild(az);
      }
    });
    if (ricomposto.length) {
      var r = el('div', 'vivo-ricomposto'); r.appendChild(el('b', null, 'La pagina si è ricomposta'));
      var ul2 = el('ul'); ricomposto.forEach(function (x) { ul2.appendChild(el('li', null, x)); }); r.appendChild(ul2);
      box.appendChild(r);
    }
    box.appendChild(el('p', 'vivo-onesta', 'Anteprima: risponde con le regole di questa pagina, senza intelligenza artificiale e senza inviare niente.'));
    if (annuncio) {
      var tutto = blocchi.map(function (b) { return b.frase + (b.elenco && b.elenco.length ? ' ' + b.elenco.join('; ') + '.' : ''); }).join(' ');
      annuncio.textContent = ''; setTimeout(function () { annuncio.textContent = 'Jarvis: ' + tutto; }, 60);
    }
    if (window.Suono) window.Suono.rintocco();
    if (window.Scena) window.Scena.impulso(.8);
    parla(parlato.join(' '));
    if (ridotto) { coda.forEach(function (x) { x[0].textContent = x[1]; }); box.classList.add('pronta'); return; }
    // la scrittura è solo un effetto: il testo completo è già annunciato tutto insieme ai lettori di schermo
    box.setAttribute('aria-busy', 'true');
    var i = 0, j = 0, ultimoImpulso = 0;
    (function batti(ora) {
      if (mio !== scriviId) return;
      var giro = 3;
      while (giro-- && i < coda.length) {
        var nodo = coda[i][0], frase = coda[i][1];
        j = Math.min(frase.length, j + 2); nodo.textContent = frase.slice(0, j);
        if (j >= frase.length) { i++; j = 0; }
      }
      if (window.Scena && ora - ultimoImpulso > 110) { window.Scena.impulso(.12); ultimoImpulso = ora; }
      if (i < coda.length) requestAnimationFrame(batti);
      else { box.removeAttribute('aria-busy'); box.classList.add('pronta'); }
    })(performance.now());
  }

  function pulsante(a) {
    var b;
    // Nel modulo l'argomento è sempre un'etichetta fissa: la frase del visitatore va solo nel campo della richiesta,
    // a vista e modificabile, così non parte mai niente che lui non veda (modulo.js invia l'argomento a parte).
    if (a.vai === '#scrivi') { b = el('a', 'btn oro piccolo', a.etichetta); b.href = '#scrivi'; b.setAttribute('data-tema', String(a.tema || 'Una domanda fatta a Jarvis').slice(0, 110)); }
    else { b = el('a', 'btn vuoto piccolo', a.etichetta); b.href = a.vai; }
    b.addEventListener('click', function (e) {
      var dest = $(a.vai); if (!dest) return;
      e.preventDefault();
      var campo = a.frase && $('#richiesta');
      if (campo && !campo.value.trim()) { campo.value = String(a.frase).slice(0, 300) + ' '; campo.dispatchEvent(new Event('input')); }
      if (a.apri) a.apri.open = true;
      var bersaglio = a.apri || dest;
      bersaglio.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: a.apri ? 'center' : 'start' });
      if (a.giro && window.Sito && window.Sito.tourSquadra) { var c = $('#cmd-squadra'); if (window.Sito.tourSquadra(true) && c) c.setAttribute('aria-pressed', 'true'); }
      // il fuoco segue lo spostamento (tastiera e lettori di schermo)
      var f = a.vai === '#scrivi' ? $('#nome') : (a.apri ? $('summary', a.apri) : $('h2', dest));
      if (f) { if (!f.hasAttribute('tabindex') && !/^(INPUT|SUMMARY)$/.test(f.tagName)) f.setAttribute('tabindex', '-1'); setTimeout(function () { f.focus({ preventScroll: true }); }, ridotto ? 0 : 650); }
    });
    return b;
  }

  /* ---------- voce in uscita: solo voci italiane del dispositivo, solo con il suono acceso ---------- */
  var sintesi = window.speechSynthesis;
  function voceItaliana() {
    if (!sintesi) return null;
    var v = sintesi.getVoices().filter(function (x) { return /^it/i.test(x.lang) && x.localService; });
    return v[0] || null;
  }
  if (sintesi && sintesi.addEventListener) sintesi.addEventListener('voiceschanged', function () { /* le voci arrivano dopo */ });
  function parla(frase) {
    if (!sintesi || !(window.Suono && window.Suono.acceso())) return;
    var v = voceItaliana(); if (!v) return;
    sintesi.cancel();
    var u = new SpeechSynthesisUtterance(frase.slice(0, 420));
    u.voice = v; u.lang = v.lang; u.rate = 1.04; u.pitch = .95;
    u.onboundary = function () { if (window.Scena) window.Scena.impulso(.18); };
    u.onstart = function () { if (window.Suono) window.Suono.abbassa(true); };
    u.onend = u.onerror = function () { if (window.Suono) window.Suono.abbassa(false); };
    sintesi.speak(u);
  }
  document.addEventListener('suono-cambiato', function (e) { if (!e.detail && sintesi) sintesi.cancel(); });

  /* ---------- voce in ingresso: solo se il browser la riconosce sul dispositivo ---------- */
  // Il riconoscimento normale di Chrome e Safari manda l'audio ai loro server: qui non si usa.
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (mic && SR && typeof SR.available === 'function') {
    try {
      Promise.resolve(SR.available({ langs: ['it-IT'], processLocally: true })).then(function (s) {
        if (s !== 'available') return;
        mic.hidden = false;
        var rec = null, ascolta = false;
        mic.addEventListener('click', function () {
          if (ascolta && rec) { rec.stop(); return; }
          rec = new SR(); rec.lang = 'it-IT'; rec.processLocally = true; rec.interimResults = true; rec.maxAlternatives = 1;
          rec.onresult = function (ev) { var s = ''; for (var i = 0; i < ev.results.length; i++) s += ev.results[i][0].transcript; inp.value = s; };
          rec.onend = function () { ascolta = false; mic.setAttribute('aria-pressed', 'false'); form.classList.remove('ascolta'); if (inp.value.trim().length > 1) invia(); };
          rec.onerror = function () { ascolta = false; mic.setAttribute('aria-pressed', 'false'); form.classList.remove('ascolta'); };
          try { rec.start(); ascolta = true; mic.setAttribute('aria-pressed', 'true'); form.classList.add('ascolta'); } catch (x) { ascolta = false; }
        });
      }).catch(function () { /* niente microfono */ });
    } catch (x) { /* niente microfono */ }
  }

  /* ---------- ingressi ---------- */
  function invia() {
    var q = (inp.value || '').trim().replace(/\s+/g, ' ').slice(0, 160);
    if (q.length < 2) { inp.focus(); return; }
    rispondi(q);
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); invia(); });
  inp.addEventListener('input', function () { if (window.Suono) window.Suono.clic(); if (window.Scena) window.Scena.impulso(.05); });
  if (suggerimenti) suggerimenti.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    inp.value = b.getAttribute('data-frase') || b.textContent; invia();
  });

  // profilo già scelto prima che questo file partisse (per esempio ?profilo=legale nell'indirizzo)
  if (window.Sito && window.Sito.profiloAttuale) {
    var giaScelto = window.Sito.profiloAttuale();
    if (giaScelto && giaScelto !== 'tutti') { ultimoProfilo = 'tutti'; document.dispatchEvent(new CustomEvent('profilo-cambiato', { detail: { chiave: giaScelto } })); }
    else ultimoProfilo = giaScelto;
  }

  // il comando «Piano» e Jarvis vivo parlano la stessa lingua: da fuori si può scrivere qui
  window.Vivo = { chiedi: function (q) { inp.value = q; invia(); }, fuoco: function () { inp.focus(); } };
})();
