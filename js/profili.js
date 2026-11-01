// Profili d'esempio: lo stesso Jarvis cambia squadra, giornata ed esempi per ogni tipo di persona.
// Tutti i casi sono esempi generici di un cliente tipo.
window.PROFILI = {
  tutti: {
    nome: 'Per tutti', colore: '#5ad7ff', forma: 'anello',
    frase: 'Il punto di partenza: posta, agenda, promemoria, acquisti e documenti. Poi si costruisce attorno a te.',
    esempi: ['Mail in ordine e risposte pronte da rileggere', 'Agenda, promemoria e lista della spesa a voce', 'Prezzi confrontati prima di ogni acquisto'],
    squadra: [
      ['Segreteria', 'posta', 'Smista la posta, riassume i messaggi lunghi e tiene in ordine l\'agenda.', 'separa 4 mail importanti da 20 pubblicità e prepara le risposte.'],
      ['Preventivi', 'doc', 'Dal tuo listino e da due righe di richiesta prepara il preventivo, pronto da rivedere.', 'preventivo per il signor Rossi, 6 voci, pronto in un minuto.'],
      ['Assistente clienti', 'chat', 'Scrive le risposte a mail e messaggi nel tuo stile. Le mandi tu, dopo averle lette.', '«Giovedì va benissimo, alle 10 da te.» La mando?'],
      ['Social', 'social', 'Prepara i post e li mette in calendario dopo il tuo ok. Ai commenti semplici risponde lui.', '5 post pronti per la settimana, in attesa del tuo sì.'],
      ['Cacciaprezzi', 'prezzo', 'Confronta prodotti e prezzi prima di un acquisto. Comprare lo decidi sempre tu.', '3 lavatrici in 5 negozi, la più conveniente in cima.'],
      ['Archivio', 'archivio', 'Ritrova documenti, ricevute e bollette in un attimo.', '«La bolletta del gas di marzo?» Trovata e aperta.'],
      ['Viaggi', 'viaggio', 'Mette a confronto treni, voli e hotel. La prenotazione la confermi tu.', 'weekend a Firenze: 2 treni comodi, 3 hotel in centro.'],
      ['Revisore', 'scudo', 'Ricontrolla ogni lavoro prima che esca: errori, dati sbagliati, toni fuori posto.', 'nel preventivo manca l\'indirizzo del cliente: corretto prima di mostrartelo.']
    ],
    giornata: null // usa quella già scritta nella pagina
  },
  negozio: {
    nome: 'Negozio', colore: '#ff7eb6', forma: 'borsa',
    frase: 'Per chi sta dietro il bancone e deve anche farsi vedere online.',
    esempi: ['Risposte ai clienti su orari, taglie e disponibilità', 'Post e offerte pronti, escono dopo il tuo ok', 'Magazzino semplice: ti dice cosa sta finendo'],
    squadra: [
      ['Assistente clienti', 'chat', 'Risposte pronte a domande su orari, disponibilità e spedizioni.', '«Sì, la taglia M c\'è: gliela teniamo fino a sabato.»'],
      ['Vetrina social', 'social', 'Prepara i post dei prodotti nuovi e li programma dopo il tuo ok.', 'nuovi arrivi: 3 post pronti per la settimana.'],
      ['Offerte', 'prezzo', 'Prepara volantini e messaggi per le offerte del momento.', 'saldi di fine stagione: testo e post pronti.'],
      ['Ordini', 'carrello', 'Prepara gli ordini ai fornitori. Li confermi sempre tu.', 'ordine del lunedì pronto da confermare.'],
      ['Magazzino', 'archivio', 'Tiene un elenco semplice della merce e ti avvisa quando qualcosa finisce.', 'restano 2 pezzi del modello più venduto.'],
      ['Revisore', 'scudo', 'Ricontrolla post e risposte prima che escano.', 'prezzo sbagliato nel post: corretto prima di mostrartelo.']
    ],
    giornata: [
      ['08:30', 'I messaggi della notte', 'Le domande arrivate dopo la chiusura hanno già una risposta pronta.', [['k', '> messaggi'], ['', '6 domande su orari e taglie'], ['ok', '6 risposte da rileggere']]],
      ['10:00', 'Il prodotto nuovo, sui social', 'Foto, testo e orario di uscita pronti. Esce dopo il tuo ok.', [['k', '> post'], ['', 'nuovi arrivi, uscita alle 18'], ['ok', 'in attesa del tuo sì']]],
      ['13:00', 'I commenti semplici', 'Ringraziamenti e domande facili trovano risposta. Quelli delicati li lascia a te.', [['k', '> commenti'], ['ok', '12 risposte semplici'], ['fa', '1 da vedere tu']]],
      ['15:30', 'Cosa sta finendo', 'Ti dice cosa manca in negozio e prepara l\'ordine al fornitore. Lo confermi tu.', [['k', '> magazzino'], ['', '8 articoli quasi finiti'], ['ok', 'ordine pronto da confermare']]],
      ['19:30', 'L\'offerta del weekend', 'Testo, post e messaggio per i clienti affezionati, pronti per domani.', [['k', '> offerta weekend'], ['ok', 'pronta da approvare']]]
    ]
  },
  barbiere: {
    nome: 'Barbiere ed estetista', colore: '#5ad7ff', forma: 'forbici',
    frase: 'Per parrucchieri, barbieri ed estetiste: l\'agenda piena e le mani libere.',
    esempi: ['Prenotazioni prese e confermate senza alzare il telefono', 'Promemoria ai clienti il giorno prima', 'Buchi in agenda riempiti con chi aspettava'],
    squadra: [
      ['Prenotazioni', 'agenda', 'Raccoglie le richieste e propone gli orari liberi. Le conferme le approvi tu.', '«Sabato alle 11 è libero, la segno?»'],
      ['Promemoria', 'campana', 'Ricorda l\'appuntamento ai clienti il giorno prima.', '14 promemoria per domani, pronti da mandare.'],
      ['Riempi-buchi', 'chat', 'Quando qualcuno disdice, avvisa chi aspettava un posto.', 'disdetta delle 16: proposto il posto a 2 clienti in attesa.'],
      ['Recensioni', 'stella', 'Prepara le risposte alle recensioni, belle e meno belle. Le pubblichi tu.', '«Grazie Laura, ti aspettiamo per il prossimo taglio!»'],
      ['Social', 'social', 'Prepara i post dei lavori del giorno e li programma dopo il tuo ok.', 'prima e dopo di oggi: post pronto.'],
      ['Revisore', 'scudo', 'Ricontrolla orari e messaggi prima che escano.', 'due appuntamenti sovrapposti: segnalato.']
    ],
    giornata: [
      ['08:00', 'L\'agenda del giorno', 'Chi arriva, a che ora e per cosa, prima di aprire.', [['k', '> oggi'], ['', '11 appuntamenti'], ['ok', 'un buco alle 15']]],
      ['09:30', 'Le prenotazioni arrivate', 'Le richieste della notte hanno già un orario proposto.', [['k', '> prenotazioni'], ['', '4 richieste'], ['ok', '4 orari proposti']]],
      ['12:00', 'Il buco delle 15, riempito', 'Una cliente ha disdetto: chi aspettava un posto viene avvisato.', [['k', '> disdetta'], ['ok', 'posto proposto a 2 clienti']]],
      ['17:00', 'Recensioni e social', 'Risposte alle recensioni e il post del giorno, pronti per il tuo ok.', [['k', '> recensioni'], ['ok', '3 risposte pronte']]],
      ['19:30', 'I promemoria di domani', 'Ogni cliente di domani riceve il suo promemoria.', [['k', '> promemoria'], ['ok', '12 pronti da mandare']]]
    ]
  },
  legale: {
    nome: 'Studio legale', colore: '#c38bff', forma: 'bilancia',
    frase: 'Per avvocati e studi: scadenze sotto controllo e carte al loro posto. Il parere resta dell\'avvocato.',
    esempi: ['Scadenze e udienze sempre davanti agli occhi', 'Documenti dei fascicoli ritrovati al volo', 'Bozze pronte, riviste sempre dall\'avvocato'],
    squadra: [
      ['Scadenze e udienze', 'agenda', 'Tiene il calendario delle udienze e ti avvisa delle scadenze in tempo.', 'udienza giovedì alle 9:30, scadenza deposito venerdì.'],
      ['Posta dello studio', 'posta', 'Smista la posta, mette in cima le urgenze e prepara le risposte di routine.', '15 mail, 2 urgenti in cima.'],
      ['Fascicoli', 'archivio', 'Ritrova atti e documenti dei fascicoli in un attimo.', '«La memoria Verdi di marzo?» Trovata.'],
      ['Bozze', 'doc', 'Prepara bozze di lettere e atti dai tuoi modelli. Le rivede e le firma sempre l\'avvocato.', 'lettera di diffida in bozza, da rivedere.'],
      ['Segreteria clienti', 'chat', 'Risponde alle domande pratiche: appuntamenti, documenti da portare.', '«Porti il contratto e la corrispondenza.»'],
      ['Revisore', 'scudo', 'Ricontrolla date, nomi e riferimenti prima che una bozza arrivi a te.', 'nome della controparte scritto male: corretto.']
    ],
    giornata: [
      ['08:00', 'Il punto del mattino', 'Udienze, scadenze e mail urgenti della giornata, in un minuto.', [['k', '> buongiorno'], ['', '1 udienza alle 9:30'], ['ok', '2 scadenze entro venerdì']]],
      ['10:30', 'La posta in ordine', 'Urgenze in cima, risposte di routine già scritte da rileggere.', [['k', '> posta'], ['', '15 nuove, 2 urgenti'], ['ok', '6 risposte pronte']]],
      ['13:00', 'Il documento giusto', '«La memoria Verdi di marzo.» Aperta, senza cercare tra le cartelle.', [['k', '> fascicolo Verdi'], ['ok', 'trovato e aperto']]],
      ['16:00', 'Una bozza da rivedere', 'Dai tuoi modelli esce una bozza ordinata. La rivedi e la firmi tu.', [['k', '> bozza lettera'], ['ok', 'pronta per la revisione']]],
      ['19:00', 'La settimana che arriva', 'Udienze e scadenze dei prossimi giorni, con i documenti da preparare.', [['k', '> prossima settimana'], ['ok', '3 udienze, 4 scadenze']]]
    ]
  },
  ristorante: {
    nome: 'Ristorante e bar', colore: '#ff9f43', forma: 'posate',
    frase: 'Per chi sta tra cucina e sala: prenotazioni, menu e recensioni in ordine.',
    esempi: ['Prenotazioni raccolte e confermate', 'Menu del giorno pronto per i social', 'Risposte alle recensioni, pubblichi tu'],
    squadra: [
      ['Prenotazioni', 'agenda', 'Raccoglie le richieste e ti dice quanti coperti hai. Le conferme le approvi tu.', 'sabato sera: 42 coperti, 2 tavoli liberi.'],
      ['Menu e social', 'social', 'Prepara il post del menu del giorno e lo programma dopo il tuo ok.', 'menu del giorno: post pronto per le 11.'],
      ['Recensioni', 'stella', 'Prepara risposte gentili alle recensioni, anche a quelle storte. Le pubblichi tu.', '«Grazie della segnalazione, ci rivediamo presto.»'],
      ['Assistente clienti', 'chat', 'Risponde a domande su orari, allergeni dichiarati nel menu, parcheggio.', '«Sì, abbiamo il menu senza glutine.»'],
      ['Ordini', 'carrello', 'Prepara la lista per i fornitori. Ordini tu.', 'ordine della verdura pronto per domattina.'],
      ['Revisore', 'scudo', 'Ricontrolla menu, prezzi e orari prima che escano.', 'prezzo del dolce diverso dal menu: segnalato.']
    ],
    giornata: [
      ['09:00', 'I coperti di oggi', 'Prenotazioni del pranzo e della cena, con i tavoli liberi.', [['k', '> prenotazioni'], ['', 'pranzo 24, cena 38'], ['ok', '3 tavoli liberi stasera']]],
      ['10:30', 'Il menu del giorno', 'Il post è pronto con la foto che scegli tu. Esce dopo il tuo ok.', [['k', '> menu del giorno'], ['ok', 'post pronto per le 11']]],
      ['15:30', 'Le recensioni', 'Una risposta pronta per ognuna, anche per quelle storte.', [['k', '> recensioni'], ['', '5 nuove'], ['ok', '5 risposte da rileggere']]],
      ['17:00', 'Le domande dei clienti', 'Orari, parcheggio, menu senza glutine: risposte già scritte.', [['k', '> messaggi'], ['ok', '7 risposte pronte']]],
      ['23:30', 'L\'ordine per domani', 'La lista per i fornitori è pronta prima di chiudere.', [['k', '> ordine'], ['ok', 'pronto da confermare']]]
    ]
  },
  studio: {
    nome: 'Studio professionale', colore: '#9fe9ff', forma: 'valigetta',
    frase: 'Per commercialisti, tecnici e studi medici: agenda, documenti e clienti in ordine.',
    esempi: ['Appuntamenti incastrati senza sovrapposizioni', 'Documenti dei clienti ritrovati in un attimo', 'Promemoria e risposte di routine già pronte'],
    squadra: [
      ['Agenda', 'agenda', 'Incastra gli appuntamenti e manda i promemoria il giorno prima.', 'tre orari liberi giovedì per il nuovo cliente.'],
      ['Segreteria', 'posta', 'Smista le mail e prepara le risposte di routine.', '12 mail, 3 urgenti in cima, 5 risposte pronte.'],
      ['Documenti', 'archivio', 'Ritrova pratiche e documenti dei clienti al volo.', '«La pratica Neri del 2024?» Trovata.'],
      ['Richieste dei clienti', 'chat', 'Risponde alle domande pratiche: documenti da portare, orari, indirizzo.', '«Porti la carta d\'identità e l\'ultimo modello.»'],
      ['Scadenze', 'campana', 'Ti avvisa delle scadenze dei clienti in tempo.', '5 scadenze questa settimana.'],
      ['Revisore', 'scudo', 'Ricontrolla ogni bozza prima che arrivi a te.', 'data sbagliata nella lettera: corretta.']
    ],
    giornata: [
      ['08:00', 'Il punto del mattino', 'Appuntamenti, scadenze e mail che contano, in un minuto.', [['k', '> buongiorno'], ['', '6 appuntamenti oggi'], ['ok', '2 scadenze entro venerdì']]],
      ['09:00', 'La posta dei clienti', 'Le urgenze in cima, le risposte di routine già scritte.', [['k', '> posta'], ['', '12 nuove, 3 urgenti'], ['ok', '5 risposte pronte']]],
      ['12:30', 'Un incastro in agenda', 'Un cliente chiede un appuntamento: tre orari liberi proposti.', [['k', '> appuntamento'], ['ok', '3 orari proposti']]],
      ['16:00', 'La pratica giusta', '«La pratica Neri.» Aperta, senza cercare tra le cartelle.', [['k', '> pratica Neri'], ['ok', 'trovata e aperta']]],
      ['18:30', 'I promemoria di domani', 'Ogni cliente di domani riceve il suo promemoria.', [['k', '> promemoria'], ['ok', '6 pronti da mandare']]]
    ]
  },
  artigiano: {
    nome: 'Artigiano e impresa', colore: '#5fe3a1', forma: 'chiave',
    frase: 'Per chi lavora in cantiere o in bottega e la sera non ha voglia di carte.',
    esempi: ['Preventivi detti a voce, pronti da mandare', 'Appuntamenti con i clienti sempre in ordine', 'Fatture preparate, da controllare e mandare'],
    squadra: [
      ['Appuntamenti', 'agenda', 'Tiene il calendario dei lavori e ti ricorda chi richiamare.', 'domani: 3 interventi, il primo alle 8 in via Roma.'],
      ['Preventivi', 'doc', 'Gli detti i lavori a voce e prepara il preventivo dal tuo listino.', 'rifacimento bagno: preventivo pronto da mandare.'],
      ['Fatture', 'archivio', 'Prepara le fatture dei lavori finiti. Le controlli e le mandi tu.', '3 fatture pronte da controllare.'],
      ['Assistente clienti', 'chat', 'Prepara le risposte su WhatsApp e mail: conferme, orari, indicazioni.', '«Arrivo verso le 15, la chiamo prima.» La mando?'],
      ['Materiale', 'carrello', 'Si segna cosa finisce e confronta i prezzi dei fornitori. Ordini tu.', 'raccordi in esaurimento: lista con i prezzi migliori.'],
      ['Revisore', 'scudo', 'Ricontrolla preventivi e fatture prima che escano.', 'nel preventivo mancava la manodopera: segnalato.']
    ],
    giornata: [
      ['07:00', 'Il giro della giornata', 'Interventi, indirizzi e materiale da caricare, prima di partire.', [['k', '> oggi'], ['', '3 interventi, primo alle 8'], ['ok', 'ricordati la cassetta grande']]],
      ['09:30', 'Il preventivo dal cantiere', 'Gli detti i lavori a voce: il preventivo ti aspetta pronto da mandare.', [['k', '> preventivo bagno'], ['', 'voci dal listino: 9'], ['ok', 'pronto da rivedere']]],
      ['12:30', 'Risposte ai clienti', 'Conferme di orario e indicazioni già scritte. Le mandi tu.', [['k', '> messaggi'], ['', '4 clienti in attesa'], ['ok', '4 risposte pronte']]],
      ['15:00', 'Il materiale che manca', 'Si accorge di cosa sta finendo e confronta i prezzi. Ordini tu.', [['k', '> materiale'], ['', '6 articoli in esaurimento'], ['ok', 'lista con i prezzi migliori']]],
      ['19:00', 'Le fatture della settimana', 'I lavori finiti diventano fatture pronte da controllare.', [['k', '> fatture'], ['ok', '3 pronte da controllare']]]
    ]
  },
  famiglia: {
    nome: 'Privato e famiglia', colore: '#f3cd73', forma: 'casa',
    frase: 'Per chi tiene insieme casa, figli, bollette e mille appuntamenti.',
    esempi: ['Spesa e promemoria detti a voce', 'Bollette ritrovate e scadenze ricordate', 'Viaggi e acquisti confrontati, confermi tu'],
    squadra: [
      ['Agenda di famiglia', 'agenda', 'Scuola, sport, visite e impegni di tutti in un posto solo.', 'martedì: calcetto alle 17 e dentista alle 18.'],
      ['Lista della spesa', 'carrello', 'Glielo dici a voce e si segna tutto.', 'latte, pane, caffè e detersivo.'],
      ['Bollette e documenti', 'archivio', 'Ritrova bollette, ricevute e documenti e ti avvisa delle scadenze.', 'bolletta della luce in scadenza venerdì.'],
      ['Cacciaprezzi', 'prezzo', 'Confronta prezzi e modelli prima di un acquisto. Compri tu.', 'zaino per la scuola: 4 modelli a confronto.'],
      ['Viaggi', 'viaggio', 'Organizza gite e vacanze mettendo a confronto le opzioni. Prenoti tu.', 'weekend al mare: 3 soluzioni per 4 persone.'],
      ['Promemoria', 'campana', 'Compleanni, rinnovi, scadenze: te li ricorda in tempo.', 'tra 5 giorni il compleanno della nonna.']
    ],
    giornata: [
      ['07:15', 'Il mattino di casa', 'Chi porta chi a scuola, cosa c\'è in agenda e che tempo fa.', [['k', '> buongiorno'], ['', 'scuola alle 8, piscina alle 17'], ['ok', 'pioggia nel pomeriggio']]],
      ['10:00', 'La bolletta in scadenza', 'Te la ricorda in tempo e te la ritrova quando serve.', [['k', '> scadenze'], ['ok', 'luce: entro venerdì']]],
      ['13:00', 'La spesa a voce', '«Aggiungi le uova.» La lista si aggiorna da sola.', [['k', '> lista della spesa'], ['', 'uova, latte, pane'], ['ok', 'aggiornata']]],
      ['16:00', 'Il prezzo migliore', 'Confronta modelli e negozi prima di comprare. Decidi tu.', [['k', '> zaino per la scuola'], ['', '4 modelli, 3 negozi'], ['ok', 'il più conveniente in cima']]],
      ['21:00', 'Il weekend, già pensato', 'Tre proposte per la gita di domenica, con orari e costi. Prenoti tu.', [['k', '> gita di domenica'], ['ok', '3 proposte pronte']]]
    ]
  }
};

// Icone originali dei ruoli (tratti su griglia 24x24)
window.ICONE = {
  posta: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  agenda: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  chat: '<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 10h8"/>',
  social: '<path d="M4 10v4l4 1 9 4V5L8 9z"/><path d="M8 15l1 4"/>',
  prezzo: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  archivio: '<path d="M3 6h7l2 2h9v11H3z"/><path d="M3 11h18"/>',
  viaggio: '<path d="M3 15l18-8-6 14-3-6z"/><path d="M12 15l9-8"/>',
  scudo: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  carrello: '<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  libro: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
  campana: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  stella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  video: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>'
};
