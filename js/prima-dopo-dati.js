// «Prima e dopo»: la stessa giornata d'esempio del titolare, senza Jarvis (a sinistra) e con Jarvis (a destra).
// Solo dati: nessuna rete, nessun archivio nel browser. L'interfaccia è in js/prima-dopo.js.
// Mestieri e attività sono quelli della demo (demo-dati.js): nomi, clienti, orari e numeri sono INVENTATI
// per una giornata tipo e la pagina lo dice sempre. Non sono misure né promesse.
//
// Un mestiere
//   ora      l'ora del confronto (lo stesso momento della stessa giornata)
//   agenda   titolo del riquadro agenda
//   senza / con, ognuno con:
//     tel    [numero o null, titolo, descrizione]     il telefono
//     posta  [numero o null, titolo, descrizione]     messaggi e mail
//     slot   [[ora, testo, stato], …]                  stato: pieno | buco | doppio | jarvis | tuo
//     sera   la riga di fine giornata
// Regole fisse: Jarvis non risponde alle chiamate al posto del titolare; ogni messaggio al cliente parte
// solo dopo il suo sì; salute, pareri legali, soldi e reclami restano a una persona.
window.PRIMA_DOPO = {
  testi: {
    senza: "Senza Jarvis",
    con: "Con Jarvis",
    esempio: "Esempio: una giornata tipo inventata, con attività, clienti e numeri di fantasia. Non è una misura né una promessa: serve a vedere la differenza.",
    regola: "Nel Jarvis vero ogni messaggio al cliente parte solo dopo il tuo sì, e le chiamate restano a te.",
    aiuto: "Trascina la barra col dito o col mouse. Da tastiera: frecce sinistra e destra.",
    stati: { pieno: "", buco: "Buco", doppio: "Sovrapposto", jarvis: "Col tuo ok", tuo: "Resta a te" }
  },
  mestieri: {
    barbiere: {
      ora: "18:40", agenda: "Agenda di oggi",
      senza: {
        tel: [6, "chiamate perse", "Squilla mentre hai le forbici in mano. Richiami la sera, se ti ricordi chi era."],
        posta: [14, "messaggi da leggere", "WhatsApp, Instagram e mail insieme. La richiesta più vecchia aspetta da ieri."],
        slot: [["9:00", "Luca · taglio", "pieno"], ["10:00", "Disdetta alle 8:40, nessuno avvisato", "buco"], ["11:00", "Paolo e Gianni, tutti e due convinti delle 11", "doppio"],
               ["15:00", "Marta · colore e piega", "pieno"], ["16:30", "Non si è presentato: nessun promemoria", "buco"], ["17:30", "Enzo · barba", "pieno"]],
        sera: "Alle 21 rispondi ai messaggi dal divano."
      },
      con: {
        tel: [null, "Il telefono resta tuo", "Jarvis non risponde alle chiamate. Ma chi scrive trova subito gli orari liberi, in una risposta che approvi con un tocco."],
        posta: [0, "arretrati", "11 risposte pronte e partite col tuo sì. Ne restano 3 a te: un reclamo e due richieste particolari."],
        slot: [["9:00", "Luca · taglio", "pieno"], ["10:00", "Sara, dalla lista d'attesa", "jarvis"], ["11:00", "Paolo · taglio (Gianni spostato alle 12)", "jarvis"],
               ["15:00", "Marta · colore e piega", "pieno"], ["16:30", "Davide · promemoria di ieri, confermato", "jarvis"], ["17:30", "Enzo · barba", "pieno"]],
        sera: "Alle 19 i promemoria di domani sono pronti: partono col tuo ok."
      }
    },
    ristorante: {
      ora: "19:15", agenda: "Tavoli di stasera",
      senza: {
        tel: [9, "chiamate durante il servizio", "Rispondi con le mani occupate, prendi la prenotazione su un foglietto, la cucina aspetta."],
        posta: [17, "messaggi da leggere", "Prenotazioni su WhatsApp, Instagram e mail. Una disdetta è lì da stamattina."],
        slot: [["19:30", "Tavolo 2 · Rossi, 4 persone", "pieno"], ["20:00", "Tavolo 5 vuoto: disdetta letta alle 21", "buco"], ["20:30", "Tavolo 3 promesso a due famiglie", "doppio"],
               ["20:30", "Tavolo 6 · Bianchi, 2 persone", "pieno"], ["21:00", "Allergia detta al telefono, non segnata", "buco"], ["21:30", "Tavolo 1 · compleanno, 8 persone", "pieno"]],
        sera: "A mezzanotte rispondi alle prenotazioni di domani."
      },
      con: {
        tel: [null, "Il telefono resta tuo", "Jarvis non risponde alle chiamate. Chi scrive per prenotare riceve i tavoli liberi davvero, in una risposta che approvi con un tocco."],
        posta: [0, "arretrati", "13 prenotazioni confermate col tuo sì. Restano a te un reclamo e una cena aziendale da preventivare."],
        slot: [["19:30", "Tavolo 2 · Rossi, 4 persone", "pieno"], ["20:00", "Tavolo 5 · Neri, dalla lista d'attesa", "jarvis"], ["20:30", "Tavolo 3 · Verdi (seconda famiglia al 4)", "jarvis"],
               ["20:30", "Tavolo 6 · Bianchi, 2 persone", "pieno"], ["21:00", "Allergia segnata per la cucina, da ricontrollare", "tuo"], ["21:30", "Tavolo 1 · compleanno, 8 persone", "pieno"]],
        sera: "A fine servizio le conferme di domani sono pronte: partono col tuo ok."
      }
    },
    bnb: {
      ora: "17:30", agenda: "Camere e arrivi di oggi",
      senza: {
        tel: [5, "chiamate perse", "Ospiti che chiedono il parcheggio mentre rifai una camera. Richiami in strada."],
        posta: [21, "messaggi da leggere", "Domande sugli orari, sulla colazione, sul parcheggio. Una richiesta di tre giorni fa è ancora senza risposta."],
        slot: [["Camera 1", "Famiglia Conti · arrivo alle 15", "pieno"], ["Camera 2", "Arrivo alle 23: nessuno sa ancora l'orario", "buco"], ["Camera 3", "Libera: la richiesta per stanotte è rimasta in posta", "buco"],
               ["Camera 4", "Due ospiti con la stessa data, dopo una modifica", "doppio"], ["Colazione", "Intolleranza scritta in una mail, non segnata", "buco"], ["Partenze", "Camera 1 domattina alle 10", "pieno"]],
        sera: "Alle 23 aspetti in piedi l'ospite di cui non sai l'orario."
      },
      con: {
        tel: [null, "Il telefono resta tuo", "Jarvis non risponde alle chiamate. Le domande scritte, invece, ricevono subito la risposta pronta dalle tue regole di casa."],
        posta: [0, "arretrati", "18 risposte partite col tuo sì. Restano a te una richiesta di rimborso e un gruppo da gestire."],
        slot: [["Camera 1", "Famiglia Conti · arrivo alle 15", "pieno"], ["Camera 2", "Arrivo alle 23, istruzioni mandate col tuo ok", "jarvis"], ["Camera 3", "Coppia da Lione, risposta partita in mattinata", "jarvis"],
               ["Camera 4", "Doppia data vista e segnalata: decidi tu", "tuo"], ["Colazione", "Intolleranza segnata, da confermare con l'ospite", "tuo"], ["Partenze", "Camera 1 domattina alle 10", "pieno"]],
        sera: "Alle 20 le istruzioni d'arrivo di domani sono pronte: partono col tuo ok."
      }
    },
    medico: {
      ora: "18:00", agenda: "Agenda di oggi",
      senza: {
        tel: [12, "chiamate in segreteria", "La linea è occupata, i pazienti richiamano, la segreteria rincorre il telefono tra un paziente e l'altro."],
        posta: [19, "messaggi da leggere", "Spostamenti, documenti da portare, richieste per la dottoressa: tutto nello stesso mucchio."],
        slot: [["9:00", "Igiene · Ferri", "pieno"], ["10:00", "Non si è presentato: nessun promemoria", "buco"], ["11:30", "Due prime visite sullo stesso orario", "doppio"],
               ["14:30", "Controllo · Galli", "pieno"], ["16:00", "Disdetta di ieri, posto rimasto vuoto", "buco"], ["17:00", "Messaggio sul dolore letto a fine giornata", "buco"]],
        sera: "La sera la segreteria richiama chi non ha trovato la linea."
      },
      con: {
        tel: [null, "Il telefono resta alla segreteria", "Jarvis non risponde alle chiamate. Le richieste scritte di orari e spostamenti trovano la risposta pronta, da approvare."],
        posta: [0, "arretrati", "14 risposte pratiche partite dopo l'ok della segreteria. Ogni domanda clinica è passata alla dottoressa: Jarvis non risponde nel merito."],
        slot: [["9:00", "Igiene · Ferri", "pieno"], ["10:00", "Rinaldi, promemoria confermato ieri", "jarvis"], ["11:30", "Prima visita · Moro (Costa spostata alle 12:30)", "jarvis"],
               ["14:30", "Controllo · Galli", "pieno"], ["16:00", "Posto riassegnato dalla lista d'attesa", "jarvis"], ["17:00", "Messaggio sul dolore: in cima, per la dottoressa", "tuo"]],
        sera: "I promemoria di domani sono pronti: partono con l'ok della segreteria."
      }
    },
    avvocato: {
      ora: "18:30", agenda: "Colloqui di oggi",
      senza: {
        tel: [8, "chiamate da richiamare", "«A che punto è la mia pratica?» arriva mentre scrivi un atto. Ogni chiamata ti fa perdere il filo."],
        posta: [26, "mail da leggere", "Clienti, colleghi, cancellerie, pubblicità: le cose importanti sono sepolte tra le altre."],
        slot: [["9:30", "Giorgio · colloquio", "pieno"], ["11:00", "Primo colloquio saltato: documenti mai chiesti", "buco"], ["12:00", "Due clienti allo stesso orario", "doppio"],
               ["15:00", "Elena · videochiamata", "pieno"], ["16:30", "Libero: la richiesta è rimasta in posta", "buco"], ["18:00", "Anna · primo colloquio", "pieno"]],
        sera: "Alle 22 rispondi alle mail della giornata."
      },
      con: {
        tel: [null, "Il telefono resta tuo", "Jarvis non risponde alle chiamate e non dà pareri. Le richieste scritte di appuntamenti trovano la risposta pratica pronta."],
        posta: [3, "mail che spettano a te", "Le altre sono in ordine, con le risposte di routine partite col tuo sì. Le scadenze le controlli tu, sempre."],
        slot: [["9:30", "Giorgio · colloquio", "pieno"], ["11:00", "Primo colloquio, elenco documenti mandato col tuo ok", "jarvis"], ["12:00", "Rizzi (Longo spostato alle 14)", "jarvis"],
               ["15:00", "Elena · videochiamata", "pieno"], ["16:30", "Bassi, primo colloquio fissato col tuo sì", "jarvis"], ["18:00", "Anna · primo colloquio", "pieno"]],
        sera: "Alle 19 il riassunto della posta di domani è pronto da leggere."
      }
    },
    idraulico: {
      ora: "18:15", agenda: "Interventi di oggi",
      senza: {
        tel: [11, "chiamate mentre lavori", "Sotto un lavandino non rispondi. Richiami in furgone, chiedi l'indirizzo due volte."],
        posta: [15, "messaggi da leggere", "Foto del guasto, richieste di preventivo, «quando passa?». Tutto letto la sera."],
        slot: [["8:30", "Caldaia · Via Roma", "pieno"], ["10:00", "Mattina vuota: la richiesta l'hai letta tardi", "buco"], ["11:30", "Due clienti promessi alla stessa ora", "doppio"],
               ["14:00", "Perdita · Via dei Mille", "pieno"], ["15:30", "Arrivato senza il pezzo: mancava la foto", "buco"], ["17:00", "Scaldabagno · condominio Sole", "pieno"]],
        sera: "Alle 21 scrivi i preventivi al tavolo della cucina."
      },
      con: {
        tel: [null, "Il telefono resta tuo", "Jarvis non risponde alle chiamate. Chi scrive riceve la richiesta di indirizzo, problema e foto, e una fascia libera da confermare."],
        posta: [0, "arretrati", "12 risposte partite col tuo sì, 3 preventivi in bozza da rivedere. Il prezzo lo decidi tu."],
        slot: [["8:30", "Caldaia · Via Roma", "pieno"], ["10:00", "Rubinetto · Via Verdi, confermato col tuo ok", "jarvis"], ["11:30", "Tetti (Martini spostato alle 12:30)", "jarvis"],
               ["14:00", "Perdita · Via dei Mille", "pieno"], ["15:30", "Valvola, con foto e misura già raccolte", "jarvis"], ["17:00", "Scaldabagno · condominio Sole", "pieno"]],
        sera: "Alle 19 i preventivi in bozza aspettano solo i tuoi prezzi."
      }
    },
    negozio: {
      ora: "19:00", agenda: "Ritiri e appuntamenti di oggi",
      senza: {
        tel: [7, "chiamate al banco", "«Avete la taglia M?» mentre servi un cliente. Lui aspetta, l'altro pure."],
        posta: [23, "messaggi da leggere", "Disponibilità, resi, orari, Instagram. Due ordini da ieri senza risposta."],
        slot: [["10:00", "Ritiro · giacca di Laura", "pieno"], ["11:30", "Capo pronto, cliente mai avvisato", "buco"], ["15:00", "Prova abiti promessa a due persone", "doppio"],
               ["16:00", "Ritiro · Vanessa", "pieno"], ["17:00", "Ordine da Instagram letto troppo tardi", "buco"], ["18:30", "Reso · Matteo", "pieno"]],
        sera: "Dopo la chiusura rispondi ai messaggi della giornata."
      },
      con: {
        tel: [null, "Il telefono resta tuo", "Jarvis non risponde alle chiamate. Chi chiede per messaggio riceve disponibilità e orari dal tuo magazzino, in una risposta che approvi."],
        posta: [0, "arretrati", "19 risposte partite col tuo sì. Restano a te un reso contestato e una richiesta di sconto."],
        slot: [["10:00", "Ritiro · giacca di Laura", "pieno"], ["11:30", "Giulia, avvisata col tuo ok: ritira oggi", "jarvis"], ["15:00", "Prova · Serena (Chiara alle 16:30)", "jarvis"],
               ["16:00", "Ritiro · Vanessa", "pieno"], ["17:00", "Ordine da Instagram, risposta partita a mezzogiorno", "jarvis"], ["18:30", "Reso · Matteo", "pieno"]],
        sera: "Alla chiusura il riassunto del giorno è pronto e la posta è in pari."
      }
    }
  }
};
