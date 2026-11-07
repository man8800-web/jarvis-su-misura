// «Una giornata sul tuo mestiere»: il copione di un giorno d'esempio per ogni mestiere della demo.
// Solo dati: nessuna rete, nessun archivio nel browser, nessuna intelligenza artificiale a runtime.
// I testi del cliente e di Jarvis vengono dagli scambi già scritti in demo-dati.js (campo «scambio»);
// dove serve un testo diverso (disdette, lista d'attesa, risposta del cliente) è scritto qui, a mano.
// Attività, clienti, nomi e orari sono inventati e la pagina lo dice sempre.
//
// Una tappa
//   tipo       punto | prenota | info | persona | lista | promemoria | riepilogo
//   ora        l'ora sul telefono
//   scambio    id dello scambio in demo-dati.js (domanda del cliente e risposta di Jarvis)
//   cliente    nome di fantasia di chi scrive
//   proposti   orari liberi proposti (prenota), scelto: quello che sceglie il cliente, ok: la sua risposta
//   libera     orario che si libera (lista), subentra / okLista: chi lo prende e cosa risponde
// L'agenda è quella del giorno dopo: i promemoria della sera partono per quegli appuntamenti.
window.GIORNATA = {
  nota: "Esempio guidato: attività, clienti, messaggi e orari sono inventati. Nel Jarvis vero ogni messaggio al cliente parte solo dopo il sì del titolare.",
  // ipotesi della stima finale, modificabile dal visitatore con il cursore
  minutiMessaggio: 3,

  testi: {
    // didascalie delle tappe: {chi} è chi decide nell'attività
    punto: ["Il punto del mattino", "Prima di aprire, Jarvis ti dice com'è messo domani e cosa tiene d'occhio oggi. Niente parte da solo: ogni risposta te la propone, tu dici sì o no."],
    prenota: ["Un cliente chiede un posto", "Jarvis risponde con gli orari davvero liberi in agenda. La risposta parte solo quando tu dici sì, e l'appuntamento entra in agenda senza sovrapposizioni."],
    info: ["Una domanda di tutti i giorni", "Prezzi, orari, cosa portare: Jarvis prepara la risposta con i dati della tua attività. Un tocco e parte."],
    persona: ["Una cosa che spetta a te", "Reclami, soldi, salute, pareri, scadenze: Jarvis non risponde nel merito. Te la mette in cima, con quello che serve per richiamare, e al cliente prepara solo un messaggio di cortesia."],
    lista: ["Una disdetta che non lascia buchi", "Il posto torna libero e il messaggio per la lista d'attesa è già pronto. Lo mandi tu, con un tocco, e l'agenda si riempie di nuovo."],
    promemoria: ["I promemoria per domani", "La sera Jarvis prepara un promemoria per ogni appuntamento di domani. Con il tuo ok partono tutti insieme."],
    riepilogo: ["La giornata in numeri", "Quello che è successo oggi, contato dalla giornata d'esempio qui sopra."]
  },

  mestieri: {
    barbiere: {
      agenda: "Agenda di domani",
      gia: [["09:00", "Giorgio", "Taglio e barba"], ["10:30", "Anna", "Piega"], ["11:30", "Elena", "Taglio donna"], ["17:30", "Davide", "Barba con panno caldo"]],
      tappe: [
        { tipo: "punto", ora: "07:45" },
        { tipo: "prenota", ora: "08:12", scambio: "taglio", cliente: "Marco", proposti: ["15:00", "16:00", "18:30"], scelto: "16:00", ok: "Perfetto, alle 16 ci sono." },
        { tipo: "info", ora: "10:40", scambio: "prezzi", cliente: "Sara" },
        { tipo: "persona", ora: "12:55", scambio: "reclamo", cliente: "Luca" },
        { tipo: "lista", ora: "15:20", scambio: "disdici", cliente: "Anna", libera: "10:30", subentra: "Paolo", servizioNuovo: "Taglio uomo", okLista: "Sì! Lo prendo io." },
        { tipo: "promemoria", ora: "18:00", scambio: "taglio" },
        { tipo: "riepilogo", ora: "20:30" }
      ]
    },

    ristorante: {
      agenda: "Prenotazioni di domani",
      gia: [["12:30", "Famiglia Russo", "Tavolo per quattro"], ["13:15", "Chiara", "Tavolo per due"], ["20:30", "Bruno", "Tavolo per sei"], ["21:15", "Irene", "Tavolo per due"]],
      tappe: [
        { tipo: "punto", ora: "09:30" },
        { tipo: "prenota", ora: "10:05", scambio: "pranzo", cliente: "Marco", proposti: ["12:30", "13:00", "13:30"], scelto: "13:00", ok: "Ottimo, alle 13 siamo da voi." },
        { tipo: "info", ora: "11:20", scambio: "vegetariano", cliente: "Sara" },
        { tipo: "persona", ora: "15:10", scambio: "allergie", cliente: "Luca" },
        { tipo: "lista", ora: "17:30", cliente: "Irene", libera: "21:15", subentra: "Paolo", servizioNuovo: "Tavolo per due", okLista: "Sì, lo prendiamo!",
          domanda: "Domani sera non riusciamo più a venire, mi dispiace.",
          risposta: ["Grazie di avvisare: un tavolo libero la sera fa felice qualcun altro.", "La prenotazione di domani è annullata. Se vuole un'altra sera, gliela trovo subito."],
          messaggioLista: "Il Cortile: domani alle 21:15 si è liberato un tavolo per due. Lo volete? Rispondete SÌ e ve lo teniamo." },
        { tipo: "promemoria", ora: "19:00", scambio: "pranzo",
          promemoria: "Il Cortile: la aspettiamo domani, {giorno}, alle {ora}, tavolo per due vicino alla finestra. Per qualsiasi cambio risponda qui." },
        { tipo: "riepilogo", ora: "23:30" }
      ]
    },

    bnb: {
      agenda: "Arrivi di domani",
      gia: [["15:00", "Famiglia Bianchi", "Camera tripla, tre notti"], ["19:00", "Ingrid e Tom", "Camera matrimoniale, due notti"]],
      tappe: [
        { tipo: "punto", ora: "07:30" },
        { tipo: "prenota", ora: "09:15", scambio: "camera", cliente: "Marco", proposti: ["15:00", "17:00", "21:00"], scelto: "17:00", ok: "Perfetto, arriviamo verso le 17." },
        { tipo: "info", ora: "11:00", scambio: "colazione", cliente: "Sara" },
        { tipo: "persona", ora: "14:30", scambio: "sconto", cliente: "Luca" },
        { tipo: "info", ora: "16:45", scambio: "tardi", cliente: "Giulia" },
        { tipo: "promemoria", ora: "18:30", scambio: "camera" },
        { tipo: "riepilogo", ora: "22:00" }
      ]
    },

    medico: {
      agenda: "Agenda di domani",
      gia: [["09:00", "Giorgio", "Igiene professionale"], ["10:00", "Anna", "Visita di controllo"], ["16:30", "Davide", "Igiene professionale"]],
      tappe: [
        { tipo: "punto", ora: "07:50" },
        { tipo: "prenota", ora: "08:40", scambio: "controllo", cliente: "Marco", proposti: ["11:30", "15:00", "18:00"], scelto: "15:00", ok: "Va bene alle 15, grazie." },
        { tipo: "info", ora: "10:15", scambio: "portare", cliente: "Sara" },
        { tipo: "persona", ora: "12:20", scambio: "dolore", cliente: "Luca" },
        { tipo: "lista", ora: "14:50", cliente: "Anna", libera: "10:00", subentra: "Paolo", servizioNuovo: "Visita di controllo", okLista: "Sì, grazie, lo prendo.",
          domanda: "Domani non riesco a venire alla visita, devo disdire.",
          risposta: ["Grazie di averlo detto per tempo.", "La visita di domani è annullata. Quando vuole rifissarla, le propongo i primi orari liberi."],
          messaggioLista: "Studio Sorriso Chiaro: domani alle 10:00 si è liberato un posto per una visita di controllo. Lo vuole? Risponda SÌ e lo teniamo per lei." },
        { tipo: "promemoria", ora: "17:00", scambio: "controllo" },
        { tipo: "riepilogo", ora: "19:30" }
      ]
    },

    avvocato: {
      agenda: "Appuntamenti di domani",
      gia: [["09:30", "Giorgio", "Colloquio"], ["11:00", "Anna", "Primo colloquio"], ["15:00", "Elena", "Colloquio in videochiamata"]],
      tappe: [
        { tipo: "punto", ora: "08:00" },
        { tipo: "prenota", ora: "08:45", scambio: "colloquio", cliente: "Marco", proposti: ["16:30", "18:00"], scelto: "16:30", ok: "Va bene alle 16:30, grazie." },
        { tipo: "info", ora: "10:30", scambio: "costi", cliente: "Sara" },
        { tipo: "persona", ora: "12:10", scambio: "scadenza", cliente: "Luca" },
        { tipo: "lista", ora: "15:40", cliente: "Anna", libera: "11:00", subentra: "Paolo", servizioNuovo: "Primo colloquio", okLista: "Sì, grazie: domani alle 11 va bene.",
          domanda: "Domani non riesco a venire al colloquio, devo disdire.",
          risposta: ["Grazie di averlo detto per tempo.", "Il colloquio di domani è annullato. Quando vuole, le propongo un altro orario."],
          messaggioLista: "Studio legale Piazza Grande: domani alle 11:00 si è liberato un orario per un primo colloquio. Le interessa? Risponda SÌ e lo teniamo per lei." },
        { tipo: "promemoria", ora: "17:00", scambio: "colloquio" },
        { tipo: "riepilogo", ora: "19:30" }
      ]
    },

    idraulico: {
      agenda: "Interventi di domani",
      gia: [["8–10", "Giorgio", "Manutenzione caldaia"], ["10–12", "Anna", "Piccola riparazione idraulica"]],
      tappe: [
        { tipo: "punto", ora: "07:15" },
        { tipo: "prenota", ora: "08:05", scambio: "rubinetto", cliente: "Marco", proposti: ["14–16", "16–18"], scelto: "14–16", ok: "Va bene il pomeriggio, dalle 14 sono a casa." },
        { tipo: "info", ora: "11:30", scambio: "costi", cliente: "Sara" },
        { tipo: "persona", ora: "13:40", scambio: "ancora", cliente: "Luca" },
        { tipo: "lista", ora: "15:15", cliente: "Anna", libera: "10–12", subentra: "Paolo", servizioNuovo: "Piccola riparazione idraulica", okLista: "Sì! Domani mattina ci sono.",
          domanda: "Domani mattina non sono a casa, possiamo annullare?",
          risposta: ["Certo, grazie di avvisare.", "L'intervento di domani è annullato. Quando vuole rifissarlo, le propongo le prime fasce libere."],
          messaggioLista: "Goccia Ferma: domani si è liberata la fascia 10–12. Le serve ancora l'intervento? Risponda SÌ e la teniamo per lei." },
        { tipo: "promemoria", ora: "18:00", scambio: "rubinetto" },
        { tipo: "riepilogo", ora: "20:00" }
      ]
    },

    negozio: {
      agenda: "Appuntamenti di domani",
      gia: [["11:30", "Anna", "Consulenza abito da cerimonia"], ["17:30", "Elena", "Prova capo tenuto da parte"]],
      tappe: [
        { tipo: "punto", ora: "08:30" },
        { tipo: "prenota", ora: "09:10", scambio: "taglia", cliente: "Marco", proposti: ["10:00", "16:00", "18:30"], scelto: "16:00", ok: "Passo alle 16, grazie!" },
        { tipo: "info", ora: "11:05", scambio: "cambio", cliente: "Sara" },
        { tipo: "persona", ora: "13:20", scambio: "difetto", cliente: "Luca" },
        { tipo: "lista", ora: "16:40", cliente: "Anna", libera: "11:30", subentra: "Paola", servizioNuovo: "Consulenza abito da cerimonia", okLista: "Sì, la prendo volentieri!",
          domanda: "Domani non riesco a venire per l'abito, possiamo rimandare?",
          risposta: ["Certo, nessun problema.", "L'appuntamento di domani è annullato. Quando vuole, le propongo gli orari più tranquilli della settimana."],
          messaggioLista: "Filo di Seta: domani alle 11:30 si è liberata un'ora di consulenza per abiti da cerimonia. La vuole? Risponda SÌ e gliela teniamo." },
        { tipo: "promemoria", ora: "18:45", scambio: "taglia" },
        { tipo: "riepilogo", ora: "20:00" }
      ]
    }
  }
};
