// La regia: ogni sezione ha la sua inquadratura; lo scorrimento passa dall'una all'altra senza stacchi.
// Il soggetto si aggancia al testo con le ancore (data-ancora): un elemento della pagina da occupare,
// oppure una posizione dello schermo, sempre dal lato opposto alla colonna di testo.
import { QUOTA } from './plancia.js';

const GIU = QUOTA + 4;                     // dove scende il nucleo nell'atto della plancia

// az/el in radianti intorno al bersaglio; nx/ny = dove finisce il bersaglio sullo schermo (-1..1)
// rw/fr = il nucleo occupa l'elemento: raggio nel mondo rw su una frazione fr del mezzo lato dell'elemento
// m = correzioni per schermi stretti (telefono), dove il testo prende tutta la larghezza
const SCENE = {
  apertura: { az: -.32, el: .16, rw: 1.75, fr: .95, nuc: 1, guscio: .9, gal: .3, cielo: .7, luce: 1 },
  // il tuffo: la camera entra nel plasma
  'soglia-nucleo': { az: .12, el: .08, dist: .55, nuc: 1, guscio: .2, gal: .1, cielo: .2, luce: .85 },
  trasforma: { az: .22, el: .06, rw: 1.85, fr: .92, nuc: .26, morph: 1, guscio: 1, gal: .26, cielo: .6, luce: 1 },
  giornata: { az: 0, el: .03, dist: 13, ny: .6, nuc: .55, guscio: .35, filo: 1, gal: .28, cielo: .6, luce: .85, m: { ny: .72 } },
  squadra: { az: .75, el: .32, rw: 1, fr: 1, nuc: 1, guscio: .35, anelli: 1, gal: .3, cielo: .6, luce: 1 },
  poteri: { az: 1.97, el: .38, dist: 9.5, nx: .52, ny: .1, nuc: .8, guscio: .3, anelli: 1, gal: .4, cielo: .6, luce: .55, m: { nx: 0, ny: .62, luce: .4 } },
  // si esce indietro e si scopre che il nucleo è il cuore di una galassia
  'soglia-galassia': { az: 2.1, el: .88, dist: 40, ny: .34, nuc: 1, guscio: .25, anelli: .25, gal: 1, cielo: 1, luce: 1, m: { dist: 54, ny: .42 } },
  servizi: { az: 2.25, el: .62, dist: 50, nx: .34, ny: 0, nuc: 1, guscio: .2, anelli: .2, gal: 1, cielo: .9, luce: .78, m: { nx: 0, ny: .2, luce: .55 } },
  esempi: { az: 2.75, el: .95, dist: 62, nx: 0, ny: .12, nuc: 1, guscio: .2, gal: 1, cielo: 1, luce: .72, m: { luce: .55 } },
  ascolta: { az: 3.25, el: .3, dist: 42, nx: .36, ny: -.05, nuc: 1, guscio: .3, gal: 1, cielo: 1, luce: .9, m: { nx: 0, ny: .5, luce: .6 } },
  // sul computer il nucleo lontano finiva dietro la frase della colonna di testo: qui resta piccolo
  tasca: { braccio: [20, 0], az: 4.15, el: .14, dist: 10, nx: -.38, ny: 0, nuc: .3, gal: 1, cielo: 1, luce: .82, m: { nx: 0, ny: .45, luce: .55, nuc: 1 } },
  percorso: { braccio: [27, 1], az: 4.6, el: .07, dist: 7.5, nx: 0, ny: -.25, nuc: 1, gal: 1, cielo: 1, luce: .7, m: { ny: .3, luce: .5 } },
  // si scende sotto il piano della galassia: il nucleo la lascia e arriva sulla plancia
  'soglia-plancia': { giu: .55, az: 5.3, el: -.1, dist: 27, ny: .2, nuc: 1, guscio: .25, griglia: .9, gal: 1, cielo: .8, luce: 1, m: { dist: 34 } },
  dati: { giu: 1, az: 5.98, el: .2, rw: 2.6, fr: .95, nuc: .8, guscio: .3, scudo: 1, griglia: 1, gal: .55, cielo: .5, luce: 1 },
  dietro: { giu: 1, az: 5.66, el: .1, dist: 22, nx: -.62, ny: .55, nuc: .9, guscio: .3, griglia: 1, gal: .45, cielo: .5, luce: .55, m: { nx: .55, ny: .72, luce: .4 } },
  domande: { giu: 1, az: 5.33, el: .12, dist: 13, nx: .62, ny: 0, nuc: .85, guscio: .3, griglia: 1, gal: .4, cielo: .5, luce: .6, m: { nx: .5, ny: .72, luce: .4 } },
  scrivi: { giu: 1, az: 5.08, el: .08, dist: 11, nx: -.55, ny: -.45, nuc: 1, guscio: .45, griglia: 1, gal: .4, cielo: .5, luce: .85, m: { nx: 0, ny: .76, luce: .4 } }
};
const CAMPI = ['az', 'el', 'ldist', 'tx', 'ty', 'tz', 'nx', 'ny', 'nuc', 'morph', 'guscio', 'anelli', 'filo', 'gal', 'cielo', 'griglia', 'scudo', 'luce', 'giu'];
const PREDEF = { nx: 0, ny: 0, nuc: 1, morph: 0, guscio: 0, anelli: 0, filo: 0, gal: .4, cielo: .6, griglia: 0, scudo: 0, luce: 1, giu: 0 };

export function nuovoStato() { const s = {}; CAMPI.forEach(k => { s[k] = 0; }); return s; }
export { CAMPI };

export function creaRegia() {
  let tappe = [];                        // { id, el, scena, ancora, punto }
  const mezzo = (a, b, t) => a + (b - a) * t;
  const liscio = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function misura() {
    const H = innerHeight, max = document.documentElement.scrollHeight - H;
    tappe = [];
    document.querySelectorAll('main > section[id]').forEach(sez => {
      const sc = SCENE[sez.id]; if (!sc) return;
      const top = sez.getBoundingClientRect().top + scrollY;
      let punto = top + sez.offsetHeight / 2 - H / 2;
      if (sez.offsetHeight > H * 1.4 && !sez.classList.contains('soglia')) punto = top + H * .35;   // sezioni lunghissime: si arriva presto
      const ancora = sez.getAttribute('data-ancora');
      tappe.push({ id: sez.id, sez, scena: sc, ancora, el: ancora && ancora !== 'linea' ? sez.querySelector(ancora) : null, punto: Math.max(0, Math.min(max, punto)) });
    });
    if (tappe.length) tappe[0].punto = 0;
    for (let i = 1; i < tappe.length; i++) if (tappe[i].punto <= tappe[i - 1].punto) tappe[i].punto = tappe[i - 1].punto + 1;
  }

  // inquadratura di una tappa, calcolata adesso (le ancore seguono lo scorrimento)
  function valutaTappa(tp, W, H, fov, t, stretto, out) {
    const sc = Object.assign({}, PREDEF, tp.scena, stretto && tp.scena.m ? tp.scena.m : null);
    CAMPI.forEach(k => { if (sc[k] != null) out[k] = sc[k]; });
    out.ty = sc.giu * GIU; out.tx = 0; out.tz = 0;
    if (sc.braccio) {                                                // il bersaglio segue il braccio che gira
      const [r, b] = sc.braccio, a = b / 4 * Math.PI * 2 + r * .21 + t * .018;
      out.tx = Math.cos(a) * r; out.tz = Math.sin(a) * r; out.ty = 0;
    }
    let dist = sc.dist || 8;
    const tg = Math.tan(fov * Math.PI / 360);
    if (tp.el) {
      const r = tp.el.getBoundingClientRect();
      if (r.width > 0) {
        out.nx = ((r.left + r.width / 2) / W) * 2 - 1;
        out.ny = 1 - ((r.top + r.height / 2) / H) * 2;
        const rpx = Math.min(r.width, r.height) / 2 * (sc.fr || 1);
        dist = (sc.rw || 1) * (H / 2) / (Math.max(rpx, 20) * tg);
      }
    } else if (tp.ancora === 'linea') {                              // il filo cade lungo la linea della giornata
      const l = tp.sez.querySelector('.linea');
      if (l) { const r = l.getBoundingClientRect(); out.nx = ((r.left + (stretto ? 5 + (W <= 600 ? 22 : 0) : r.width / 2)) / W) * 2 - 1; }
    }
    out.ldist = Math.log(Math.min(95, Math.max(.5, dist)));
    return out;
  }

  const A = nuovoStato(), B = nuovoStato();
  function valuta(y, W, H, fov, t, stretto, out, discreto) {
    if (!tappe.length) return { indice: 0, id: '' };
    let i = 0;
    while (i < tappe.length - 1 && y >= tappe[i + 1].punto) i++;
    const a = tappe[i], b = tappe[Math.min(i + 1, tappe.length - 1)];
    const tt = b === a ? 0 : (y - a.punto) / (b.punto - a.punto);
    let e = liscio(.12, .88, tt);
    if (discreto) e = e < .5 ? 0 : 1;
    valutaTappa(a, W, H, fov, t, stretto, A);
    valutaTappa(b, W, H, fov, t, stretto, B);
    CAMPI.forEach(k => { out[k] = mezzo(A[k], B[k], e); });
    const att = e < .5 ? a : b;
    return { indice: e < .5 ? i : i + 1, id: att.id, filo: att.id === 'giornata' || a.id === 'giornata' };
  }

  return { misura, valuta, tappe: () => tappe };
}
