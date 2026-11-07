// «Prova a fregarmi»: il visitatore scrive la domanda più cattiva e riceve la risposta preparata.
// Riconoscimento per parole chiave, tutto nel browser: nessuna rete, nessun cookie, niente salvato.
// Il muro «non farà mai» sta nell'HTML (#fr-muro, una voce per indice): unica fonte, visibile anche senza script.
(function (g) {
  'use strict';
  var SOGLIA = 4;        // da qui in su la risposta è «riconosciuta»
  var VICINE = 3;        // quante alternative mostrare

  function norm(t) {
    return ' ' + String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }
  // chiave con spazi = frase (deve iniziare a inizio parola); fino a 3 lettere = parola esatta; altrimenti radice
  function punteggio(n, parole, k) {
    var s = 0, chiave, i;
    for (chiave in k) {
      if (!Object.prototype.hasOwnProperty.call(k, chiave)) continue;
      if (chiave.indexOf(' ') >= 0) { if (n.indexOf(' ' + chiave) >= 0) s += k[chiave]; continue; }
      if (chiave.length <= 3) { if (parole.indexOf(chiave) >= 0) s += k[chiave]; continue; }
      for (i = 0; i < parole.length; i++) if (parole[i].indexOf(chiave) === 0) { s += k[chiave]; break; }
    }
    return s;
  }
  function trova(testo, dati) {
    dati = dati || g.FREGARMI;
    var n = norm(testo), parole = n.trim() ? n.trim().split(' ') : [];
    var cl = dati.domande.map(function (d, i) { return { d: d, s: parole.length ? punteggio(n, parole, d.k) : 0, i: i }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    var top = cl[0] && cl[0].s >= SOGLIA ? cl[0] : null;
    return { migliore: top ? top.d : null, punti: top ? top.s : 0,
      vicine: cl.slice(top ? 1 : 0).filter(function (x) { return x.s >= 2; }).slice(0, VICINE).map(function (x) { return x.d; }) };
  }
  g.Fregarmi = { trova: trova, norm: norm, SOGLIA: SOGLIA };

  var doc = g.document, sez = doc && doc.getElementById('fregarmi'), D = g.FREGARMI;
  if (!sez || !D) return;
  var $ = function (s) { return sez.querySelector(s); };
  var form = $('#fr-form'), campo = $('#fr-domanda'), uscita = $('#fr-risposta'), annuncio = $('#fr-annuncio'),
      nota = $('#fr-nota'), contaEl = $('#fr-conta'), scorc = $('#fr-scorciatoie'), muro = $('#fr-muro');
  var perId = {}; D.domande.forEach(function (d) { perId[d.id] = d; });
  var maiTesti = [].map.call(muro.querySelectorAll('li'), function (li) { return li.textContent.trim(); });
  var affrontate = {}, pescate = [];
  var notaBase = nota.textContent;

  function el(tag, cls, testo) { var e = doc.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; }

  // scorciatoie: le domande che fanno tutti
  D.scorciatoie.forEach(function (id) {
    var d = perId[id]; if (!d) return;
    var b = el('button', 'fr-chip', d.d); b.type = 'button'; b.setAttribute('data-id', id); scorc.appendChild(b);
  });
  var pesca = el('button', 'fr-chip fr-pesca', 'Pescane una a caso'); pesca.type = 'button'; pesca.setAttribute('data-pesca', '1'); scorc.appendChild(pesca);

  function aggiornaConta() {
    var n = Object.keys(affrontate).length;
    contaEl.textContent = n ? 'Domande cattive affrontate in questa visita: ' + n + ' su ' + D.domande.length + '.' : '';
  }
  function bottoneManuel(domanda, oro) {
    var a = el('a', 'btn piccolo ' + (oro ? 'oro' : 'vuoto'), oro ? 'Mandala a Manuel' : 'Non ti basta? Chiedilo a Manuel');
    a.href = '#scrivi';
    a.setAttribute('data-tema', ('Domanda da «Prova a fregarmi»: ' + domanda).slice(0, 110));
    return a;
  }
  function vicineEl(lista, titolo) {
    if (!lista.length) return null;
    var box = el('div', 'fr-vicine'); box.appendChild(el('p', 'fr-vicine-t', titolo));
    lista.forEach(function (d) { var b = el('button', 'fr-chip', d.d); b.type = 'button'; b.setAttribute('data-id', d.id); box.appendChild(b); });
    return box;
  }
  function mostra(d, chiesto, vicine) {
    uscita.textContent = '';
    var c = el('article', 'fr-carta' + (d ? '' : ' fr-ripiego'));
    var testa = el('div', 'fr-testa');
    if (chiesto) { var q = el('p', 'fr-chiesto'); q.appendChild(el('span', '', 'Hai scritto ')); q.appendChild(el('q', '', chiesto)); testa.appendChild(q); }
    testa.appendChild(el('span', 'fr-bollino', d ? 'Risposta preparata · n. ' + (D.domande.indexOf(d) + 1) + ' di ' + D.domande.length : 'Nessuna risposta preparata'));
    c.appendChild(testa);
    var h = el('h3', 'fr-titolo', d ? d.d : D.ripiego.t); h.id = 'fr-titolo'; h.tabIndex = -1; c.appendChild(h);
    if (d && chiesto) c.appendChild(el('p', 'fr-capito', 'Ho capito questa domanda. Se non era quella, guarda sotto «Non era questa?».'));
    c.appendChild(el('p', 'fr-r', d ? d.r : D.ripiego.r));
    var lim = el('div', 'fr-limite'); lim.appendChild(el('b', '', 'Il limite, detto chiaro')); lim.appendChild(el('p', '', d ? d.l : D.ripiego.l)); c.appendChild(lim);
    if (d && d.m && d.m.length) {
      var mai = el('div', 'fr-mai'); mai.appendChild(el('b', '', 'E qui Jarvis non farà mai:'));
      var ul = el('ul'); d.m.forEach(function (i) { if (maiTesti[i]) ul.appendChild(el('li', '', maiTesti[i])); }); mai.appendChild(ul); c.appendChild(mai);
    }
    var v = vicineEl(vicine || [], d ? 'Non era questa?' : 'Forse cercavi una di queste:'); if (v) c.appendChild(v);
    var piede = el('div', 'fr-piede'); piede.appendChild(bottoneManuel(chiesto || (d ? d.d : ''), !d));
    piede.appendChild(el('span', 'fr-piede-nota', 'La domanda finisce nel modulo qui sotto: parte solo se lo compili e premi invio.'));
    c.appendChild(piede);
    uscita.appendChild(c);
    if (d) { affrontate[d.id] = 1; aggiornaConta(); }
    // annuncio breve e completo per i lettori di schermo (la carta non è una regione viva: niente doppioni)
    annuncio.textContent = '';
    var testoAnnuncio = d ? 'Risposta a: ' + d.d + '. ' + d.r + ' Il limite: ' + d.l
                          : D.ripiego.t + ' ' + D.ripiego.r;
    g.setTimeout(function () { annuncio.textContent = testoAnnuncio; }, 60);
  }
  function rispondi(testo) {
    var t = String(testo || '').trim().slice(0, 200);
    if (!t) { nota.textContent = 'Scrivi una domanda, anche cattivissima. Oppure tocca una di quelle qui sotto.'; nota.classList.add('fr-avviso'); campo.focus(); return; }
    nota.textContent = notaBase; nota.classList.remove('fr-avviso');
    var esito = trova(t, D);
    mostra(esito.migliore, t, esito.vicine);
  }
  function apriId(id, chiesto) {
    var d = perId[id]; if (!d) return;
    var vicine = trova(d.d, D).vicine.filter(function (x) { return x.id !== id; });
    mostra(d, chiesto || '', vicine);
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); rispondi(campo.value); });
  sez.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.fr-chip'); if (!b) return;
    if (b.hasAttribute('data-pesca')) {
      // prima quelle non ancora viste, in ordine casuale; poi si ricomincia
      if (!pescate.length) pescate = D.domande.map(function (d) { return d.id; }).filter(function (id) { return !affrontate[id]; });
      if (!pescate.length) pescate = D.domande.map(function (d) { return d.id; });
      var id = pescate.splice(Math.floor(Math.random() * pescate.length), 1)[0];
      campo.value = '';
      apriId(id); return;
    }
    var dentro = b.closest('.fr-carta');
    campo.value = '';   // la domanda scritta prima non c'entra più con quella scelta
    apriId(b.getAttribute('data-id'));
    // dalla carta si torna al titolo nuovo (il bottone premuto non esiste più)
    if (dentro) { var h = $('#fr-titolo'); if (h) h.focus({ preventScroll: true }); }
  });
})(window);
