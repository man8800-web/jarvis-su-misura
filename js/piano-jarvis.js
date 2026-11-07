// «Il tuo piano Jarvis»: dal mestiere della demo, automazioni consigliate e ore risparmiate come STIMA,
// con il calcolo a vista e i numeri modificabili. La scheda si genera nel browser (file da scaricare o stampa/PDF).
// Nessuna rete, nessun archivio: lo stato vive solo in memoria. A Manuel arriva solo se il visitatore
// sceglie «Manda la scheda a Manuel», che copia il piano nel modulo esistente: parte solo con il suo Invia.
(function () {
  'use strict';
  var D = window.PIANO_JARVIS, DEMO = window.DEMO, T = D && D.testi;
  var banco = document.getElementById('pj-banco'), corpo = document.getElementById('pj-corpo');
  var scelta = document.getElementById('pj-mestieri'), annuncio = document.getElementById('pj-annuncio');
  if (!D || !DEMO || !banco || !corpo || !scelta) return;
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var MARCA = '— Il mio piano Jarvis —';

  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function num(x) { return x.toLocaleString('it-IT', { maximumFractionDigits: 1 }); }
  function ore(min) { var h = Math.round(min / 6) / 10; return h === 1 ? '1 ora' : num(h) + ' ore'; }
  function oreAnno(min, sett) { return Math.round(min * sett / 60); }
  function annuncia(t) { if (!annuncio) return; annuncio.textContent = ''; setTimeout(function () { annuncio.textContent = t; }, 60); }

  /* ---------- stato: solo in memoria ---------- */
  var st = null, sceltoDaLui = false;            // { k, m, righe: [{ a, on, volte, minuti, nodi }], settimane, nome }
  var chips = [];
  DEMO.ordine.forEach(function (k) {
    if (!D.mestieri[k]) return;
    var m = DEMO.mestieri[k], p = (window.PROFILI || {})[m.profilo] || {};
    var b = el('button', 'pj-chip', m.etichetta); b.type = 'button';
    b.setAttribute('data-mestiere', k); b.setAttribute('aria-pressed', 'false');
    if (p.colore) b.style.setProperty('--c', p.colore);
    b.addEventListener('click', function () { sceltoDaLui = true; scegli(k, true); });
    scelta.appendChild(b); chips.push(b);
  });
  corpo.appendChild(el('p', 'pj-vuoto', 'Scegli un mestiere qui sopra: le automazioni e la stima compaiono qui, con il calcolo.'));

  function campo(cls, etichetta, valore, min, max, id) {
    var w = el('label', 'pj-campo ' + cls); w.setAttribute('for', id);
    var i = el('input'); i.id = id; i.type = 'number'; i.inputMode = 'numeric'; i.min = min; i.max = max; i.step = 1; i.value = valore;
    w.appendChild(i); w.appendChild(el('span', 'pj-campo-t', etichetta));
    return { w: w, i: i, min: min, max: max };
  }
  function leggi(c) { var v = parseInt(c.i.value, 10); return isNaN(v) ? 0 : Math.max(c.min, Math.min(c.max, v)); }
  function normalizza(c) { c.i.addEventListener('blur', function () { var v = leggi(c); if (String(v) !== c.i.value) { c.i.value = v; aggiorna(); } }); }

  function scegli(k, fuoco, zitto) {
    var lista = D.mestieri[k], m = DEMO.mestieri[k]; if (!lista || !m) return;
    st = { k: k, m: m, settimane: D.settimane, nome: st ? st.nome : '', righe: lista.map(function (a) { return { a: a, on: true, volte: a.volte, minuti: a.minuti }; }) };
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mestiere') === k ? 'true' : 'false'); });
    disegna();
    var t = $('.pj-titolo', corpo);
    if (fuoco && t) { t.focus({ preventScroll: true }); }
    if (!zitto) annuncia('Piano per ' + m.etichetta.toLowerCase() + ': ' + st.righe.length + ' automazioni. ' + riassunto());
  }

  /* ---------- l'editor a schermo ---------- */
  var nodi = {};
  function disegna() {
    corpo.textContent = '';
    var p = (window.PROFILI || {})[st.m.profilo] || {};
    if (p.colore) banco.style.setProperty('--c', p.colore);
    var t = el('h3', 'pj-titolo', 'Il piano per: ' + st.m.etichetta.toLowerCase()); t.tabIndex = -1; corpo.appendChild(t);
    corpo.appendChild(el('p', 'pj-cap', '2 · Le automazioni da cui partirei'));
    corpo.appendChild(el('p', 'pj-ipotesi', T.ipotesi));
    var ol = el('ol', 'pj-righe');
    st.righe.forEach(function (r, i) {
      var li = el('li', 'pj-riga'), testa = el('div', 'pj-riga-testa');
      var cb = el('input'); cb.type = 'checkbox'; cb.checked = r.on; cb.id = 'pj-on-' + i;
      var lb = el('label', 'pj-on'); lb.setAttribute('for', cb.id); lb.appendChild(cb);
      lb.appendChild(el('span', 'pj-nome', r.a.nome));
      testa.appendChild(lb); li.appendChild(testa);
      var cosa = el('p', 'pj-cosa'); cosa.appendChild(el('b', null, 'Jarvis: ')); cosa.appendChild(document.createTextNode(r.a.jarvis + '. '));
      cosa.appendChild(el('b', null, 'A te: ')); cosa.appendChild(document.createTextNode(r.a.tuo + '.')); li.appendChild(cosa);
      var riga = el('div', 'pj-numeri');
      var v = campo('pj-volte', r.a.cosa + ' a settimana', r.volte, 0, 500, 'pj-v-' + i);
      var mi = campo('pj-minuti', 'minuti risparmiati ogni volta', r.minuti, 0, 240, 'pj-m-' + i);
      riga.appendChild(v.w); riga.appendChild(el('span', 'pj-op', '×')); riga.appendChild(mi.w);
      // «= ore» restano insieme: se la riga va a capo, scendono tutti e due
      var tot = el('span', 'pj-tot'); tot.appendChild(el('span', 'pj-op', '='));
      var esito = el('span', 'pj-ore'); tot.appendChild(esito); riga.appendChild(tot);
      li.appendChild(riga);
      var calc = el('p', 'pj-calcolo'); li.appendChild(calc);
      var barra = el('span', 'pj-barra'); barra.setAttribute('aria-hidden', 'true'); barra.appendChild(el('i')); li.appendChild(barra);
      r.nodi = { li: li, cb: cb, v: v, m: mi, esito: esito, calc: calc, barra: barra.firstChild };
      [v, mi].forEach(function (c) { c.i.addEventListener('input', aggiorna); normalizza(c); });
      cb.addEventListener('change', aggiorna);
      ol.appendChild(li);
    });
    corpo.appendChild(ol);

    // il totale, con il calcolo per intero
    var tot = el('div', 'pj-totale');
    tot.appendChild(el('p', 'pj-cap', '3 · La stima, con il calcolo'));
    var grande = el('p', 'pj-grande'); var gn = el('span', 'pj-grande-n'); grande.appendChild(gn); grande.appendChild(el('span', 'pj-grande-t', 'a settimana, stimate'));
    tot.appendChild(grande);
    var riga2 = el('div', 'pj-anno');
    var s = campo('pj-sett', 'settimane di lavoro in un anno', st.settimane, 1, 52, 'pj-settimane');
    s.i.addEventListener('input', aggiorna); normalizza(s);
    riga2.appendChild(s.w); var an = el('p', 'pj-anno-t'); riga2.appendChild(an);
    tot.appendChild(riga2);
    var somma = el('p', 'pj-calcolo pj-somma'); tot.appendChild(somma);
    var parti = el('p', 'pj-parti'); tot.appendChild(parti);
    tot.appendChild(el('p', 'pj-formula', T.formula + ' ' + T.netto));
    tot.appendChild(el('p', 'pj-promessa', T.nonPromessa));
    corpo.appendChild(tot);

    // nome sulla scheda (facoltativo, resta qui) e azioni
    var fine = el('div', 'pj-fine');
    fine.appendChild(el('p', 'pj-cap', '4 · La tua scheda'));
    var nl = el('label', 'pj-nome-campo'); nl.setAttribute('for', 'pj-nome');
    nl.appendChild(el('span', null, 'Nome da scrivere sulla scheda (facoltativo: resta sul tuo dispositivo)'));
    var ni = el('input'); ni.id = 'pj-nome'; ni.type = 'text'; ni.maxLength = 60; ni.autocomplete = 'off'; ni.value = st.nome;
    ni.placeholder = 'Per esempio: ' + st.m.attivita.replace(/^[^«]*«([^»]+)».*$/, '$1');
    ni.addEventListener('input', function () { st.nome = ni.value.replace(/\s+/g, ' ').trim().slice(0, 60); });
    nl.appendChild(ni); fine.appendChild(nl);
    var az = el('div', 'pj-azioni');
    var scarica = el('button', 'btn oro', 'Scarica la scheda'); scarica.type = 'button'; scarica.addEventListener('click', scaricaScheda);
    var stampa = el('button', 'btn vuoto', 'Stampa o salva in PDF'); stampa.type = 'button'; stampa.addEventListener('click', stampaScheda);
    var manda = el('a', 'btn vuoto', 'Manda la scheda a Manuel'); manda.href = '#scrivi';
    manda.setAttribute('data-tema', ('Il mio piano Jarvis: ' + st.m.etichetta).slice(0, 110));
    manda.addEventListener('click', mandaAManuel);
    var rimetti = el('button', 'pj-rimetti', 'Rimetti i numeri di partenza'); rimetti.type = 'button';
    rimetti.addEventListener('click', function () { scegli(st.k, true, true); annuncia('Numeri di partenza rimessi. ' + riassunto()); });
    az.appendChild(scarica); az.appendChild(stampa); az.appendChild(manda); az.appendChild(rimetti);
    fine.appendChild(az);
    fine.appendChild(el('p', 'pj-nota', 'Scaricare e stampare non inviano niente. «Manda la scheda a Manuel» copia il piano nel modulo qui sotto: lo vedi, lo cambi, e parte solo se compili i tuoi dati e premi Invia.'));
    corpo.appendChild(fine);
    nodi = { gn: gn, an: an, somma: somma, parti: parti, sett: s };
    aggiorna(true);
  }

  /* ---------- il calcolo ---------- */
  function calcola() {
    var tot = 0, max = 0, attive = [];
    st.righe.forEach(function (r) {
      if (r.nodi) { r.on = r.nodi.cb.checked; r.volte = leggi(r.nodi.v); r.minuti = leggi(r.nodi.m); }
      r.tot = r.volte * r.minuti;
      if (r.on) { tot += r.tot; attive.push(r); if (r.tot > max) max = r.tot; }
    });
    if (nodi.sett) st.settimane = leggi(nodi.sett);
    return { tot: tot, max: max, attive: attive };
  }
  function riassunto() {
    var c = calcola();
    return c.attive.length ? 'Stima: ' + ore(c.tot) + ' a settimana, circa ' + oreAnno(c.tot, st.settimane) + ' ore all\'anno su ' + st.settimane + ' settimane.' : 'Nessuna automazione nel piano.';
  }
  var attesaAnnuncio = null, mostrato = 0, animId = 0;
  function aggiorna(primo) {
    if (!st) return;
    var c = calcola();
    st.righe.forEach(function (r) {
      var n = r.nodi; if (!n) return;
      n.li.classList.toggle('spenta', !r.on);
      n.esito.textContent = ore(r.tot);
      n.calc.textContent = r.volte + ' × ' + r.minuti + ' min = ' + r.tot + ' min a settimana = ' + ore(r.tot) + (r.on ? '' : ' (fuori dal piano)');
      n.barra.style.transform = 'scaleX(' + (r.on && c.max ? Math.max(.02, r.tot / c.max) : 0) + ')';
    });
    conta(c.tot, primo);
    var anno = oreAnno(c.tot, st.settimane);
    nodi.an.textContent = '≈ ' + anno.toLocaleString('it-IT') + ' ore all\'anno';
    nodi.somma.textContent = c.attive.length
      ? 'Somma: ' + c.attive.map(function (r) { return r.tot; }).join(' + ') + ' = ' + c.tot + ' min a settimana = ' + ore(c.tot) + '. × ' + st.settimane + ' settimane = ' + anno.toLocaleString('it-IT') + ' ore all\'anno.'
      : 'Nessuna automazione nel piano: riaccendine almeno una.';
    var top = c.attive.slice().sort(function (a, b) { return b.tot - a.tot; }).filter(function (r) { return r.tot > 0; }).slice(0, 2);
    st.top = top.map(function (r) { return '«' + r.a.nome + '»'; }).join(' e ');
    nodi.parti.textContent = top.length ? 'Da dove partirei: ' + st.top + ', le stime più alte con i tuoi numeri.' : '';
    if (!primo) { clearTimeout(attesaAnnuncio); attesaAnnuncio = setTimeout(function () { annuncia(riassunto()); }, 900); }
  }
  // il numero grande scorre verso il nuovo totale (solo senza movimento ridotto)
  function conta(minuti, subito) {
    var arrivo = minuti, mio = ++animId;
    if (ridotto || subito || !nodi.gn) { mostrato = arrivo; nodi.gn.textContent = '≈ ' + ore(arrivo); return; }
    var da = mostrato, t0 = performance.now();
    (function passo(ora) {
      if (mio !== animId) return;
      var k = Math.min(1, (ora - t0) / 380), v = da + (arrivo - da) * (1 - Math.pow(1 - k, 3));
      mostrato = k < 1 ? v : arrivo; nodi.gn.textContent = '≈ ' + ore(mostrato);
      if (k < 1) requestAnimationFrame(passo);
    })(t0);
  }

  /* ---------- la scheda: un solo modello per file e stampa ---------- */
  var CSS = [
    '.pj-scheda{font:15px/1.5 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#141821;background:#fff;max-width:820px;margin:0 auto;padding:32px 28px}',
    '.pj-scheda *{box-sizing:border-box}',
    '.pj-scheda .s-marchio{margin:0;font:700 12px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;color:#8a6a12}',
    '.pj-scheda h1{margin:8px 0 4px;font-size:28px;line-height:1.15}',
    '.pj-scheda h1,.pj-scheda h2{max-width:none;width:auto;font-family:inherit;font-weight:700;letter-spacing:normal;color:#141821;background:none;-webkit-text-fill-color:currentColor;text-wrap:wrap}',
    '.pj-scheda h2{margin:24px 0 8px;font-size:17px;line-height:1.3;break-after:avoid}',
    '.pj-scheda p,.pj-scheda li{max-width:none}',
    '.pj-scheda .s-sotto{margin:0;color:#444}',
    '.pj-scheda .s-avviso{margin:16px 0;padding:12px 14px;border:2px solid #c9a227;border-radius:10px;background:#fff9e6}',
    '.pj-scheda table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13.5px}',
    '.pj-scheda th,.pj-scheda td{border:1px solid #c8ccd4;padding:7px 8px;text-align:left;vertical-align:top}',
    '.pj-scheda th{background:#eef1f5;font-size:12px;text-transform:uppercase;letter-spacing:.04em}',
    '.pj-scheda td.n{white-space:nowrap;text-align:right}',
    '.pj-scheda .s-tuo{display:block;margin-top:4px;color:#555}',
    '.pj-scheda tfoot td{font-weight:700;background:#f6f7f9}',
    '.pj-scheda .s-totale{margin:16px 0 4px;font-size:20px;font-weight:700}',
    '.pj-scheda .s-calcolo{margin:4px 0;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;color:#333}',
    '.pj-scheda ul{margin:6px 0;padding-left:20px}',
    '.pj-scheda .s-piede{margin-top:28px;padding-top:12px;border-top:1px solid #c8ccd4;font-size:12.5px;color:#555}',
    '@media (max-width:600px){.pj-scheda{padding:18px 12px}.pj-scheda table{font-size:12.5px}.pj-scheda th,.pj-scheda td{padding:6px 5px}}',
    '@media print{.pj-scheda{padding:0;max-width:none}.pj-scheda tr{break-inside:avoid}}'
  ].join('\n');

  function oggi() { return new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function scheda() {
    var c = calcola(), anno = oreAnno(c.tot, st.settimane);
    var a = el('article', 'pj-scheda'); a.setAttribute('lang', 'it');
    a.appendChild(el('p', 's-marchio', 'JARVIS SU MISURA'));
    a.appendChild(el('h1', null, 'Il tuo piano Jarvis'));
    a.appendChild(el('p', 's-sotto', 'Mestiere: ' + st.m.etichetta + (st.nome ? ' · ' + st.nome : '') + ' · ' + oggi()));
    a.appendChild(el('p', 's-avviso', 'STIMA, NON PROMESSA. ' + T.ipotesi + ' ' + T.nonPromessa));
    a.appendChild(el('h2', null, 'Le automazioni nel piano'));
    var tb = el('table'), th = el('thead'), tr = el('tr');
    ['Automazione', 'Cosa prepara Jarvis · cosa resta a te', 'Calcolo', 'Ore a settimana'].forEach(function (x) { tr.appendChild(el('th', null, x)); });
    th.appendChild(tr); tb.appendChild(th);
    var body = el('tbody');
    c.attive.forEach(function (r) {
      var row = el('tr');
      row.appendChild(el('td', null, r.a.nome));
      var chi = el('td'); chi.appendChild(document.createTextNode('Jarvis ' + r.a.jarvis + '.')); chi.appendChild(el('span', 's-tuo', 'A te: ' + r.a.tuo + '.')); row.appendChild(chi);
      row.appendChild(el('td', null, r.volte + ' ' + r.a.cosa + ' × ' + r.minuti + ' min = ' + r.tot + ' min'));
      row.appendChild(el('td', 'n', ore(r.tot)));
      body.appendChild(row);
    });
    if (!c.attive.length) { var vu = el('tr'), td = el('td', null, 'Nessuna automazione scelta.'); td.colSpan = 4; vu.appendChild(td); body.appendChild(vu); }
    tb.appendChild(body);
    var tf = el('tfoot'), fr = el('tr'), ft = el('td', null, 'Totale stimato'); ft.colSpan = 3; fr.appendChild(ft); fr.appendChild(el('td', 'n', ore(c.tot))); tf.appendChild(fr); tb.appendChild(tf);
    a.appendChild(tb);
    a.appendChild(el('p', 's-totale', '≈ ' + ore(c.tot) + ' a settimana · ≈ ' + anno.toLocaleString('it-IT') + ' ore all\'anno su ' + st.settimane + ' settimane di lavoro'));
    a.appendChild(el('p', 's-calcolo', nodi.somma ? nodi.somma.textContent : ''));
    a.appendChild(el('p', 's-calcolo', T.formula + ' ' + T.netto));
    var fuori = st.righe.filter(function (r) { return !r.on; });
    if (fuori.length) a.appendChild(el('p', null, 'Tolte da te: ' + fuori.map(function (r) { return r.a.nome; }).join(', ') + '.'));
    if (st.top) { a.appendChild(el('h2', null, 'Da dove partire')); a.appendChild(el('p', null, st.top + ': sono le stime più alte con i tuoi numeri.')); }
    a.appendChild(el('h2', null, 'Le regole che non cambiano'));
    var ul = el('ul');
    ['Verso i clienti non parte niente senza il tuo sì: Jarvis prepara, tu approvi.',
     'Password, pagamenti e decisioni sulle persone restano tuoi.',
     'Su salute, questioni legali e soldi Jarvis non dà consigli: passa la domanda a una persona.',
     'Nessun risultato garantito: questa stima la verifichi tu, sul tuo lavoro.'].forEach(function (x) { ul.appendChild(el('li', null, x)); });
    a.appendChild(ul);
    a.appendChild(el('p', 's-piede', 'Generata nel tuo browser il ' + oggi() + ' dalla pagina jarvissumisura.com: niente è stato inviato né salvato. Per il piano vero: info@jarvissumisura.com.'));
    return a;
  }

  function scaricaScheda() {
    if (!st) return;
    var art = scheda();
    var html = '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Il tuo piano Jarvis · ' + art.querySelector('.s-sotto').textContent.replace(/[<>&]/g, '') + '</title>\n<style>\nbody{margin:0;background:#fff}\n' + CSS + '\n</style>\n</head>\n<body>\n' + art.outerHTML + '\n</body>\n</html>\n';
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    var a = el('a'); a.href = url; a.download = 'piano-jarvis-' + st.k + '.html'; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
    annuncia('Scheda scaricata sul tuo dispositivo come file piano-jarvis-' + st.k + '.html. Non è stata inviata.');
  }

  var areaStampa = document.getElementById('pj-stampa');
  function stampaScheda() {
    if (!st || !areaStampa) return;
    areaStampa.textContent = '';
    var s = el('style'); s.textContent = CSS; areaStampa.appendChild(s); areaStampa.appendChild(scheda());
    document.documentElement.classList.add('pj-in-stampa');
    window.print();
    // Safari sul telefono può tornare prima della fine: la pulizia la fa anche afterprint
    setTimeout(fineStampa, 1500);
  }
  function fineStampa() { document.documentElement.classList.remove('pj-in-stampa'); }
  window.addEventListener('afterprint', fineStampa);

  /* ---------- a Manuel, solo se lo sceglie lui: il piano finisce nel modulo, a vista ---------- */
  function testoPiano() {
    var c = calcola(), r = [MARCA, 'Stima fatta da me sul sito, con i miei numeri.', 'Mestiere: ' + st.m.etichetta + (st.nome ? ' · ' + st.nome : '')];
    c.attive.forEach(function (x) { r.push('- ' + x.a.nome + ': ' + x.volte + ' ' + x.a.cosa + ' a settimana × ' + x.minuti + ' min = ' + ore(x.tot)); });
    r.push('Totale stimato: ' + ore(c.tot) + ' a settimana, circa ' + oreAnno(c.tot, st.settimane) + ' ore all\'anno su ' + st.settimane + ' settimane.');
    r.push('Vorrei capire se è realistico per la mia attività.');
    return r.join('\n');
  }
  function mandaAManuel(e) {
    var campo = $('#richiesta'), dest = $('#scrivi'); if (!campo || !dest || !st) return;
    e.preventDefault();
    var nuovo = testoPiano(), v = campo.value, i = v.indexOf(MARCA);
    if (i >= 0) v = v.slice(0, i).replace(/\s+$/, '');      // una scheda vecchia si sostituisce, il resto resta
    campo.value = (v ? v + '\n\n' : '') + nuovo;
    campo.value = campo.value.slice(0, 2000);
    campo.dispatchEvent(new Event('input'));
    if (window.Pannelli) window.Pannelli.chiudiTutti();
    dest.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
    var f = $('#nome'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, ridotto ? 0 : 650);
    annuncia('Piano copiato nel campo della richiesta del modulo. Non è stato inviato: parte solo se compili i tuoi dati e premi Invia.');
  }

  /* ---------- aggancio con la demo (js/vivo.js) ---------- */
  window.PianoJarvis = {
    // dalla demo: apre il piano del mestiere e lo porta in vista
    apri: function (k) {
      if (!D.mestieri[k]) return;
      sceltoDaLui = true;
      if (!st || st.k !== k) scegli(k, false);
      var s = document.getElementById('piano-jarvis'); if (!s) return;
      s.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
      var t = $('.pj-titolo', corpo); if (t) setTimeout(function () { t.focus({ preventScroll: true }); }, ridotto ? 0 : 650);
    },
    // chi prova un mestiere nella demo trova il piano già su quel mestiere, se non ne ha scelto un altro
    suggerisci: function (k) { if (!sceltoDaLui && D.mestieri[k] && (!st || st.k !== k)) scegli(k, false, true); },
    ha: function (k) { return !!D.mestieri[k]; }
  };
})();
