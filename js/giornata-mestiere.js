// «Una giornata sul tuo mestiere»: il visitatore sceglie il mestiere e scorre. Sul telefono arrivano i messaggi
// dei clienti, Jarvis prepara le risposte, il titolare dice sì, l'agenda si riempie, la sera partono i promemoria.
// Tutto nel browser: copione in giornata-dati.js, testi degli scambi da demo-dati.js. Nessuna rete, nessun archivio.
// Lo schermo è HTML vero: in 3D (giornata-3d.js, caricato solo vicino alla sezione) segue il vetro del telefono
// con una matrice di proiezione; senza WebGL o con movimento ridotto resta in una cornice disegnata col CSS.
(function () {
  'use strict';
  var sez = document.getElementById('mestiere');
  var G = window.GIORNATA, D = window.DEMO;
  if (!sez || !G || !D || !D.mestieri) return;
  var T = D.testi, TG = G.testi;
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || sez).querySelector(s); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function el(tag, cls, t) { var e = document.createElement(tag); if (cls) e.className = cls; if (t != null) e.textContent = t; return e; }
  function profili() { return (window.Sito && window.Sito.profili) || window.PROFILI || {}; }

  var pista = $('.mg-pista'), palco = $('.mg-palco'), scena = $('.mg-scena'), cornice = $('.mg-cornice');
  var oraTel = $('.mg-ora-tel'), corpo = $('.mg-corpo'), schermo = $('.mg-schermo'), riflesso = $('.mg-riflesso'), scala = 1;
  var cap = { num: $('.mg-num'), ora: $('.mg-ora'), titolo: $('.mg-titolo'), testo: $('.mg-testo'), fase: $('.mg-fase'), extra: $('.mg-extra') };
  var scegli = $('.mg-scegli'), boxChips = $('.mg-mestieri'), punti = $('.mg-punti'), prima = $('.mg-prima'), dopo = $('.mg-dopo');
  var copione = $('.mg-copione'), notaTesta = $('.mg-nota-testa'), nota = $('.mg-nota'), voce = $('.mg-annuncio');
  var daAnnunciare = -1;                                     // tappa scelta coi pulsanti: il lettore di schermo la legge

  // le fasi di ogni tipo di tappa: ognuna vale un tratto uguale di scorrimento
  var FASI = {
    punto: ['blocco', 'n1', 'n2'],
    prenota: ['arriva', 'bozza', 'inviata', 'ok', 'agenda'],
    info: ['arriva', 'bozza', 'inviata'],
    persona: ['arriva', 'passata', 'inviata'],
    lista: ['arriva', 'bozza', 'inviata', 'libera', 'inviataLista', 'riempito'],
    promemoria: ['pronti', 'partono', 'partiti'],
    riepilogo: ['fine', 'fine2']
  };
  // messaggi che volano verso il telefono (in) o partono dal telefono (out), per il 3D
  var VOLI = { arriva: 'in', ok: 'in', riempito: 'in', inviata: 'out', inviataLista: 'out', partono: 'tanti' };
  var UNITA = { ristorante: ['prenotazione', 'prenotazioni'], bnb: ['arrivo', 'arrivi'], idraulico: ['intervento', 'interventi'] };

  /* ---------- date: un giorno d'esempio in cui oggi e domani sono giorni d'apertura ---------- */
  function giorno(d) { return T.giorni[d.getDay()] + ' ' + d.getDate() + ' ' + T.mesi[d.getMonth()]; }
  function date(m) {
    var g = m.orari.giorni, base = new Date(); base.setHours(12, 0, 0, 0);
    var primo = null;
    for (var n = 0; n < 30; n++) {
      var o = new Date(base.getTime()); o.setDate(base.getDate() + n);
      var d = new Date(o.getTime()); d.setDate(o.getDate() + 1);
      if (g.indexOf(d.getDay()) < 0) continue;
      if (!primo) primo = [o, d];
      if (g.indexOf(o.getDay()) >= 0) return { oggi: o, domani: d };
    }
    return { oggi: primo[0], domani: primo[1] };
  }
  function maiuscola(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function minuti(ora) { var x = String(ora).match(/(\d+)(?::(\d+))?/); return x ? +x[1] * 60 + (+x[2] || 0) : 0; }
  function alleOre(ora) { return ora.indexOf('–') >= 0 ? 'nella fascia ' + ora : 'alle ' + ora; }
  // «va a il titolare» → «va al titolare»
  function a(chi) {
    var m = String(chi).match(/^(il |lo |la |l'|i |gli |le )(.*)$/);
    var P = { 'il ': 'al ', 'lo ': 'allo ', 'la ': 'alla ', "l'": "all'", 'i ': 'ai ', 'gli ': 'agli ', 'le ': 'alle ' };
    var r = m ? P[m[1]] + m[2] : 'a ' + chi;
    // anche dopo «e» e «o»: «al 112 e al tecnico», «alla segreteria e alla dottoressa»
    return r.replace(/ (e|o) (il |lo |la |l'|i |gli |le )/g, function (x, c, art) { return ' ' + c + ' ' + P[art]; });
  }
  function riempi(s, o) { return String(s).split('{giorno}').join(o.giorno).split('{ora}').join(o.ora); }

  /* ---------- il copione risolto per un mestiere ---------- */
  function risolvi(k) {
    var m = D.mestieri[k], c = G.mestieri[k], dt = date(m);
    var tappe = c.tappe.map(function (tp) {
      var s = tp.scambio ? m.scambi.filter(function (x) { return x.id === tp.scambio; })[0] : null;
      var r = {};
      for (var q in tp) r[q] = tp[q];
      r.domanda = tp.domanda || (s && s.domanda) || '';
      r.risposta = tp.risposta || (s && s.risposta) || [];
      r.elenco = s && s.elenco; r.persona = s && s.persona; r.prenota = s && s.prenota;
      r.messaggioLista = tp.messaggioLista || (s && s.anteprima && s.anteprima.testo) || '';
      r.fasi = FASI[tp.tipo];
      return r;
    });
    var prenota = tappe.filter(function (t) { return t.tipo === 'prenota'; })[0];
    var u = UNITA[k] || ['appuntamento', 'appuntamenti'];
    var g = { k: k, m: m, c: c, tappe: tappe, oggi: maiuscola(giorno(dt.oggi)), domani: giorno(dt.domani), prenota: prenota, unita: u };
    // agenda finale di domani: serve ai promemoria e ai conti
    g.agendaFinale = agenda(g, tappe.length, 0);
    var pm = tappe.filter(function (t) { return t.tipo === 'promemoria'; })[0];
    if (pm && prenota) {
      var testo = pm.promemoria || (prenota.prenota && prenota.prenota.promemoria) || '';
      pm.anteprima = riempi(testo, { giorno: g.domani, ora: prenota.scelto });
    }
    g.conti = conti(g);
    return g;
  }

  // lo stato dell'agenda di domani alla tappa ti, fase fi (le tappe precedenti sono finite)
  function agenda(g, ti, fi) {
    var righe = g.c.gia.map(function (r) { return { ora: r[0], nome: r[1], servizio: r[2], stato: '' }; });
    for (var j = 0; j <= Math.min(ti, g.tappe.length - 1); j++) {
      var t = g.tappe[j], f = j < ti ? 99 : fi, ora = j === ti;
      if (t.tipo === 'prenota' && f >= 3) righe.push({ ora: t.scelto, nome: t.cliente, servizio: (t.prenota && t.prenota.servizio) || '', stato: ora ? 'nuovo' : '' });
      if (t.tipo === 'lista' && f >= 3) righe.forEach(function (r) {
        if (r.ora !== t.libera) return;
        if (f >= 5) { r.nome = t.subentra; r.servizio = t.servizioNuovo; r.stato = ora ? 'nuovo' : ''; }
        else { r.stato = 'libero'; }
      });
    }
    righe.sort(function (x, y) { return minuti(x.ora) - minuti(y.ora); });
    return righe;
  }

  function conti(g) {
    var c = { ricevuti: 0, scritti: 0, tocchi: 0, nuovi: 0, persona: 0, promemoria: g.agendaFinale.length };
    g.tappe.forEach(function (t) {
      if (t.tipo === 'prenota') { c.ricevuti += 2; c.scritti += 1; c.tocchi += 1; c.nuovi += 1; }
      if (t.tipo === 'info') { c.ricevuti += 1; c.scritti += 1; c.tocchi += 1; }
      if (t.tipo === 'persona') { c.ricevuti += 1; c.scritti += 1; c.tocchi += 1; c.persona += 1; }
      if (t.tipo === 'lista') { c.ricevuti += 2; c.scritti += 2; c.tocchi += 2; c.nuovi += 1; }
      if (t.tipo === 'promemoria') { c.scritti += c.promemoria; c.tocchi += 1; }
    });
    return c;
  }

  /* ---------- cosa mostra lo schermo alla tappa ti, fase fi ---------- */
  function stato(g, ti, fi) {
    var t = g.tappe[ti], f = t.fasi[fi];
    if (f === 'arriva' && ti > 0) {
      var s = stato(g, ti - 1, g.tappe[ti - 1].fasi.length - 1);
      return { vista: s.vista, banner: { k: 'b' + ti, da: t.cliente, testo: t.domanda }, ora: t.ora, fase: f };
    }
    var v = null, banner = null;
    if (t.tipo === 'punto') {
      var ag = agenda(g, ti, 0), items = [];
      if (fi >= 1) items.push(notifica('n1', 'Buongiorno. Domani hai ' + ag.length + ' ' + (ag.length === 1 ? g.unita[0] : g.unita[1]) + ', il primo ' + alleOre(ag[0].ora) + '.'));
      if (fi >= 2) items.push(notifica('n2', 'Oggi ai clienti rispondo io, ma ogni messaggio te lo propongo prima: parte solo con il tuo sì.'));
      v = { k: 'blocco', tipo: 'blocco', data: g.oggi, ora: t.ora, items: items };
    } else if (t.tipo === 'prenota' || t.tipo === 'info' || t.tipo === 'persona' || (t.tipo === 'lista' && fi <= 2)) {
      if (f === 'agenda') v = vistaAgenda(g, ti, fi, []);
      else {
        var it = [bolla('c' + ti, t.cliente, t.domanda)];
        if (t.tipo === 'persona') it.push(cartaPersona(ti, t));
        var st = (f === 'bozza' || f === 'passata') ? 'bozza' : 'inviata';
        it.push(bozza('r' + ti, t, st));
        if (f === 'ok') it.push(bolla('o' + ti, t.cliente, t.ok));
        v = { k: 'chat' + ti, tipo: 'chat', cliente: t.cliente, items: it };
      }
    } else if (t.tipo === 'lista') {
      var cl = { k: 'w' + ti, crea: function () { return cartaLista(t); }, stato: f === 'libera' ? 'bozza' : 'inviata', tocca: f === 'inviataLista' };
      v = vistaAgenda(g, ti, fi, [cl]);
      if (f === 'riempito') banner = { k: 'p' + ti, da: t.subentra, testo: t.okLista };
    } else if (t.tipo === 'promemoria') {
      var righe = agenda(g, ti, fi).map(function (r) { r.stato = fi >= 1 ? 'inviato' : 'pronto'; return r; });
      var extra = [{ k: 'pm' + ti, crea: function () { return cartaPromemoria(g); }, stato: fi >= 1 ? 'inviata' : 'bozza', tocca: fi === 1 }];
      if (fi >= 2) banner = { k: 'pa' + ti, da: 'Il promemoria che riceve ' + g.prenota.cliente, testo: t.anteprima, oro: true };
      v = { k: 'promemoria', tipo: 'agenda', titolo: 'Promemoria per domani', data: g.domani, righe: righe, extra: extra };
    } else if (t.tipo === 'riepilogo') {
      v = { k: 'riepilogo', tipo: 'riepilogo', ora: t.ora, data: g.oggi };
    }
    return { vista: v, banner: banner, ora: t.ora, fase: f };
  }
  function vistaAgenda(g, ti, fi, extra) {
    return { k: 'agenda', tipo: 'agenda', titolo: g.c.agenda, data: g.domani, righe: agenda(g, ti, fi), extra: extra };
  }

  /* ---------- pezzi dello schermo (ognuno con la sua chiave: quelli già a schermo restano, i nuovi entrano) ---------- */
  function notifica(k, testo) {
    return { k: k, crea: function () { var n = el('div', 'mg-notifica'); n.appendChild(el('span', 'mg-app', 'Jarvis · adesso')); n.appendChild(el('p', null, testo)); return n; } };
  }
  function bolla(k, chi, testo) {
    return { k: k, crea: function () { var b = el('div', 'mg-bolla'); b.appendChild(el('small', null, chi)); b.appendChild(document.createTextNode(testo)); return b; } };
  }
  function bozza(k, t, st) {
    return { k: k, stato: st, tocca: st === 'inviata', crea: function () {
      var b = el('div', 'mg-bozza');
      b.appendChild(el('span', 'mg-etb', 'Jarvis · risposta pronta'));
      t.risposta.forEach(function (x) { b.appendChild(el('p', null, x)); });
      if (t.elenco) { var ul = el('ul'); t.elenco.forEach(function (x) { ul.appendChild(el('li', null, x)); }); b.appendChild(ul); }
      if (t.proposti) {
        var c = el('div', 'mg-chips');
        t.proposti.forEach(function (o) { c.appendChild(el('span', o === t.scelto ? 'scelto-dopo' : null, 'domani ' + (o.indexOf('–') >= 0 ? o : 'ore ' + o))); });
        b.appendChild(c);
      }
      var ch = el('div', 'mg-chiede'); ch.appendChild(el('span', null, 'La mando?')); ch.appendChild(el('i', 'si', 'Sì')); ch.appendChild(el('i', 'no', 'No'));
      b.appendChild(ch); b.appendChild(el('span', 'mg-fatto', '✓ Inviata dopo il tuo sì'));
      return b;
    } };
  }
  function cartaPersona(ti, t) {
    return { k: 'h' + ti, crea: function () {
      var c = el('div', 'mg-carta'); c.appendChild(el('b', null, 'Da gestire tu'));
      c.appendChild(el('p', null, 'Su questo Jarvis non risponde nel merito: va ' + a(t.persona.chi) + '.'));
      c.appendChild(el('small', null, 'Intanto Jarvis ' + t.persona.cosa));
      return c;
    } };
  }
  function cartaLista(t) {
    var b = el('div', 'mg-bozza');
    b.appendChild(el('span', 'mg-etb', "Jarvis · messaggio per la lista d'attesa"));
    b.appendChild(el('p', null, t.messaggioLista));
    var ch = el('div', 'mg-chiede'); ch.appendChild(el('span', null, 'Lo mando?')); ch.appendChild(el('i', 'si', 'Sì')); ch.appendChild(el('i', 'no', 'No'));
    b.appendChild(ch); b.appendChild(el('span', 'mg-fatto', "✓ Inviato dopo il tuo sì"));
    return b;
  }
  function cartaPromemoria(g) {
    var n = g.conti.promemoria, b = el('div', 'mg-bozza');
    b.appendChild(el('span', 'mg-etb', 'Jarvis · promemoria pronti'));
    b.appendChild(el('p', null, n + ' promemoria, uno per ogni ' + g.unita[0] + ' di domani.'));
    var ch = el('div', 'mg-chiede'); ch.appendChild(el('span', null, 'Li mando?')); ch.appendChild(el('i', 'si', 'Sì')); ch.appendChild(el('i', 'no', 'No'));
    b.appendChild(ch); b.appendChild(el('span', 'mg-fatto', '✓ ' + n + ' promemoria partiti dopo il tuo sì'));
    return b;
  }

  /* ---------- riconciliazione: niente ricostruzioni inutili, le animazioni partono solo per i pezzi nuovi ---------- */
  function riconcilia(box, specs, anima) {
    var vecchi = {};
    Array.prototype.forEach.call(box.children, function (n) { vecchi[n.getAttribute('data-k')] = n; });
    specs.forEach(function (s, i) {
      var n = vecchi[s.k];
      if (n) delete vecchi[s.k];
      else { n = s.crea(); n.setAttribute('data-k', s.k); if (anima && !ridotto) n.classList.add('entra'); }
      var statoPrima = n.getAttribute('data-stato') || '';
      if (s.stato != null) n.setAttribute('data-stato', s.stato); else if (s.k.indexOf('riga') === 0) n.setAttribute('data-stato', s.statoRiga || '');
      if (s.tocca && statoPrima && statoPrima !== s.stato && !ridotto) { n.classList.remove('tocca'); void n.offsetWidth; n.classList.add('tocca'); }
      if (!s.tocca) n.classList.remove('tocca');
      if (box.children[i] !== n) box.insertBefore(n, box.children[i] || null);
    });
    Object.keys(vecchi).forEach(function (k) { vecchi[k].remove(); });
  }

  function creaVista(v, g) {
    var n = el('div', 'mg-vista'); n.setAttribute('data-k', v.k);
    if (v.tipo === 'blocco' || v.tipo === 'riepilogo') {
      n.appendChild(el('div', 'mg-blocco-ora', v.ora)); n.appendChild(el('div', 'mg-blocco-data', v.data));
      if (v.tipo === 'riepilogo') {
        var c = g.conti, nu = el('div', 'mg-numeri');
        [[c.ricevuti, 'messaggi di clienti'], [c.scritti, 'messaggi scritti da Jarvis'], [c.tocchi, 'tocchi sul tuo «sì»'], [c.nuovi, (c.nuovi === 1 ? g.unita[0] : g.unita[1]) + ' nuovi in agenda'], [c.persona, (c.persona === 1 ? 'richiesta passata' : 'richieste passate') + ' a te']].forEach(function (x, i) {
          var d = el('div', i === 4 ? 'largo' : null); d.appendChild(el('b', null, String(x[0]))); d.appendChild(el('span', null, x[1])); nu.appendChild(d);
        });
        n.appendChild(nu);
        n.appendChild(el('p', 'mg-blocco-data', 'Giornata d\'esempio: numeri contati dal copione qui sopra.')).style.cssText = 'font-size:12px;margin:12px 0 0;text-transform:none';
      } else n.appendChild(el('div', 'mg-lista dall-alto'));
    } else if (v.tipo === 'chat') {
      var h = el('div', 'mg-testa'); h.appendChild(el('span', 'mg-avatar', v.cliente.charAt(0)));
      var w = el('div'); w.appendChild(el('b', null, v.cliente)); w.appendChild(el('small', null, 'cliente di fantasia · ' + g.m.attivita.replace(/^.*«|».*$/g, ''))); h.appendChild(w);
      n.appendChild(h); n.appendChild(el('div', 'mg-lista'));
    } else {
      var hh = el('div', 'mg-testa'), ww = el('div');
      ww.appendChild(el('span', 'mg-vtitolo', v.titolo)); ww.appendChild(el('small', null, v.data)); hh.appendChild(ww);
      n.appendChild(hh); n.appendChild(el('div', 'mg-lista dall-alto'));
    }
    return n;
  }

  var vistaAttuale = null, chiaveAttuale = '', bannerBox = null;
  function disegna(g, s) {
    oraTel.textContent = s.ora;
    var v = s.vista, k = g.k + ':' + v.k;
    if (k !== chiaveAttuale) {
      var nuova = creaVista(v, g), vecchia = vistaAttuale;
      if (vecchia) {
        if (ridotto || !vecchia.isConnected) vecchia.remove();
        else { vecchia.classList.remove('entra'); vecchia.classList.add('esce'); setTimeout(function () { vecchia.remove(); }, 320); }
      }
      if (vecchia && !ridotto) nuova.classList.add('entra');
      corpo.appendChild(nuova); vistaAttuale = nuova; chiaveAttuale = k;
    }
    vistaAttuale.setAttribute('data-fase', s.fase);
    var lista = vistaAttuale.querySelector('.mg-lista');
    if (lista) {
      var specs = (v.items || []).slice();
      if (v.righe) v.righe.forEach(function (r) {
        specs.push({ k: 'riga' + r.ora, statoRiga: r.stato, crea: function () {
          var d = el('div', 'mg-riga'); d.appendChild(el('span', 'mg-h', r.ora)); d.appendChild(el('b', null, r.stato === 'libero' ? 'Posto libero' : r.nome)); d.appendChild(el('small', null, r.servizio));
          return d;
        } });
      });
      // una riga che cambia persona si ridisegna: la chiave porta anche il nome
      specs.forEach(function (sp) { if (sp.statoRiga != null) { var r = v.righe.filter(function (x) { return 'riga' + x.ora === sp.k; })[0]; sp.k += '|' + (r.stato === 'libero' ? '-' : r.nome); } });
      if (v.extra) specs = specs.concat(v.extra);
      riconcilia(lista, specs, true);
    }
    // la notifica in alto
    if (!bannerBox) { bannerBox = el('div'); schermo.appendChild(bannerBox); }
    riconcilia(bannerBox, s.banner ? [{ k: g.k + s.banner.k, crea: function () {
      var b = el('div', 'mg-banner' + (s.banner.oro ? ' oro' : '')), h = el('span', 'mg-app'); h.appendChild(el('span', null, s.banner.oro ? 'Anteprima' : 'Messaggio')); h.appendChild(el('span', null, 'adesso'));
      b.appendChild(h); b.appendChild(el('b', null, s.banner.da)); b.appendChild(el('p', null, s.banner.testo));
      if (s.banner.oro) b.appendChild(el('small', null, 'Esempio: nessun messaggio vero è partito.'));
      return b;
    } }] : [], true);
  }

  /* ---------- didascalia e copione per chi usa il lettore di schermo ---------- */
  function fraseFase(g, t, f) {
    var c = t.cliente;
    var F = {
      blocco: 'Il tuo telefono, alle ' + t.ora + '.', n1: 'Jarvis ti dà il punto su domani.', n2: 'E ti dice come lavora: tu decidi, lui prepara.',
      arriva: c + ' scrive alle ' + t.ora + '.',
      bozza: t.tipo === 'lista' ? 'Risposta pronta per ' + c + '. La leggi tu.' : 'Jarvis prepara la risposta' + (t.proposti ? ' con gli orari liberi di domani' : '') + '. La leggi tu.',
      passata: 'Non risponde Jarvis nel merito: va ' + (t.persona ? a(t.persona.chi) : '') + '. Al cliente, solo un messaggio di cortesia.',
      inviata: t.tipo === 'persona' ? 'Cortesia partita col tuo sì. La richiesta resta in cima per te.' : 'Hai detto sì: la risposta parte.',
      ok: c + ' sceglie: domani ' + (t.scelto && t.scelto.indexOf('–') >= 0 ? 'fascia ' : 'alle ') + t.scelto + '.',
      agenda: 'Segnato in agenda, senza sovrapposizioni.',
      libera: 'Il posto ' + (t.libera && t.libera.indexOf('–') >= 0 ? 'della fascia ' : 'delle ') + t.libera + ' torna libero. Il messaggio per la lista d\'attesa è già pronto.',
      inviataLista: 'Lista d\'attesa avvisata col tuo sì.',
      riempito: t.subentra + ' prende il posto. L\'agenda è di nuovo piena.',
      pronti: g.conti.promemoria + ' promemoria pronti per domani.',
      partono: 'Hai detto sì: partono tutti insieme.',
      partiti: 'Ecco quello che riceve ' + g.prenota.cliente + '.',
      fine: 'Fine della giornata d\'esempio.', fine2: 'Fine della giornata d\'esempio.'
    };
    return F[f] || '';
  }

  function scriviCopione(g) {
    copione.textContent = '';
    g.tappe.forEach(function (t, i) {
      var li = el('li'), parti = [t.ora + '. ' + TG[t.tipo][0] + '.'];
      if (t.tipo === 'punto') parti.push('Jarvis al titolare: Buongiorno. Domani hai ' + agenda(g, 0, 0).length + ' ' + g.unita[1] + '. Ogni messaggio ai clienti parte solo con il tuo sì.');
      if (t.cliente && t.domanda) parti.push(t.cliente + ', cliente di fantasia, scrive: «' + t.domanda + '»');
      if (t.tipo === 'persona') parti.push('Jarvis non risponde nel merito: la richiesta va ' + a(t.persona.chi) + '. Intanto Jarvis ' + t.persona.cosa);
      if (t.risposta.length && t.tipo !== 'promemoria') parti.push('Risposta preparata da Jarvis: «' + t.risposta.join(' ') + (t.elenco ? ' ' + t.elenco.join('; ') + '.' : '') + '»' + (t.proposti ? ' Orari proposti per domani: ' + t.proposti.join(', ') + '.' : '') + ' Parte solo dopo il sì del titolare.');
      if (t.ok) parti.push(t.cliente + ' risponde: «' + t.ok + '» L\'appuntamento entra nell\'agenda di domani.');
      if (t.tipo === 'lista') parti.push('Il posto ' + alleOre(t.libera).replace(/^alle /, 'delle ').replace(/^nella fascia /, 'della fascia ') + ' si libera. Messaggio per la lista d\'attesa, mandato dopo il sì: «' + t.messaggioLista + '» ' + t.subentra + ' risponde: «' + t.okLista + '»');
      if (t.tipo === 'promemoria') parti.push(g.conti.promemoria + ' promemoria pronti per domani, partiti dopo il sì del titolare. Quello per ' + g.prenota.cliente + ': «' + t.anteprima + '»');
      if (t.tipo === 'riepilogo') parti.push(testoConti(g));
      li.textContent = parti.join(' ');
      copione.appendChild(li);
    });
  }
  function testoConti(g) {
    var c = g.conti;
    return 'Messaggi di clienti: ' + c.ricevuti + '. Messaggi scritti da Jarvis: ' + c.scritti + '. Tocchi sul tuo sì: ' + c.tocchi + '. Nuovi in agenda: ' + c.nuovi + '. Richieste passate a te: ' + c.persona + '.';
  }

  var minutiIpotesi = G.minutiMessaggio || 3;
  function extraRiepilogo(g) {
    var box = document.createDocumentFragment(), c = g.conti, dl = el('dl', 'mg-conti');
    [['Messaggi scritti da Jarvis al posto tuo', c.scritti], ['Messaggi di clienti gestiti', c.ricevuti], ['Tocchi sul tuo «sì»', c.tocchi]].forEach(function (x) { dl.appendChild(el('dt', null, x[0])); dl.appendChild(el('dd', null)).appendChild(el('b', null, String(x[1]))); });
    box.appendChild(dl);
    var lab = el('label', 'mg-cursore'), out = el('output');
    lab.appendChild(document.createTextNode('Ipotesi: minuti per scrivere un messaggio a mano: ')); lab.firstChild.after(out);
    var r = el('input'); r.type = 'range'; r.min = '1'; r.max = '10'; r.step = '1'; r.value = String(minutiIpotesi); lab.appendChild(r);
    var stima = el('p', 'mg-stima'); stima.setAttribute('aria-live', 'polite');
    function calcola() {
      minutiIpotesi = +r.value; out.textContent = r.value;
      var tot = c.scritti * minutiIpotesi;
      stima.textContent = '';
      stima.appendChild(document.createTextNode('Stima d\'esempio: ' + c.scritti + ' × ' + minutiIpotesi + ' min = '));
      stima.appendChild(el('b', null, (tot >= 60 ? Math.floor(tot / 60) + ' h ' + (tot % 60 ? (tot % 60) + ' min' : '') : tot + ' minuti').trim()));
      stima.appendChild(document.createTextNode(' di scrittura in una giornata come questa.'));
    }
    r.addEventListener('input', calcola); calcola();
    box.appendChild(lab); box.appendChild(stima);
    box.appendChild(el('p', 'mg-piccola', 'È una stima d\'esempio, non una misura: il conto vero dipende da quanti messaggi ricevi tu. E il tuo sì resta su ognuno.'));
    var cta = el('a', 'btn oro piccolo', 'Voglio una giornata così'); cta.href = '#scrivi';
    cta.setAttribute('data-tema', ('Giornata: ' + g.m.etichetta).slice(0, 110));
    box.appendChild(cta);
    return box;
  }

  /* ---------- scorrimento → tappa, fase e avanzamento continuo ---------- */
  var g = null, fasi = [], tot = 0, attuale = { ti: -1, fi: -1, k: '' }, P = 0;
  var PESO_FASE = 24;                                        // vh di scorrimento per fase
  function preparaFasi() {
    fasi = []; tot = 0;
    g.tappe.forEach(function (t, ti) { t.inizio = tot; t.fasi.forEach(function (f, fi) { fasi.push({ ti: ti, fi: fi }); tot++; }); });
    pista.style.height = 'calc(' + (tot * PESO_FASE) + 'vh + 100vh)';
    pista.style.height = 'calc(' + (tot * PESO_FASE) + 'svh + 100svh)';
  }
  function corsa() { return Math.max(1, pista.offsetHeight - palco.offsetHeight); }
  function inizioPista() { return pista.getBoundingClientRect().top + (window.scrollY || 0); }
  function leggiScroll() {
    var y = (window.scrollY || 0) - inizioPista();
    P = clamp(y / corsa(), 0, 1) * tot;                      // 0 … tot fasi
    var i = Math.min(tot - 1, Math.floor(P)), x = fasi[i];
    if (x.ti !== attuale.ti || x.fi !== attuale.fi || attuale.k !== g.k) aggiorna(x.ti, x.fi);
    aggiornaPunti();
    if (!treD) piatto(); else if (window.Telefono3D) window.Telefono3D.sveglia();
  }

  function aggiorna(ti, fi) {
    var nuovaTappa = ti !== attuale.ti || attuale.k !== g.k;
    attuale = { ti: ti, fi: fi, k: g.k };
    var t = g.tappe[ti];
    disegna(g, stato(g, ti, fi));
    cap.fase.textContent = fraseFase(g, t, t.fasi[fi]);
    if (nuovaTappa) {
      cap.num.textContent = 'Tappa ' + (ti + 1) + ' di ' + g.tappe.length;
      cap.ora.textContent = t.ora; cap.titolo.textContent = TG[t.tipo][0]; cap.testo.textContent = TG[t.tipo][1];
      cap.extra.textContent = '';
      palco.classList.toggle('mg-fine', t.tipo === 'riepilogo');
      if (t.tipo === 'riepilogo') cap.extra.appendChild(extraRiepilogo(g));
      prima.disabled = ti === 0; dopo.disabled = ti === g.tappe.length - 1;
      Array.prototype.forEach.call(punti.children, function (b, i) { if (i === ti) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      if (ti === daAnnunciare && voce && copione.children[ti]) { daAnnunciare = -1; voce.textContent = ''; var tx = copione.children[ti].textContent; setTimeout(function () { voce.textContent = 'Tappa ' + (ti + 1) + '. ' + tx; }, 60); }
    }
  }
  function aggiornaPunti() {
    Array.prototype.forEach.call(punti.children, function (b, i) {
      var t = g.tappe[i], r = clamp((P - t.inizio) / t.fasi.length, 0, 1);
      b.style.setProperty('--r', r.toFixed(3));
    });
  }
  function vaiATappa(i) {
    i = clamp(i, 0, g.tappe.length - 1); daAnnunciare = i;
    var t = g.tappe[i];
    // un poco dentro la prima fase con qualcosa da vedere
    var u = t.inizio + (t.fasi[0] === 'arriva' ? 0.5 : 0.2);
    scrollTo({ top: inizioPista() + u / tot * corsa() + 1, behavior: ridotto ? 'auto' : 'smooth' });
  }

  /* ---------- il movimento del telefono (3D o cornice CSS) ---------- */
  // rotazione guidata dallo scorrimento: ondeggia tra le tappe, torna di fronte alla fine
  function posa() {
    var x = P / Math.max(tot, 1), fine = clamp((P - (tot - 2)) / 2, 0, 1);
    return { ry: (Math.sin(x * Math.PI * 5) * 0.3 + 0.1) * (1 - fine), rx: (-0.05 + Math.cos(x * Math.PI * 4) * 0.05) * (1 - fine) };
  }
  function voli() {
    if (!fasi.length) return [];
    var i = Math.min(tot - 1, Math.floor(P)), x = fasi[i], f = g.tappe[x.ti].fasi[x.fi], u = clamp(P - i, 0, 1), dir = VOLI[f];
    if (!dir || x.ti === 0) return [];
    if (dir === 'tanti') { var n = g.conti.promemoria, l = []; for (var k = 0; k < n; k++) l.push({ dir: 'out', t: clamp(u * 1.4 - k * 0.08, 0, 1), i: k, n: n, oro: true }); return l; }
    return [{ dir: dir, t: clamp(u * 1.25, 0, 1), i: 0, n: 1 }];
  }
  var treD = false;
  function piatto() {
    if (!fasi.length) return;
    // trasformazione scritta direttamente: una variabile CSS si erediterebbe e farebbe ricalcolare tutto lo schermo
    var p = ridotto ? { ry: 0, rx: 0 } : posa();
    cornice.style.transform = 'translate(-50%,-50%) scale(' + scala + ')' + (ridotto ? '' : ' perspective(1400px) rotateY(' + (p.ry * 40).toFixed(2) + 'deg) rotateX(' + (p.rx * 40).toFixed(2) + 'deg)');
    riflesso.style.backgroundPosition = (p.ry * 120).toFixed(1) + 'px 0';
  }
  function adatta() {
    // la cornice CSS si ridimensiona sullo spazio libero; l'altezza della testata decide dove parte il palco
    var testata = document.getElementById('testata');
    // la pista prende tutta la larghezza: annulla il rientro vero della sezione (cambia con la misura dello schermo)
    var cs = getComputedStyle(sez);
    pista.style.marginLeft = '-' + cs.paddingLeft; pista.style.marginRight = '-' + cs.paddingRight;
    palco.style.setProperty('--mg-su', (testata ? testata.offsetHeight : 76) + 'px');
    var w = scena.clientWidth, h = scena.clientHeight;
    scala = Math.max(.3, Math.min((h - 24) / 718, (w - 8) / 346, 1.05)).toFixed(3);
    if (!treD) piatto();
  }

  // lo schermo HTML segue i quattro angoli del vetro proiettati dalla scena 3D
  function matrice(q) {
    var W = 320, H = 692;
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    var den = dx1 * dy2 - dx2 * dy1, gg = 0, hh = 0;
    if (Math.abs(den) > 1e-9) { gg = (dx3 * dy2 - dx2 * dy3) / den; hh = (dx1 * dy3 - dx3 * dy1) / den; }
    var A = x1 - x0 + gg * x1, B = x3 - x0 + hh * x3, C = x0, Dd = y1 - y0 + gg * y1, E = y3 - y0 + hh * y3, F = y0;
    A /= W; Dd /= W; gg /= W; B /= H; E /= H; hh /= H;
    return 'matrix3d(' + [A, Dd, 0, gg, B, E, 0, hh, 0, 0, 1, 0, C, F, 0, 1].map(function (v) { return +v.toFixed(6); }).join(',') + ')';
  }
  function suProiezione(q, ry) {
    if (!q) { cornice.classList.add('fuori'); return; }
    cornice.classList.remove('fuori');
    cornice.style.transform = matrice(q);
    riflesso.style.backgroundPosition = (ry * 120).toFixed(1) + 'px 0';
  }

  var caricato = false;
  function carica3D() {
    if (caricato) return; caricato = true;
    if (ridotto || /[?&]3d=0\b/.test(location.search) || !('noModule' in HTMLScriptElement.prototype)) return;
    var ok = false;
    try { var c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); ok = !!gl; if (gl) { var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) { ok = false; }
    if (!ok) return;
    window.addEventListener('telefono3d-pronto', function () {
      if (!window.Telefono3D) return;
      treD = true; sez.classList.add('con-telefono3d');
      window.Telefono3D.collega({ stato: function () { var p = posa(); return { ry: p.ry, rx: p.rx, voli: voli(), colore: colore }; }, proiezione: suProiezione });
    }, { once: true });
    window.addEventListener('telefono3d-perso', function () { treD = false; sez.classList.remove('con-telefono3d'); cornice.style.transform = ''; cornice.classList.remove('fuori'); adatta(); piatto(); });
    var s = document.createElement('script'); s.type = 'module'; s.src = 'js/giornata-3d.js';
    s.onerror = function () { /* resta la cornice CSS */ };
    document.head.appendChild(s);
  }

  /* ---------- scelta del mestiere ---------- */
  var colore = '#5ad7ff', chips = [];
  function imposta(k, daUtente) {
    if (!G.mestieri[k] || !D.mestieri[k]) return;
    if (g && g.k === k) return;
    var pr = profili()[D.mestieri[k].profilo] || {};
    colore = pr.colore || '#5ad7ff';
    sez.style.setProperty('--mc', colore);
    var restaP = g ? P : 0;
    g = risolvi(k);
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mestiere') === k ? 'true' : 'false'); });
    scegli.value = k;
    // la nuova giornata riparte dalla stessa tappa, non dall'inizio
    var tappaPrima = attuale.ti >= 0 ? attuale.ti : 0;
    preparaFasi();
    punti.textContent = '';
    g.tappe.forEach(function (t, i) {
      var b = el('button', 'mg-punto'); b.type = 'button';
      b.setAttribute('aria-label', 'Tappa ' + (i + 1) + ', ' + t.ora + ': ' + TG[t.tipo][0]);
      b.addEventListener('click', function () { vaiATappa(i); });
      punti.appendChild(b);
    });
    scriviCopione(g);
    copione.setAttribute('aria-label', 'La giornata di ' + g.m.attivita + ', attività di fantasia, tappa per tappa');
    attuale = { ti: -1, fi: -1, k: '' };
    if (daUtente && restaP > 0) vaiATappa(Math.min(tappaPrima, g.tappe.length - 1));
    leggiScroll();
  }

  (function costruisci() {
    G.ordine = D.ordine.filter(function (k) { return G.mestieri[k]; });
    G.ordine.forEach(function (k) {
      var m = D.mestieri[k], pr = profili()[m.profilo] || {};
      var b = el('button', 'mg-chip', m.etichetta); b.type = 'button';
      b.setAttribute('data-mestiere', k); b.setAttribute('aria-pressed', 'false'); if (pr.colore) b.style.setProperty('--c', pr.colore);
      b.addEventListener('click', function () {
        imposta(k, false);
        if (window.PrimaDopo) window.PrimaDopo.suggerisci(k);   // il confronto «prima e dopo» segue la scelta
        // dalla testata si entra nella giornata: inizio pista
        if (pista.getBoundingClientRect().top > 0) scrollTo({ top: inizioPista() + 2, behavior: ridotto ? 'auto' : 'smooth' });
      });
      boxChips.appendChild(b); chips.push(b);
      var o = el('option', null, m.etichetta); o.value = k; scegli.appendChild(o);
    });
    scegli.addEventListener('change', function () { imposta(scegli.value, true); if (window.PrimaDopo) window.PrimaDopo.suggerisci(scegli.value); });
    prima.addEventListener('click', function () { vaiATappa(attuale.ti - 1); });
    dopo.addEventListener('click', function () { vaiATappa(attuale.ti + 1); });
    notaTesta.textContent = G.nota;
    nota.textContent = G.nota;
    sez.classList.add('pronta');
  })();

  // il mestiere segue la demo o il profilo scelto più su, finché il visitatore non è dentro la giornata
  var PROFILO_MESTIERE = {};
  G.ordine.forEach(function (k) { var p = D.mestieri[k].profilo; if (p !== 'famiglia') PROFILO_MESTIERE[p] = k; });
  document.addEventListener('profilo-cambiato', function (e) {
    var k = e.detail && PROFILO_MESTIERE[e.detail.chiave];
    var dentro = pista.getBoundingClientRect().top < innerHeight && pista.getBoundingClientRect().bottom > 0;
    if (k && !dentro) imposta(k, false);
  });
  var iniziale = (window.Sito && window.Sito.profiloAttuale && PROFILO_MESTIERE[window.Sito.profiloAttuale()]) || G.ordine[0];
  imposta(iniziale, false);

  var inAttesa = false;
  addEventListener('scroll', function () { if (!inAttesa) { inAttesa = true; requestAnimationFrame(function () { inAttesa = false; leggiScroll(); }); } }, { passive: true });
  addEventListener('resize', function () { adatta(); leggiScroll(); });
  adatta(); leggiScroll();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (v) {
      if (v[0].isIntersecting) { io.disconnect(); if (window.requestIdleCallback) requestIdleCallback(carica3D, { timeout: 1200 }); else setTimeout(carica3D, 200); }
    }, { rootMargin: '900px 0px' });
    io.observe(sez);
  } else carica3D();

  window.GiornataMestiere = { imposta: function (k) { imposta(k, true); }, stato: function () { return { mestiere: g && g.k, tappa: attuale.ti, fase: attuale.fi, P: P, treD: treD }; } };
})();
