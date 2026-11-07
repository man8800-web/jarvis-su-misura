// Mini piano «in dieci secondi»: dal mestiere scritto dall'utente propone tre primi passi.
// Tutto in locale, nessun invio. È un esempio indicativo, non un preventivo né una promessa.
(function () {
  'use strict';
  var form = document.getElementById('piano-form'), out = document.getElementById('piano-esito'), inp = document.getElementById('mestiere');
  var ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // parola chiave -> profilo (le chiavi stanno in js/profili.js)
  var REGOLE = [
    ['legale', /avvocat|legale|notai|praticante|diritto/],
    ['ristorante', /ristor|\bbar\b|pizz|trattor|osteri|\bpub\b|caff|pasticc|gelat|panific|forno|locanda|agriturism|catering/],
    ['barbiere', /parrucc|barbier|estetist|\bnail|unghie|massagg|tatuat|centro estetic|benessere|\bspa\b/],
    ['negozio', /negozi|boutique|abbigliament|commerc(?!ialist)|e-?commerce|vendit|\bshop\b|fior|libreri|aliment|ferramenta|gioiell|calzatur|cartoler|erboris|bottega/],
    ['artigiano', /idraulic|elettricist|muratore|edil|imbianch|falegnam|fabbro|artigian|giardinier|meccanic|carrozz|serrament|installat|impresa|cantier|piastrell|termoidraulic|riparat/],
    ['studio', /commercialist|geometra|architett|ingegner|medic|dentist|psicolog|fisioterap|consulent|studio|agente|veterinar|ottic|contabil|perit|formator|fotograf/],
    ['famiglia', /genitor|famigli|mamma|pap[aà]|casaling|pensionat|privato|studente|nonn[oa]/]
  ];
  var ORDINE = ['Si parte da qui', 'Poi si aggiunge', 'Infine'];

  function trova(testo) {
    var t = testo.toLowerCase();
    for (var i = 0; i < REGOLE.length; i++) if (REGOLE[i][1].test(t)) return REGOLE[i][0];
    return 'tutti';
  }
  // i primi tre ruoli del profilo, senza il Revisore (stessa scelta del mini piano)
  function primiPassi(chiave) {
    var P = window.PROFILI || {}, prof = P[chiave] || P.tutti;
    return prof ? prof.squadra.filter(function (m) { return m[0] !== 'Revisore'; }).slice(0, 3) : [];
  }
  // le stesse regole servono a Jarvis vivo (js/vivo.js)
  window.Piano = { trova: trova, primiPassi: primiPassi, ORDINE: ORDINE };
  if (!form || !out) return;

  function el(tag, cls, testo) { var e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; }

  function mostra(mestiere) {
    var P = window.PROFILI || {}, chiave = trova(mestiere), prof = P[chiave] || P.tutti;
    var generico = chiave === 'tutti';
    out.textContent = '';
    out.appendChild(el('p', 'titolo-piano', 'Primi passi per: ' + mestiere));
    var ol = el('ol');
    // il Revisore è sempre l'ultimo ruolo: i primi tre sono quelli che alleggeriscono la giornata
    var ruoli = primiPassi(chiave);
    ruoli.forEach(function (m, i) {
      var li = el('li'); li.appendChild(el('b', null, ORDINE[i] + ': ' + m[0]));
      li.appendChild(el('span', null, m[2])); ol.appendChild(li);
    });
    out.appendChild(ol);
    var nota = generico
      ? 'Non conosco ancora il tuo mestiere: ti ho mostrato i primi passi più comuni. Il piano vero nasce dalla chiacchierata.'
      : 'Esempio indicativo costruito sul profilo «' + prof.nome + '». Il piano vero nasce dalla chiacchierata con Manuel, e niente parte senza il tuo sì.';
    out.appendChild(el('p', 'nota', nota));
    var az = el('div', 'azioni-pan');
    var a = el('a', 'btn oro piccolo', 'Parliamone'); a.href = '#scrivi';
    // argomento fisso: il testo scritto qui non parte mai di nascosto col modulo
    a.setAttribute('data-tema', generico ? 'Un piano su misura' : 'Un piano per: ' + prof.nome);
    a.addEventListener('click', function () { if (window.Pannelli) window.Pannelli.chiudiTutti(); });
    az.appendChild(a);
    var b = el('button', 'btn vuoto piccolo', 'Vedi la sua giornata'); b.type = 'button';
    b.addEventListener('click', function () {
      if (window.Sito) window.Sito.scegliProfilo(chiave, false);
      if (window.Pannelli) window.Pannelli.chiudiTutti();
      var g = document.getElementById('giornata'); if (g) g.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth' });
    });
    az.appendChild(b);
    out.appendChild(az);
    if (!generico && window.Sito) window.Sito.scegliProfilo(chiave, false);
  }

  var attesa = null;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = (inp.value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (m.length < 2) { out.textContent = ''; out.appendChild(el('p', 'nota', 'Scrivi il tuo lavoro in poche parole, per esempio «idraulico» o «negozio di scarpe».')); inp.focus(); return; }
    clearTimeout(attesa);
    out.textContent = '';
    var c = el('div', 'calcolo'); c.appendChild(el('i')); c.appendChild(document.createTextNode('Jarvis ci pensa…'));
    out.appendChild(c);
    attesa = setTimeout(function () { mostra(m); }, ridotto ? 0 : 1100);
  });
})();
