// «Il tuo piano Jarvis»: automazioni consigliate per i mestieri della demo, con i numeri di PARTENZA della stima.
// Solo dati: nessuna rete, nessun archivio nel browser. L'interfaccia è in js/piano-jarvis.js.
//
// Come si legge un'automazione
//   nome    titolo breve
//   jarvis  cosa prepara Jarvis
//   tuo     cosa resta al titolare (il sì, la decisione)
//   cosa    cosa si conta, al plurale («richieste di prenotazione»): si legge «N … a settimana»
//   volte   quante volte a settimana (ipotesi per un'attività tipo)
//   minuti  minuti risparmiati ogni volta, già tolto il tempo per rileggere e dire sì (ipotesi)
// I numeri NON sono misure né medie di clienti veri: sono ipotesi prudenti scritte a mano per un'attività tipo,
// e il visitatore li cambia con i suoi. Calcolo: volte × minuti ÷ 60 = ore a settimana; × settimane = ore all'anno.
window.PIANO_JARVIS = {
  settimane: 46,                                  // settimane di lavoro in un anno (modificabile)
  testi: {
    ipotesi: "I numeri di partenza sono ipotesi per un'attività tipo, scritte a mano: non sono misure né risultati di clienti. Cambiali con i tuoi.",
    formula: "Calcolo: volte a settimana × minuti risparmiati ogni volta ÷ 60 = ore a settimana. Ore a settimana × settimane di lavoro = ore all'anno.",
    netto: "I minuti sono già al netto del tempo che ti serve per rileggere e dire sì.",
    nonPromessa: "È una stima, non una promessa: il tempo vero dipende da come lavori tu. Il piano vero nasce dalla chiacchierata con Manuel.",
    locale: "La scheda nasce nel tuo browser: niente viene inviato né salvato."
  },
  mestieri: {
    barbiere: [
      { nome: "Prenotazioni da messaggi e chiamate", jarvis: "propone gli orari liberi e prepara la conferma per il cliente", tuo: "approvi la conferma con un tocco", cosa: "richieste di prenotazione", volte: 40, minuti: 3 },
      { nome: "Promemoria del giorno prima", jarvis: "prepara il promemoria per ogni cliente di domani", tuo: "dai l'ok e partono", cosa: "promemoria", volte: 50, minuti: 1 },
      { nome: "Disdette e lista d'attesa", jarvis: "libera il posto e prepara il messaggio per chi aspettava", tuo: "scegli a chi mandarlo", cosa: "disdette", volte: 4, minuti: 8 },
      { nome: "Domande su prezzi e orari", jarvis: "risponde dal tuo listino e dai tuoi orari, in bozza", tuo: "rileggi e mandi", cosa: "domande", volte: 25, minuti: 2 },
      { nome: "Risposte alle recensioni", jarvis: "prepara una risposta nel tuo stile, anche a quelle negative", tuo: "la pubblichi tu", cosa: "recensioni", volte: 3, minuti: 5 }
    ],
    ristorante: [
      { nome: "Prenotazioni dei tavoli", jarvis: "controlla i tavoli liberi e prepara la conferma", tuo: "approvi, o cambi tavolo", cosa: "prenotazioni", volte: 50, minuti: 2 },
      { nome: "Conferme e promemoria del giorno", jarvis: "prepara il messaggio della mattina per ogni tavolo", tuo: "dai l'ok e partono", cosa: "promemoria", volte: 40, minuti: 1 },
      { nome: "Domande su orari, menu e parcheggio", jarvis: "risponde con i tuoi orari e il menu del giorno, in bozza", tuo: "rileggi e mandi", cosa: "domande", volte: 30, minuti: 2 },
      { nome: "Gruppi ed eventi preparati", jarvis: "raccoglie data, persone e occasione in un foglio solo", tuo: "decidi menu, prezzo e caparra", cosa: "richieste di gruppi", volte: 3, minuti: 10 },
      { nome: "Menu del giorno sui social", jarvis: "prepara testo e post del menu del giorno", tuo: "approvi prima che esca", cosa: "post", volte: 5, minuti: 10 }
    ],
    bnb: [
      { nome: "Richieste di disponibilità", jarvis: "controlla le camere libere e prepara la risposta con le condizioni", tuo: "confermi tu prezzo e prenotazione", cosa: "richieste", volte: 20, minuti: 5 },
      { nome: "Indicazioni prima dell'arrivo", jarvis: "prepara il messaggio con strada, orari e documenti da portare", tuo: "dai l'ok e parte", cosa: "arrivi", volte: 8, minuti: 6 },
      { nome: "Domande su colazione, parcheggio e check-in", jarvis: "risponde con le informazioni della struttura, in bozza", tuo: "rileggi e mandi", cosa: "domande", volte: 15, minuti: 3 },
      { nome: "Risposte alle recensioni", jarvis: "prepara una risposta per ogni recensione", tuo: "la pubblichi tu", cosa: "recensioni", volte: 4, minuti: 6 },
      { nome: "Riepilogo arrivi e partenze", jarvis: "ogni mattina mette in fila chi arriva, chi parte e cosa preparare", tuo: "lo leggi col caffè", cosa: "riepiloghi", volte: 7, minuti: 5 }
    ],
    medico: [
      { nome: "Appuntamenti e spostamenti", jarvis: "propone gli orari liberi e prepara conferme e spostamenti", tuo: "la segreteria approva", cosa: "richieste d'agenda", volte: 60, minuti: 2 },
      { nome: "Promemoria con cosa portare", jarvis: "prepara il promemoria del giorno prima con documenti ed esami da portare", tuo: "dai l'ok e partono", cosa: "promemoria", volte: 60, minuti: 1 },
      { nome: "Domande pratiche", jarvis: "risponde su orari, documenti e modalità di pagamento, in bozza", tuo: "rileggi e mandi", cosa: "domande", volte: 30, minuti: 2 },
      { nome: "Richieste cliniche smistate", jarvis: "non risponde: mette in ordine le richieste su sintomi e farmaci e le passa al medico", tuo: "risponde sempre il medico", cosa: "richieste", volte: 15, minuti: 2 },
      { nome: "Posti liberati e lista d'attesa", jarvis: "prepara il messaggio per il primo paziente in attesa", tuo: "scegli a chi mandarlo", cosa: "disdette", volte: 5, minuti: 6 }
    ],
    avvocato: [
      { nome: "Primi colloqui da fissare", jarvis: "propone gli orari e prepara la conferma con costo e documenti", tuo: "approvi prima che parta", cosa: "richieste di colloquio", volte: 10, minuti: 6 },
      { nome: "Elenco documenti e promemoria", jarvis: "prepara il promemoria con le carte da portare", tuo: "dai l'ok e parte", cosa: "colloqui", volte: 10, minuti: 4 },
      { nome: "Posta in ordine", jarvis: "smista la posta del giorno e riassume le mail lunghe", tuo: "decidi cosa rispondere", cosa: "giornate di posta", volte: 5, minuti: 15 },
      { nome: "Scadenze segnate in agenda", jarvis: "dalla data scritta sull'atto prepara la scadenza in agenda, con avviso", tuo: "controlli la data, sempre", cosa: "atti", volte: 6, minuti: 5 },
      { nome: "«A che punto è la mia pratica?»", jarvis: "non risponde: prepara la richiesta per chi segue la pratica", tuo: "richiami tu il cliente", cosa: "richieste", volte: 8, minuti: 4 }
    ],
    idraulico: [
      { nome: "Chiamate e messaggi per gli interventi", jarvis: "raccoglie indirizzo, problema e foto e propone una fascia libera", tuo: "confermi l'intervento", cosa: "richieste", volte: 25, minuti: 4 },
      { nome: "Promemoria e «arrivo tra mezz'ora»", jarvis: "prepara il promemoria del giorno prima e il messaggio d'arrivo", tuo: "dai l'ok e partono", cosa: "messaggi", volte: 20, minuti: 2 },
      { nome: "Preventivi scritti dal sopralluogo", jarvis: "dalle tue note e dal tuo listino prepara il preventivo voce per voce", tuo: "lo controlli e lo mandi", cosa: "preventivi", volte: 4, minuti: 25 },
      { nome: "Domande su costi e zone", jarvis: "risponde con il tuo listino e la tua zona, in bozza", tuo: "rileggi e mandi", cosa: "domande", volte: 15, minuti: 2 },
      { nome: "Storico degli interventi", jarvis: "ritrova l'intervento precedente con data e pezzi usati", tuo: "lo hai davanti quando richiami", cosa: "ricerche", volte: 5, minuti: 8 }
    ],
    negozio: [
      { nome: "Domande su taglie, disponibilità e orari", jarvis: "controlla il magazzino e prepara la risposta", tuo: "rileggi e mandi", cosa: "domande", volte: 40, minuti: 2 },
      { nome: "Capi tenuti da parte", jarvis: "segna il capo, prepara il camerino e il promemoria per il cliente", tuo: "dai l'ok al messaggio", cosa: "capi", volte: 8, minuti: 4 },
      { nome: "Post dei nuovi arrivi", jarvis: "prepara testo e post dalle tue foto", tuo: "approvi prima che esca", cosa: "post", volte: 3, minuti: 20 },
      { nome: "Ordini ai fornitori", jarvis: "ti dice cosa sta finendo e prepara l'ordine", tuo: "lo confermi sempre tu", cosa: "ordini", volte: 2, minuti: 20 },
      { nome: "Cambi, resi e spedizioni", jarvis: "risponde con le tue regole di cambio e spedizione, in bozza", tuo: "decidi sui casi delicati", cosa: "richieste", volte: 10, minuti: 3 }
    ]
  }
};
