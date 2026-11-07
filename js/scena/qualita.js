// Qualità automatica: quattro livelli scelti all'avvio dal dispositivo, poi corretti dai fotogrammi veri.
// Scende se la media supera 22 ms per due finestre di 2 s di fila (45 ms per passare da «basso» a «statico»):
// un solo tratto di volo pesante non deve costare un livello per sempre;
// sale (una volta sola) se resta sotto 12 ms per 6 s.

// px = densità massima, mpx = tetto di milioni di pixel disegnati (uno schermo Retina grande ne chiederebbe più di 5)
export const LIVELLI = {
  alto:    { nome: 'alto',    px: 2,   mpx: 2.6, passi: 6, post: true,  torri: 220, stelle: 30000, guscio: 2600, cielo: 3000 },
  medio:   { nome: 'medio',   px: 1.5, mpx: 1.5, passi: 4, post: true,  torri: 130, stelle: 14000, guscio: 1600, cielo: 1800 },
  basso:   { nome: 'basso',   px: 1,   mpx: .9,  passi: 3,  post: false, torri: 50,  stelle: 6000,  guscio: 900,  cielo: 1000 },
  statico: { nome: 'statico', px: 1,   mpx: 1.2, passi: 4, post: false, torri: 50,  stelle: 6000,  guscio: 900,  cielo: 1000 }
};
const ORDINE = ['statico', 'basso', 'medio', 'alto'];

export function livelloIniziale() {
  const n = navigator, w = Math.min(innerWidth, screen.width || innerWidth);
  const mem = n.deviceMemory || 4, core = n.hardwareConcurrency || 4;
  const risparmio = n.connection && n.connection.saveData;
  if (risparmio || mem <= 2 || core <= 2) return 'basso';
  if (w < 768 || mem < 4 || core < 6) return 'medio';
  return 'alto';
}

export function creaMisuratore(iniziale, cambia, fisso) {
  let livello = iniziale, salito = false, acc = 0, n = 0, finestra = 0, buoni = 0, cattive = 0;
  return {
    get livello() { return livello; },
    forza(l) { livello = l; },
    // dt in millisecondi tra due fotogrammi visibili
    misura(dt) {
      if (fisso || dt > 250 || livello === 'statico') return;          // scheda nascosta o fermo: non conta
      acc += dt; n++; finestra += dt;
      if (finestra >= 2000) {
        const media = acc / n;
        const i = ORDINE.indexOf(livello);
        // fermare la scena è l'ultima spiaggia: da «basso» si scende solo sotto i 22 fotogrammi al secondo,
        // non per gli scatti dello scorrimento (che non dipendono dal 3D)
        if (media > (ORDINE[i] === 'basso' ? 45 : 22) && i > 0) {
          buoni = 0;
          if (++cattive >= 2) { cattive = 0; livello = ORDINE[i - 1]; cambia(livello, media); }
        } else if (media < 12) {
          cattive = 0;
          buoni += finestra;
          if (buoni >= 6000 && !salito && i < ORDINE.length - 1) { salito = true; livello = ORDINE[i + 1]; buoni = 0; cambia(livello, media); }
        } else { buoni = 0; cattive = 0; }
        acc = 0; n = 0; finestra = 0;
      }
    }
  };
}
