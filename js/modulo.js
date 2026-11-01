// Modulo di contatto a due passi.
// Passo 1: chi sei + consenso. Passo 2 (si sblocca da solo): la richiesta.
// L'invio va al web app di Google Apps Script indicato in js/config.js (moduloUrl).
(function () {
  'use strict';
  var CFG = window.JARVIS_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var form = $('#modulo'); if (!form) return;

  var f = {
    nome: $('#nome'), cognome: $('#cognome'), email: $('#email'), whatsapp: $('#whatsapp'),
    consenso: $('#consenso'), trappola: $('#sito_web'), richiesta: $('#richiesta')
  };
  var err = { nome: $('#err-nome'), cognome: $('#err-cognome'), email: $('#err-email'), whatsapp: $('#err-whatsapp'), richiesta: $('#err-richiesta') };
  var passoDue = $('#passo-due'), testoBlocco = $('#testo-blocco'), saluto = $('#saluto-jarvis');
  var esito = $('#esito'), conferma = $('#conferma'), invia = $('#invia'), conta = $('#conta-caratteri');
  var SALUTO_INIZIALE = saluto ? saluto.textContent : '';
  var BLOCCO_INIZIALE = testoBlocco ? testoBlocco.textContent : '';
  var tema = '', sbloccatoAlle = 0, inInvio = false, toccati = {};

  // Il WhatsApp è facoltativo; se compilato deve sembrare un numero.
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function cifre(s) { return (s.match(/\d/g) || []).length; }

  var regole = {
    nome: function () { var v = f.nome.value.trim(); return v.length < 2 ? 'Scrivi il tuo nome.' : ''; },
    cognome: function () { var v = f.cognome.value.trim(); return v.length < 2 ? 'Scrivi il tuo cognome.' : ''; },
    email: function () { var v = f.email.value.trim(); return !RE_EMAIL.test(v) ? 'Scrivi un indirizzo email valido, per esempio nome@dominio.it.' : ''; },
    whatsapp: function () {
      var v = f.whatsapp.value.trim(); if (!v) return '';
      return (!/^\+?[0-9 ().\-]{6,25}$/.test(v) || cifre(v) < 6 || cifre(v) > 15) ? 'Il numero non sembra giusto. Puoi lasciarlo vuoto.' : '';
    },
    richiesta: function () { var v = f.richiesta.value.trim(); return v.length < 10 ? 'Raccontami qualcosa in più (almeno una frase).' : ''; }
  };

  function mostra(campo, messaggio) {
    if (!err[campo]) return;
    err[campo].textContent = messaggio;
    f[campo].setAttribute('aria-invalid', messaggio ? 'true' : 'false');
  }
  function controlla(campo, mostraErrore) {
    var m = regole[campo](); if (mostraErrore) mostra(campo, m); return !m;
  }
  function passoUnoValido() {
    return !regole.nome() && !regole.cognome() && !regole.email() && !regole.whatsapp() && f.consenso.checked;
  }

  function sblocca() {
    if (!passoDue.disabled) return;
    passoDue.disabled = false; sbloccatoAlle = Date.now();
    var n = f.nome.value.trim();
    if (saluto) saluto.textContent = 'Piacere, ' + n + '. Ora dimmi cosa ti serve.';
    if (testoBlocco) testoBlocco.textContent = 'Sbloccato. Scrivi la tua richiesta qui sotto.';
    if (tema && !f.richiesta.value.trim()) { f.richiesta.value = 'Mi interessa: ' + tema + '. '; aggiornaConta(); }
  }
  function blocca() {
    if (passoDue.disabled) return;
    passoDue.disabled = true;
    if (saluto) saluto.textContent = SALUTO_INIZIALE;
    if (testoBlocco) testoBlocco.textContent = BLOCCO_INIZIALE;
  }
  function aggiorna() { if (passoUnoValido()) sblocca(); else blocca(); }

  ['nome', 'cognome', 'email', 'whatsapp'].forEach(function (c) {
    f[c].addEventListener('input', function () { if (toccati[c]) controlla(c, true); aggiorna(); });
    f[c].addEventListener('blur', function () { if (f[c].value.trim() || toccati[c]) { toccati[c] = true; controlla(c, true); } });
  });
  f.consenso.addEventListener('change', aggiorna);

  function aggiornaConta() { if (conta) conta.textContent = f.richiesta.value.length + ' / 2000'; }
  f.richiesta.addEventListener('input', function () { aggiornaConta(); if (toccati.richiesta) controlla('richiesta', true); });
  f.richiesta.addEventListener('blur', function () { if (f.richiesta.value.trim()) { toccati.richiesta = true; controlla('richiesta', true); } });

  // I pulsanti «Parliamone» e i link dal mini piano portano qui un argomento.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-tema]'); if (!a) return;
    tema = (a.getAttribute('data-tema') || '').slice(0, 120);
    if (!passoDue.disabled && !f.richiesta.value.trim() && tema) { f.richiesta.value = 'Mi interessa: ' + tema + '. '; aggiornaConta(); }
  });

  function messaggio(testo, tipo) {
    esito.className = 'esito' + (tipo ? ' ' + tipo : '');
    esito.textContent = testo || '';
  }

  function configurato() {
    var u = (CFG.moduloUrl || '').trim();
    return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u) ? u : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (inInvio) return;
    // Premere invio nel passo 1 non invia: porta al passo 2 oppure segnala cosa manca.
    var tutti = ['nome', 'cognome', 'email', 'whatsapp'], ok1 = true;
    tutti.forEach(function (c) { toccati[c] = true; if (!controlla(c, true)) ok1 = false; });
    if (!f.consenso.checked) {
      ok1 = false; messaggio('Per continuare serve il consenso al trattamento dei dati (casella qui sopra).', 'errore'); f.consenso.focus();
    }
    if (!ok1) { if (f.consenso.checked) { var primo = tutti.filter(function (c) { return regole[c](); })[0]; if (primo) f[primo].focus(); messaggio('', ''); } return; }
    if (passoDue.disabled) sblocca();
    toccati.richiesta = true;
    if (!controlla('richiesta', true)) { f.richiesta.focus(); messaggio('', ''); return; }
    messaggio('', '');

    // Campo trappola per i programmi automatici: se è compilato, finge e non invia niente.
    if (f.trappola.value) { mostraConferma(); return; }

    var url = configurato();
    if (!url) {
      messaggio('Il modulo non è ancora collegato alla casella di Manuel, quindi la tua richiesta NON è stata inviata. Riprova tra poco: il collegamento è in fase di attivazione.', 'errore');
      return;
    }

    var dati = {
      nome: f.nome.value.trim(), cognome: f.cognome.value.trim(), email: f.email.value.trim(),
      whatsapp: f.whatsapp.value.trim(), richiesta: f.richiesta.value.trim(),
      tema: tema, profilo: (window.Sito && window.Sito.profiloAttuale && window.Sito.profiloAttuale()) || '',
      consenso: true, versioneInformativa: CFG.versioneInformativa || '',
      sito_web: '', ms: Date.now() - sbloccatoAlle
    };
    inInvio = true; invia.disabled = true; invia.textContent = 'Invio in corso…';
    messaggio('Sto mandando la richiesta a Jarvis…', 'attesa');

    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    // text/plain evita la richiesta preliminare che Apps Script non gestisce.
    fetch(url, {
      method: 'POST', redirect: 'follow', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dati),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(timer);
      if (j && j.ok) { mostraConferma(); }
      else { fallito((j && j.errore) || 'Qualcosa non ha funzionato.'); }
    }).catch(function () {
      clearTimeout(timer);
      fallito('Non riesco a raggiungere il server. Controlla la connessione e riprova: se il problema resta, scrivi direttamente a Manuel.');
    });
  });

  function fallito(testo) {
    inInvio = false; invia.disabled = false; invia.textContent = 'Invia a Jarvis';
    messaggio(testo, 'errore');
  }

  function mostraConferma() {
    inInvio = false;
    var n = f.nome.value.trim();
    form.hidden = true;
    $('#conferma-titolo').textContent = 'Jarvis ha ricevuto.';
    $('#conferma-testo').textContent = 'Grazie' + (n ? ', ' + n : '') + '. Manuel ti risponde di persona via email' + (f.whatsapp.value.trim() ? ' o su WhatsApp' : '') + '.';
    conferma.classList.add('si'); conferma.focus();
    // pulizia: i dati non restano nella pagina
    ['nome', 'cognome', 'email', 'whatsapp', 'richiesta'].forEach(function (c) { f[c].value = ''; });
    f.consenso.checked = false;
  }

  aggiornaConta();
})();
