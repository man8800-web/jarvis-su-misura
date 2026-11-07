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
    // durante la demo guidata titolo e stato parlano del mestiere scelto (il B&B usa il profilo «famiglia» per la forma)
    var inDemo = demo && demo.m.profilo === k, nome = inDemo ? demo.m.etichetta : p.nome;
    decodifica(h1Riga, (inDemo && TITOLI_DEMO[demo.k]) || TITOLI[k] || H1_ORIG);
    if (statoSis) {
      var i = $('i', statoSis); statoSis.textContent = ''; if (i) statoSis.appendChild(i);
      statoSis.appendChild(document.createTextNode(k === 'tutti' ? STATO_ORIG : 'Progettato intorno a te · ' + nome));
    }
    document.documentElement.style.setProperty('--vivo', p.colore);
    var ord = (SERVIZI[k] || SERVIZI.tutti).slice();
    if (temaServizio) { ord.splice(ord.indexOf(temaServizio), 1); ord.unshift(temaServizio); }
    riordinaServizi(ord, k === 'tutti' && !temaServizio ? [] : ord.slice(0, 2), temaServizio ? 'Quello che hai chiesto' : 'Utile per: ' + nome);
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
    if (demo) { chiediDemo(q, null, true); return; }         // dentro la demo risponde la conversazione preparata
    var c = capisci(q), P = profili(), blocchi = [], ricomposto = [];
    // un mestiere della demo senza nient'altro da dire (per esempio «gestisco un B&B»): parte la demo di quel mestiere
    var dm = mestiereDemo(q.toLowerCase(), c.profilo);
    if (dm && c.profilo === 'tutti' && !c.argomenti.length) { avviaDemo(dm, q, true); return; }
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
    // chi nomina un mestiere della demo può provarla subito, nei panni del cliente
    if (dm) blocchi[0].azioni = (blocchi[0].azioni || []).concat([{ etichetta: 'Prova la demo: ' + DEMO.mestieri[dm].etichetta.toLowerCase(), demo: dm }]);

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
    if (a.demo) {
      b = el('button', 'btn vuoto piccolo', a.etichetta); b.type = 'button';
      b.addEventListener('click', function () { avviaDemo(a.demo, null, true); });
      return b;
    }
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

  /* ---------- demo guidata: il visitatore fa il cliente, Jarvis l'assistente di un'attività di fantasia ---------- */
  // Conversazioni preparate in demo-dati.js: niente rete, niente archivio, niente intelligenza artificiale.
  // Le date degli orari si calcolano sul momento dal giorno del visitatore; non si chiede e non parte niente.
  var DEMO = window.DEMO && window.DEMO.mestieri ? window.DEMO : null, T = DEMO ? DEMO.testi : {};
  var demo = null;                                          // { k, m, chat, domande, salto }
  var TITOLI_DEMO = { bnb: 'Jarvis, per il tuo B&B.' };
  var etichetta = $('.vivo-etichetta', form), ETICHETTA_ORIG = etichetta ? etichetta.lastChild.textContent : '';
  var SEGNAPOSTO_ORIG = inp.placeholder, chips = [];
  var corsa = null;                                          // la scrittura progressiva in corso

  function mestiereDemo(t, profilo) {
    if (!DEMO) return null;
    var c = DEMO.ordine.filter(function (k) { return DEMO.mestieri[k].riconosci.test(t); });
    return c.filter(function (k) { return DEMO.mestieri[k].profilo === profilo; })[0] || c[0] || null;
  }
  function cercaScambio(m, t) {
    var s = m.scambi.map(function (x, i) { return [x, i]; })
      .sort(function (a, b) { return ((b[0].priorita || 0) - (a[0].priorita || 0)) || a[1] - b[1]; });
    var h = s.filter(function (x) { return x[0].re.test(t); })[0];
    return h ? h[0] : null;
  }
  function riempi(s, o) { return String(s).split('{giorno}').join(o.giorno).split('{ora}').join(o.ora); }
  // «va a il titolare» → «va al titolare»
  function aChi(chi) {
    var m = String(chi).match(/^(il |lo |la |l'|i |gli |le )(.*)$/);
    var P = { 'il ': 'al ', 'lo ': 'allo ', 'la ': 'alla ', "l'": "all'", 'i ': 'ai ', 'gli ': 'agli ', 'le ': 'alle ' };
    var r = m ? P[m[1]] + m[2] : 'a ' + chi;
    // anche dopo «e» e «o»: «al 112 e al tecnico», «alla segreteria e alla dottoressa»
    return r.replace(/ (e|o) (il |lo |la |l'|i |gli |le )/g, function (x, c, art) { return ' ' + c + ' ' + P[art]; });
  }
  function quando(o) { return o.giorno + ', ' + (o.ora.indexOf('–') >= 0 ? 'fascia ' : 'ore ') + o.ora; }
  function durata(n) {
    if (!n) return '';
    var h = Math.floor(n / 60), r = n % 60;
    return (h ? (h === 1 ? '1 ora' : h + ' ore') : '') + (h && r ? ' e ' : '') + (r ? r + ' minuti' : '');
  }
  // tre orari a partire da domani, solo nei giorni d'apertura: uno per giorno, o tre nello stesso giorno se il servizio ha un giorno solo
  function orari(m, p, salto) {
    var giorni = p.giorni || m.orari.giorni, fasce = p.fasce || m.orari.fasce, perGiorno = giorni.length <= 2 ? 3 : 1;
    var r = [], validi = 0, base = new Date(); base.setHours(12, 0, 0, 0);
    for (var n = 1; n < 200 && r.length < 3; n++) {
      var d = new Date(base.getTime()); d.setDate(base.getDate() + n);
      if (giorni.indexOf(d.getDay()) < 0) continue;
      if (validi++ < salto) continue;
      var g = T.giorni[d.getDay()] + ' ' + d.getDate() + ' ' + T.mesi[d.getMonth()];
      if (perGiorno > 1) for (var f = 0; f < fasce.length && r.length < 3; f++) r.push({ giorno: g, ora: fasce[f] });
      else r.push({ giorno: g, ora: fasce[(validi * 2 - 1) % fasce.length] });
    }
    return { orari: r, passo: perGiorno > 1 ? 1 : 3 };
  }

  function annuncia(t) { if (!annuncio) return; annuncio.textContent = ''; setTimeout(function () { annuncio.textContent = t; }, 60); }
  function bottone(cls, t, fai) { var b = el('button', cls, t); b.type = 'button'; b.addEventListener('click', fai); return b; }
  function mettiFuoco(n) { if (!n) return; if (!/^(BUTTON|A|INPUT)$/.test(n.tagName) && !n.hasAttribute('tabindex')) n.setAttribute('tabindex', '-1'); n.focus({ preventScroll: true }); }
  // porta in vista l'ultima battuta: dentro la chat (computer) e nella pagina (telefono)
  function inVista(n) {
    requestAnimationFrame(function () {
      if (!demo || !n.isConnected) return;
      var c = demo.chat;
      if (c.scrollHeight > c.clientHeight + 4) c.scrollTop += n.getBoundingClientRect().top - c.getBoundingClientRect().top - 10;
      // al telefono la barra dei comandi in basso copre circa 100 px: l'ultima riga deve restare sopra
      var r = n.getBoundingClientRect(), d = 0, fondo = innerHeight - (innerWidth <= 980 ? 110 : 16);
      if (r.top < 80) d = r.top - 90; else if (r.bottom > fondo) d = Math.min(r.top - 90, r.bottom - fondo + 8);
      if (d) scrollBy({ top: d, behavior: ridotto ? 'auto' : 'smooth' });
    });
  }

  // scrittura progressiva: se arriva una domanda nuova, la frase in corso si completa all'istante (mai frasi a metà)
  function finisciScrittura() { if (corsa) { var c = corsa; corsa = null; c.fine(); } }
  function digita(box, frasi, dopo) {
    var coda = frasi.map(function (f) { var p = el('p', 'vivo-frase'); box.appendChild(p); return [p, f]; });
    var io = { fatto: false };
    io.fine = function () {
      if (io.fatto) return; io.fatto = true; if (corsa === io) corsa = null;
      coda.forEach(function (x) { x[0].textContent = x[1]; });
      box.removeAttribute('aria-busy'); box.classList.add('pronta');
      if (dopo) dopo();
    };
    if (window.Suono) window.Suono.rintocco();
    if (window.Scena) window.Scena.impulso(.8);
    parla(frasi.join(' '));
    if (ridotto) { io.fine(); return; }
    corsa = io; box.setAttribute('aria-busy', 'true');
    var i = 0, j = 0, ultimo = 0;
    (function batti(ora) {
      if (io.fatto) return;
      var giro = 3;
      while (giro-- && i < coda.length) {
        var f = coda[i][1]; j = Math.min(f.length, j + 2); coda[i][0].textContent = f.slice(0, j);
        if (j >= f.length) { i++; j = 0; }
      }
      if (window.Scena && ora - ultimo > 110) { window.Scena.impulso(.12); ultimo = ora; }
      if (i < coda.length) requestAnimationFrame(batti); else io.fine();
    })(performance.now());
  }

  function turno(tu) {
    var t = el('div', 'demo-turno');
    if (tu) { var p = el('p', 'vivo-tu'); p.appendChild(el('span', 'sr', 'Tu, come cliente: ')); p.appendChild(document.createTextNode(tu)); t.appendChild(p); }
    var box = el('div', 'vivo-jarvis demo-j'); box.appendChild(el('span', 'sr', 'Jarvis: ')); t.appendChild(box);
    demo.chat.appendChild(t);
    while (demo.chat.children.length > 12) demo.chat.removeChild(demo.chat.firstChild);
    inVista(t);
    return box;
  }
  function carta(cls, titolo) { var c = el('div', 'demo-carta ' + cls); c.appendChild(el('p', 'demo-carta-titolo', titolo)); return c; }
  function messaggio(c, t) { var p = el('p', 'demo-messaggio', t); c.appendChild(p); c.appendChild(el('p', 'demo-piccola', T.anteprima)); }
  function azioni(lista) { var a = el('div', 'vivo-azioni'); lista.forEach(function (x) { a.appendChild(x); }); return a; }
  // «Il tuo piano Jarvis» (js/piano-jarvis.js): la scheda con la stima, per il mestiere della demo
  function pianoBtn() {
    if (!window.PianoJarvis || !window.PianoJarvis.ha(demo.k)) return null;
    var k = demo.k;
    return bottone('btn vuoto piccolo', T.piano || 'Il tuo piano Jarvis', function () { window.PianoJarvis.apri(k); });
  }
  function voglio() {
    return pulsante(vai('#scrivi', T.voglio, { tema: T.temaVoglio.replace('{etichetta}', demo.m.etichetta),
      frase: 'Ho provato la demo per ' + demo.m.etichetta.toLowerCase() + ': vorrei un Jarvis così per la mia attività.' }));
  }

  /* la prenotazione di prova: orari → scheda → conferma con l'anteprima del promemoria */
  function cartaOrari(s, salto) {
    var p = s.prenota, o = orari(demo.m, p, salto), c = carta('demo-orari', p.voce || 'Orari liberi');
    c.setAttribute('role', 'group'); c.setAttribute('aria-label', (p.voce || 'Orari liberi') + ': ' + p.servizio);
    var fila = el('div', 'demo-slot-fila');
    o.orari.forEach(function (x) {
      fila.appendChild(bottone('demo-slot', quando(x), function (e) {
        $$('button', c).forEach(function (b) { b.disabled = true; }); e.currentTarget.setAttribute('aria-pressed', 'true');
        scheda(s, x, salto);
      }));
    });
    fila.appendChild(bottone('demo-slot altro', T.altriOrari, function () {
      $$('button', c).forEach(function (b) { b.disabled = true; });
      var box = turno(T.altriOrari);
      digita(box, ['Ecco i successivi:'], function () { var n = cartaOrari(s, salto + o.passo); box.appendChild(n); mettiFuoco($('button', n)); inVista(box.parentNode); });
      annuncia('Jarvis: altri orari. ' + orari(demo.m, p, salto + o.passo).orari.map(quando).join('; ') + '.');
    }));
    c.appendChild(fila);
    return c;
  }
  function scheda(s, x, salto) {
    var p = s.prenota, box = turno(quando(x)), c = carta('demo-scheda', T.scheda), dl = el('dl');
    [['Attività', demo.m.attivita + ' (di fantasia)'], ['Servizio', p.servizio], ['Dettaglio', p.dettaglio], ['Quando', quando(x)], ['Durata', durata(p.durata)]]
      .forEach(function (r) { if (r[1]) { dl.appendChild(el('dt', null, r[0])); dl.appendChild(el('dd', null, r[1])); } });
    c.appendChild(dl);
    c.appendChild(el('p', 'demo-piccola', T.nessunDato));
    var si = bottone('btn oro piccolo', T.conferma, function () { si.disabled = no.disabled = true; conferma(s, x); });
    var no = bottone('btn vuoto piccolo', T.cambia, function () {
      si.disabled = no.disabled = true;
      var b2 = turno(T.cambia);
      digita(b2, ['Nessun problema. Ecco altri orari:'], function () { var n = cartaOrari(s, salto + orari(demo.m, p, salto).passo); b2.appendChild(n); mettiFuoco($('button', n)); inVista(b2.parentNode); });
    });
    c.appendChild(azioni([si, no]));
    box.classList.add('pronta'); box.appendChild(c);
    mettiFuoco($('.demo-carta-titolo', c));
    annuncia(T.scheda + ': ' + p.servizio + ', ' + quando(x) + '. ' + T.nessunDato + ' Conferma o cambia orario.');
  }
  function conferma(s, x) {
    var p = s.prenota, box = turno(T.conferma), testo = riempi(p.conferma, x);
    digita(box, [testo], function () {
      var c = carta('demo-confermata', T.confermata);
      c.appendChild(el('p', 'demo-piccola', T.promemoria + ' · ' + p.quando + ':'));
      messaggio(c, riempi(p.promemoria, x));
      c.appendChild(el('p', 'demo-dietro', T.dietro));
      var ul = el('ul', 'vivo-elenco'); T.dietroElenco.forEach(function (d) { ul.appendChild(el('li', null, d)); }); c.appendChild(ul);
      c.appendChild(azioni([voglio(), pianoBtn()].filter(Boolean)));
      box.appendChild(c);
      mettiFuoco($('.demo-carta-titolo', c)); inVista(box.parentNode);
    });
    annuncia('Jarvis: ' + testo + ' ' + T.promemoria + ': ' + riempi(p.promemoria, x) + ' ' + T.anteprima);
  }

  function rispondiScambio(box, s, daTastiera) {
    var dopo = [], parlato = s.risposta.join(' ') + (s.elenco ? ' ' + s.elenco.join('; ') + '.' : '');
    if (s.tipo === 'prenota') parlato += ' Orari proposti: ' + orari(demo.m, s.prenota, 0).orari.map(quando).join('; ') + '.';
    if (s.persona) parlato += ' ' + T.persona + ': ' + T.personaNota.replace('a {chi}', aChi(s.persona.chi));
    if (s.anteprima) parlato += ' ' + s.anteprima.titolo + ': ' + s.anteprima.testo + ' ' + T.anteprima;
    digita(box, s.risposta, function () {
      if (s.elenco) { var ul = el('ul', 'vivo-elenco'); s.elenco.forEach(function (x) { ul.appendChild(el('li', null, x)); }); box.appendChild(ul); }
      if (s.tipo === 'prenota') { var o = cartaOrari(s, 0); box.appendChild(o); if (!daTastiera) dopo.push($('button', o)); }
      if (s.persona) {
        var c = carta('demo-persona' + (s.tipo === 'urgenza' ? ' demo-urgente' : ''), T.persona);
        c.appendChild(el('p', null, T.personaNota.replace('a {chi}', aChi(s.persona.chi))));
        c.appendChild(el('p', 'demo-piccola', s.persona.motivo));
        c.appendChild(el('p', 'demo-piccola', 'Intanto il Jarvis vero ' + s.persona.cosa));
        box.appendChild(c);
      }
      if (s.anteprima) { var a = carta('demo-anteprima', s.anteprima.titolo); messaggio(a, s.anteprima.testo); box.appendChild(a); }
      var seguito = s.poi && demo.m.scambi.filter(function (x) { return x.id === s.poi; })[0];
      if (seguito) box.appendChild(azioni([bottone('btn vuoto piccolo', seguito.domanda, function () { chiediDemo(seguito.domanda, seguito.id, false); })]));
      if (dopo[0]) mettiFuoco(dopo[0]);
      inVista(box.parentNode);
    });
    annuncia('Jarvis: ' + parlato);
  }

  function chiediDemo(q, id, daTastiera) {
    if (!demo) return;
    var m = demo.m, t = q.toLowerCase(), s = null, giu = DEMO.lasciaAgliArgomenti.test(t);
    if (id) s = m.scambi.filter(function (x) { return x.id === id; })[0] || null;
    else if (!giu) s = cercaScambio(m, t);
    // un altro mestiere dichiarato («ho una pizzeria», «sono avvocato») o nominato da solo: si passa alla sua demo.
    // Una parola di passaggio («il locale è accessibile?», «un certificato medico») non porta via il cliente.
    if (!s && !giu && (/\b(ho|abbiamo|gestisco|gestiamo|sono|siamo|faccio|lavoro|apro|prova|provo|demo)\b/.test(t) || t.split(' ').length <= 3)) {
      var altro = mestiereDemo(t, null);
      if (altro && altro !== demo.k) { avviaDemo(altro, q, daTastiera); return; }
    }
    finisciScrittura();
    if (daTastiera) inp.value = '';
    var box = turno(q);
    if (s) {
      rispondiScambio(box, s, daTastiera);
      $$('[data-scambio="' + s.id + '"]', demo.domande).forEach(function (b) { b.classList.add('fatta'); });
      return;
    }
    // domande su Jarvis (costi, dati, «chi sei»): le risposte già scritte della pagina, senza cambiare profilo
    var blocchi = giu ? capisci(q).argomenti.map(function (a) { return a.fai ? a.fai(q) : null; }).filter(Boolean) : [];
    if (!blocchi.length) {
      var restano = m.scambi.filter(function (x) { return !$('[data-scambio="' + x.id + '"].fatta', demo.domande); }).slice(0, 3);
      blocchi = [{ frase: T.fuori.replace('{attivita}', m.attivita),
        azioni: restano.map(function (x) { return bottone('btn vuoto piccolo', x.domanda, function () { chiediDemo(x.domanda, x.id, false); }); })
          // nel modulo va una frase fissa, non quella del visitatore: nei panni del cliente può aver scritto sintomi o fatti legali
          .concat([pulsante(vai('#scrivi', 'Chiedilo a Manuel', { tema: T.temaVoglio.replace('{etichetta}', m.etichetta),
            frase: 'Ho provato la demo per ' + m.etichetta.toLowerCase() + ' e ho una domanda che non era nell\'esempio.' }))]) }];
    }
    var frasi = blocchi.map(function (b) { return b.frase; });
    digita(box, frasi, function () {
      blocchi.forEach(function (b) {
        if (b.elenco && b.elenco.length) { var ul = el('ul', 'vivo-elenco'); b.elenco.forEach(function (x) { ul.appendChild(el('li', null, x)); }); box.appendChild(ul); }
        if (b.azioni && b.azioni.length) box.appendChild(azioni(b.azioni.map(function (a) { return a.nodeType ? a : pulsante(a); })));
      });
      inVista(box.parentNode);
    });
    annuncia('Jarvis: ' + blocchi.map(function (b) { return b.frase + (b.elenco && b.elenco.length ? ' ' + b.elenco.join('; ') + '.' : ''); }).join(' '));
  }

  function avviaDemo(k, q, fuoco) {
    var m = DEMO && DEMO.mestieri[k]; if (!m) return;
    finisciScrittura(); if (sintesi) sintesi.cancel();
    demo = { k: k, m: m };
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mestiere') === k ? 'true' : 'false'); });
    out.textContent = ''; out.hidden = false; out.classList.add('demo');
    var testa = el('div', 'demo-testa'), chi = el('div', 'demo-chi');
    var nome = el('p', 'demo-attivita', m.attivita); chi.appendChild(nome);
    chi.appendChild(el('p', 'demo-fantasia', T.fantasia)); testa.appendChild(chi);
    testa.appendChild(azioni([bottone('btn vuoto piccolo', T.ricomincia, ricomincia), voglio(), pianoBtn()].filter(Boolean)));
    out.appendChild(testa);
    // sul computer la chat scorre da sola: con tabindex si scorre anche con le frecce della tastiera
    demo.chat = el('div', 'demo-chat'); demo.chat.tabIndex = 0; demo.chat.setAttribute('role', 'region'); demo.chat.setAttribute('aria-label', 'Conversazione di prova');
    out.appendChild(demo.chat);
    demo.domande = el('div', 'demo-domande'); demo.domande.setAttribute('role', 'group'); demo.domande.setAttribute('aria-label', T.domande);
    demo.domande.appendChild(el('p', 'demo-cap', T.domande));
    m.scambi.forEach(function (s) {
      var b = bottone('demo-domanda', s.domanda, function () { chiediDemo(s.domanda, s.id, false); });
      b.setAttribute('data-scambio', s.id); demo.domande.appendChild(b);
    });
    out.appendChild(demo.domande);
    if (etichetta) etichetta.lastChild.textContent = 'Fai il cliente: scrivi a ' + ((m.attivita.match(/«[^»]+»/) || [m.attivita])[0]);
    inp.placeholder = 'Per esempio: ' + m.scambi[0].domanda.toLowerCase();
    // la pagina si ricompone col profilo collegato (titolo, squadra, giornata, forma)
    ultimoProfilo = '';
    if (window.Sito) window.Sito.scegliProfilo(m.profilo, false);
    if (window.PianoJarvis) window.PianoJarvis.suggerisci(k);
    if (window.PrimaDopo) window.PrimaDopo.suggerisci(k);
    var box = turno(null);
    digita(box, [m.apertura]);
    annuncia('Esempio guidato con ' + m.attivita + '. ' + T.fantasia + ' Jarvis: ' + m.apertura);
    if (fuoco) mettiFuoco(nome);
    requestAnimationFrame(function () { var r = out.getBoundingClientRect(); if (r.top > innerHeight * .55 || r.top < 0) out.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' }); });
    // una domanda già scritta che corrisponde a uno scambio riceve subito la sua risposta
    if (q && !DEMO.lasciaAgliArgomenti.test(q.toLowerCase()) && cercaScambio(m, q.toLowerCase())) chiediDemo(q, null, true);
    else if (q) inp.value = '';
  }

  function ricomincia() {
    finisciScrittura(); if (sintesi) sintesi.cancel();
    demo = null; out.textContent = ''; out.hidden = true; out.classList.remove('demo');
    chips.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    if (etichetta) etichetta.lastChild.textContent = ETICHETTA_ORIG;
    inp.placeholder = SEGNAPOSTO_ORIG; inp.value = '';
    ultimoProfilo = '';
    if (window.Sito) window.Sito.scegliProfilo('tutti', false);
    if (chips[0]) chips[0].focus();
    annuncia('Demo ricominciata da capo. Scegli un mestiere, oppure scrivi cosa ti serve.');
  }

  // la scelta del mestiere sotto la riga di comando e la nota di onestà fissa, sempre visibile
  if (DEMO) {
    var scelta = el('div', 'demo-scelta'), tit = el('p', 'demo-titolo', T.titolo);
    tit.id = 'demo-titolo'; scelta.setAttribute('role', 'group'); scelta.setAttribute('aria-labelledby', 'demo-titolo');
    scelta.appendChild(tit);
    var fila = el('div', 'demo-mestieri');
    DEMO.ordine.forEach(function (k) {
      var m = DEMO.mestieri[k], p = profili()[m.profilo] || {};
      var b = bottone('demo-mestiere', m.etichetta, function () { avviaDemo(k, null, false); });
      b.setAttribute('data-mestiere', k); b.setAttribute('aria-pressed', 'false'); if (p.colore) b.style.setProperty('--c', p.colore);
      fila.appendChild(b); chips.push(b);
    });
    scelta.appendChild(fila);
    scelta.appendChild(el('p', 'demo-istruzioni', T.istruzioni));
    form.after(scelta);
    out.after(el('p', 'demo-nota', DEMO.nota));
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
  window.Vivo = { chiedi: function (q) { inp.value = q; invia(); }, fuoco: function () { inp.focus(); },
    demo: function (k) { avviaDemo(k, null, false); }, ricomincia: function () { if (demo) ricomincia(); } };
})();
