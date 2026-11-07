// Demo guidata di Jarvis: conversazioni PREPARATE, una per mestiere, con attività di fantasia.
// Solo dati: nessuna rete, nessun archivio nel browser, nessuna intelligenza artificiale a runtime.
// Il visitatore fa il cliente, Jarvis fa l'assistente dell'attività. Lo aggancio è in vivo.js.
//
// Come si legge uno scambio
//   domanda   testo del pulsante (e prima bolla del cliente)
//   re        varianti scritte a mano, sul testo in minuscolo
//   tipo      info | prenota | persona | urgenza
//   priorita  si controllano prima i numeri alti (urgenza 3-4, persona 2, spostare/disdire 1, il resto 0),
//             a parità vale l'ordine dell'elenco; il primo scambio che corrisponde risponde
//   risposta  frasi scritte una dopo l'altra; elenco facoltativo sotto
//   poi       id dello scambio da proporre subito dopo (pulsante)
//   prenota   servizio, durata (minuti), dettaglio, voce (titolo degli orari), giorni/fasce (al posto di quelli
//             del mestiere), conferma e promemoria con {giorno} {ora}, quando (momento del promemoria)
//   persona   chi risponde, motivo, cosa fa intanto il Jarvis vero
//   anteprima messaggio pronto mostrato come anteprima (mai inviato)
// Giorni: 0 domenica … 6 sabato. Le date si calcolano sul momento dal giorno del visitatore.
// Regole fisse: medico e avvocato solo agenda, informazioni pratiche e passaggio a una persona;
// su un'urgenza sanitaria l'unica frase è «Se è un'emergenza chiami subito il 112».
window.DEMO = {
  nota: "Esempio guidato: risposte preparate, non in tempo reale.",

  // domande che riguardano Jarvis e non l'attività: restano alle risposte già scritte in vivo.js
  lasciaAgliArgomenti: /\bjarvis\b|\bmanuel\b|\bchi sei\b|\bsei (un |una |un')?\s*(robot|bot|umano|persona|macchina|vero|vera|ia\b|ai\b|intelligenza)|intelligenza artificiale|\bprivacy\b|i miei dati|\bgdpr\b/,

  testi: {
    titolo: "Prova Jarvis sul tuo mestiere",
    istruzioni: "Scegli un mestiere: tu fai il cliente, Jarvis fa l'assistente di un'attività di fantasia. Nel Jarvis vero ogni risposta al cliente parte solo dopo il sì del titolare.",
    fantasia: "Attività di fantasia, inventata per questo esempio: nome, indirizzo, prezzi e orari non sono veri.",
    domande: "Domande che puoi fare",
    altriOrari: "Altri orari",
    scheda: "Prenotazione di prova",
    conferma: "Conferma",
    cambia: "Cambia orario",
    nessunDato: "In questa prova non si chiede nome, telefono o email, e non parte niente.",
    confermata: "Prenotazione di prova confermata",
    promemoria: "Il promemoria che riceverebbe il cliente",
    anteprima: "Anteprima: nessun messaggio è stato inviato.",
    dietro: "Intanto, per il titolare, il Jarvis vero:",
    dietroElenco: [
      "prepara la risposta per il cliente e la manda solo dopo il tuo sì, anche dal telefono",
      "segna l'appuntamento in agenda, senza sovrapposizioni",
      "prepara il promemoria del giorno prima, che parte solo con il tuo ok"
    ],
    persona: "Passato a una persona",
    personaNota: "Su questo Jarvis non risponde da solo: la richiesta va a {chi}.",
    fuori: "Questa domanda non è nell'esempio guidato di {attivita}: qui le risposte sono preparate, non inventate sul momento. Prova una di queste, oppure chiedila a Manuel.",
    ricomincia: "Ricomincia da capo",
    voglio: "Lo voglio per la mia attività",
    piano: "Il tuo piano Jarvis",              // porta alla scheda con la stima (js/piano-jarvis.js)
    temaVoglio: "Demo: {etichetta}",           // argomento fisso del modulo (max 110 caratteri)
    giorni: ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"],
    mesi: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"]
  },

  ordine: ["barbiere", "ristorante", "bnb", "medico", "avvocato", "idraulico", "negozio"],

  mestieri: {
    /* ------------------------------------------------------------------ barbiere e parrucchiere */
    barbiere: {
      etichetta: "Barbiere e parrucchiere", profilo: "barbiere",
      attivita: "Salone «Lama & Pettine»",
      indirizzo: "Via degli Esempi 4",
      riconosci: /parrucch|barbier|salone|estetist|capell|acconciat|hair/,
      apertura: "Buongiorno, sono l'assistente del salone Lama & Pettine. Posso trovarle un posto in agenda, darle i prezzi del listino o passarla al titolare. Mi dica pure.",
      orari: { giorni: [2, 3, 4, 5, 6], fasce: ["09:00", "09:30", "10:30", "11:30", "15:00", "16:00", "17:30", "18:30"] },
      scambi: [
        { id: "taglio", tipo: "prenota", domanda: "Vorrei prenotare un taglio uomo",
          re: /prenot|appuntament|\bposto\b|post[oi] liber|disponibil|fissa(re|rmi|mi)|venire (da voi|in salone)|quando (posso|potrei|siete liberi)|\btaglio\b|tagliarmi/,
          risposta: ["Con piacere. Un taglio uomo dura mezz'ora e, dal listino d'esempio, costa 18 €.", "Questi sono i primi posti liberi con il titolare:"],
          prenota: { servizio: "Taglio uomo", durata: 30,
            conferma: "Segnato: {giorno} alle {ora}, taglio uomo con il titolare. Il giorno prima le arriva un promemoria, così non deve ricordarselo lei.",
            quando: "il giorno prima, alle 18",
            promemoria: "Lama & Pettine: le ricordiamo il taglio di domani, {giorno}, alle {ora}. Se non riesce a venire risponda SPOSTA e le propongo un altro orario." } },

        { id: "colore", tipo: "prenota", domanda: "Colore e piega per sabato mattina?",
          re: /colore|tinta|mèche|meches|balayage|colpi di sole|riflessi|schiarit/,
          risposta: ["Il sabato mattina va a ruba, ma qualcosa c'è.", "Colore e piega richiedono circa due ore: le propongo solo gli orari che lasciano il tempo giusto, senza farla correre. Sabato, con la colorista:"],
          prenota: { servizio: "Colore e piega", durata: 120, giorni: [6], fasce: ["09:00", "09:30", "10:00"],
            conferma: "Fatto: {giorno} alle {ora}, colore e piega con la colorista, circa due ore. Se è la prima volta da noi, prima di cominciare le fa qualche domanda sui suoi capelli: dieci minuti ben spesi.",
            quando: "il giorno prima, alle 18",
            promemoria: "Lama & Pettine: domani, {giorno}, alle {ora} la aspettiamo per colore e piega (circa due ore). Per spostare risponda SPOSTA." } },

        { id: "prezzi", tipo: "info", domanda: "Quanto costano piega e barba?",
          re: /cost|prezz|listino|quant[oa] (viene|vengono|si paga|spend|prendete)|tariff/,
          risposta: ["Ecco il listino d'esempio del salone:", "Se vuole, le trovo subito un posto."],
          elenco: ["Taglio uomo: 18 €", "Barba con panno caldo: 12 €", "Taglio e barba: 26 €", "Piega: da 20 €, secondo la lunghezza", "Colore e piega: da 55 €"],
          poi: "taglio" },

        { id: "senza", tipo: "info", priorita: 1, domanda: "Posso passare senza appuntamento?",
          re: /senza (appuntament|prenot)|passare|di passaggio|al volo|\bsubito\b|adesso|entrare/,
          risposta: ["Se c'è un buco sì, ma il sabato è quasi impossibile. Le dico la verità: con un appuntamento non aspetta e il titolare le dedica il tempo giusto.", "Il salone è aperto dal martedì al sabato, 9–13 e 14:30–19:30. Il lunedì è chiuso."],
          poi: "taglio" },

        { id: "sposta", tipo: "prenota", priorita: 1, domanda: "Devo spostare il mio appuntamento",
          re: /spost|cambiare (l'|il |lo |)(orario|appuntamento|giorno|ora)|anticip|posticip|rimandar/,
          risposta: ["Nessun problema, succede a tutti.", "Libero il suo posto e le propongo i primi orari per lo stesso servizio:"],
          prenota: { servizio: "Taglio uomo (spostato)", durata: 30,
            conferma: "Spostato: ora la aspettiamo {giorno} alle {ora}. Il posto di prima torna libero per chi era in lista d'attesa.",
            quando: "il giorno prima, alle 18",
            promemoria: "Lama & Pettine: le ricordiamo il nuovo appuntamento di domani, {giorno}, alle {ora}. A presto." } },

        { id: "disdici", tipo: "info", priorita: 1, domanda: "Non riesco a venire domani, devo disdire",
          re: /disd|annull|cancell|non (posso|riesco a|ce la faccio a) venire|salt(o|are) l'appuntamento/,
          risposta: ["Grazie di averlo detto per tempo: per un salone vuol dire molto.", "L'appuntamento è annullato. E il posto non resta vuoto: il messaggio per chi era in lista d'attesa è già pronto, il titolare lo manda con un tocco."],
          anteprima: { titolo: "Messaggio pronto per la lista d'attesa", testo: "Ciao, da Lama & Pettine: domani si è liberato un posto. Lo vuoi? Rispondi SÌ e te lo teniamo." } },

        { id: "regalo", tipo: "info", domanda: "Fate buoni regalo?",
          re: /regal|buon[oi]\b|gift/,
          risposta: ["Sì: buoni regalo per qualsiasi servizio del listino, con il nome di chi lo riceve scritto a mano.", "Si preparano in salone in un minuto. Se preferisce, il titolare glielo fa trovare pronto in busta."] },

        { id: "reclamo", tipo: "persona", priorita: 2, domanda: "Non sono contento del taglio di ieri",
          re: /non (sono|sono stat[oa]|ero) (soddisfatt|content)|reclam|lamentel|rovinat|venuto male|sbagliat|delus|rimbors|non mi piace/,
          risposta: ["Mi dispiace davvero, e su questo non le rispondo con una frase fatta.", "Passo la sua richiesta al titolare, che la richiama di persona oggi stesso per capire cosa non è andato e rimediare."],
          persona: { chi: "il titolare", motivo: "Un reclamo lo gestisce sempre una persona, mai una risposta automatica.",
            cosa: "mette il messaggio in cima, con il servizio fatto e l'orario, e ricorda al titolare di richiamare." } }
      ]
    },

    /* ------------------------------------------------------------------ ristorante */
    ristorante: {
      etichetta: "Ristorante", profilo: "ristorante",
      attivita: "Trattoria «Il Cortile»",
      indirizzo: "Piazza della Prova 2",
      riconosci: /ristorant|trattori|pizzeri|osteri|\bbar\b|locale|cucina|chef|camerier|bistrot|enotec/,
      apertura: "Buonasera, sono l'assistente della trattoria Il Cortile. Le trovo un tavolo, le racconto il menu o la passo a chi sta in cucina. Come posso aiutarla?",
      orari: { giorni: [0, 2, 3, 4, 5, 6], fasce: ["12:30", "13:15", "19:30", "20:30", "21:15"] },
      scambi: [
        { id: "pranzo", tipo: "prenota", domanda: "Un tavolo per due a pranzo?",
          re: /pranzo|mezzogiorno|per (due|2)\b|in (due|2)\b/,
          risposta: ["A pranzo è più tranquillo: in due si sta bene vicino alla finestra sul cortile.", "Primi orari liberi:"],
          prenota: { servizio: "Tavolo per due a pranzo", dettaglio: "2 persone, vicino alla finestra", durata: 75, fasce: ["12:30", "13:00", "13:30"],
            conferma: "Prenotato: {giorno} alle {ora}, tavolo per due vicino alla finestra. Se ha poco tempo lo dica al cameriere: il menu del giorno esce in un quarto d'ora.",
            quando: "la mattina stessa, alle 10",
            promemoria: "Il Cortile: oggi alle {ora} la aspetta il tavolo per due vicino alla finestra. Per qualsiasi cambio risponda qui." } },

        { id: "tavolo", tipo: "prenota", domanda: "Un tavolo per quattro sabato sera?",
          re: /sabato sera|per (quattro|4)\b|in (quattro|4)\b|tavolo per|un tavolo|prenot|coperti|\bcena\b|siete liberi|posto per/,
          risposta: ["Sabato sera c'è movimento, ma per quattro un tavolo lo trovo.", "Questi sono gli orari ancora liberi:"],
          prenota: { servizio: "Tavolo per quattro", dettaglio: "4 persone, sala interna", durata: 120, giorni: [6], fasce: ["19:30", "20:30", "21:15"],
            conferma: "Prenotato: {giorno} alle {ora}, tavolo per quattro in sala. Se arriva qualcuno in più o in meno, basta dirlo entro il pomeriggio: la cucina ringrazia.",
            quando: "la mattina stessa, alle 11",
            promemoria: "Il Cortile: la aspettiamo stasera alle {ora}, tavolo per quattro. Se cambia qualcosa risponda a questo messaggio, il tavolo lo teniamo un quarto d'ora." } },

        { id: "orari", tipo: "info", domanda: "Che orari fate e c'è parcheggio?",
          re: /orar|aperti|apert[ei]\b|chius|riposo|parchegg|come (ci )?arriv|dove siete|indirizz/,
          risposta: ["Siamo aperti dal martedì alla domenica: a pranzo dalle 12:30 alle 14:30, a cena dalle 19:30 alle 23. Il lunedì riposiamo.", "Siamo in Piazza della Prova 2, con un parcheggio pubblico a due minuti a piedi: la sera è quasi sempre libero."],
          poi: "tavolo" },

        { id: "vegetariano", tipo: "info", domanda: "Avete piatti vegetariani?",
          re: /vegetarian|vegan|senza carne|di verdur|menu|menù|piatti del giorno/,
          risposta: ["Sì: nel menu d'esempio ci sono sempre tre piatti vegetariani, segnati con una foglia, e un primo vegano.", "Il menu del giorno lo trova sulla pagina del locale ogni mattina dalle 11."] },

        { id: "asporto", tipo: "info", priorita: 1, domanda: "Fate anche da asporto?",
          re: /asporto|portar via|da portare|domicilio|consegn|ritir/,
          risposta: ["Sì, da asporto: si ordina entro le 18 e si ritira dalle 19:30, già impacchettato.", "A domicilio per ora no: preferiamo che i piatti arrivino come escono dalla cucina."] },

        { id: "disdici", tipo: "info", priorita: 1, domanda: "Devo disdire la prenotazione di stasera",
          re: /disd|annull|cancell|non (possiamo|posso|riusciamo a|riesco a) venire|spost/,
          risposta: ["Grazie di avvisare: un tavolo libero alle otto di sera fa felice qualcun altro.", "La prenotazione è annullata. Se vuole un'altra sera, gliela trovo subito."],
          poi: "tavolo" },

        { id: "allergie", tipo: "persona", priorita: 2, domanda: "Mia figlia è celiaca: potete cucinare senza glutine?",
          re: /celiac|glutine|allerg|intolleran|lattosio|frutta a guscio|arachid|crostace/,
          risposta: ["Gli allergeni di ogni piatto sono scritti nel menu, e glieli posso mostrare.", "Ma su un'allergia o sulla celiachia la garanzia non gliela do io: passo la richiesta allo chef, che la richiama prima della prenotazione e le dice con esattezza cosa può preparare e come."],
          persona: { chi: "lo chef", motivo: "Allergie e intolleranze: risponde chi sta in cucina, mai una risposta automatica.",
            cosa: "segna la richiesta con la data del tavolo e la mette in cima alla lista dello chef." } },

        { id: "gruppo", tipo: "persona", priorita: 2, domanda: "Siamo in quindici per un compleanno",
          re: /\b(siamo|saremo|per|in) (in )?(1[0-9]|[2-9][0-9]|dieci|undici|dodici|quindici|venti|trenta)\b|quindici|compleann|festa|gruppo|evento|aziendal|battesim|comunion|laurea|tavolata|cresim/,
          risposta: ["Una tavolata da quindici si prepara bene, non si improvvisa.", "Per i gruppi oltre le dieci persone il titolare propone un menu fisso e tiene la sala giusta: gli passo la richiesta e la richiama oggi con due proposte."],
          persona: { chi: "il titolare", motivo: "Gruppi ed eventi: menu, prezzo e caparra li decide il titolare.",
            cosa: "prepara per il titolare data, numero di persone e occasione, così la telefonata dura due minuti." } },

        { id: "reclamo", tipo: "persona", priorita: 2, domanda: "Ieri il servizio è stato lentissimo",
          re: /lent[oiae]|lentissim|reclam|lamentel|delus|fredd[oa]|conto sbagliat|non (sono|siamo|ero|eravamo) (soddisfatt|content)|scortes|maleducat|aspettato (troppo|un'ora)/,
          risposta: ["Mi dispiace, e grazie di avercelo detto invece di tenerlo per sé.", "Una cosa così la legge il titolare in persona: gli passo il suo messaggio e la richiama per capire cosa è andato storto."],
          persona: { chi: "il titolare", motivo: "Un reclamo merita una persona, non una risposta preconfezionata.",
            cosa: "mette il messaggio in cima con la sera e il tavolo, e prepara una bozza di risposta che il titolare rilegge." } }
      ]
    },

    /* ------------------------------------------------------------------ B&B */
    bnb: {
      etichetta: "B&B", profilo: "famiglia",
      attivita: "B&B «La Corte dei Limoni»",
      indirizzo: "Via degli Esempi 18",
      riconosci: /\bb ?& ?b\b|\bbnb\b|\bb and b\b|bed (and|&) breakfast|affittacamer|casa vacanz|case vacanz|agriturism|guest ?house|struttura ricettiv|ospiti/,
      apertura: "Benvenuto, sono l'assistente del B&B La Corte dei Limoni. Le dico cosa è libero, come arrivare e cosa trova a colazione. Se serve la titolare, la passo a lei.",
      orari: { giorni: [0, 1, 2, 3, 4, 5, 6], fasce: ["15:00", "17:00", "19:00", "21:00"] },
      scambi: [
        { id: "camera", tipo: "prenota", domanda: "Avete una doppia per due notti?",
          re: /camer|doppi[ao]|matrimonial|singol|tripl|\bnott[ei]\b|disponibil|prenot|soggiorn|weekend|liber[ao]|\bposto\b/,
          risposta: ["Sì: la camera doppia con vista sul cortile è libera. Due notti, colazione compresa.", "Mi dica quando arriva, così le faccio trovare la stanza pronta all'ora giusta:"],
          prenota: { servizio: "Camera doppia, due notti", dettaglio: "colazione compresa", voce: "Giorno e ora di arrivo",
            conferma: "Prenotazione di prova: arrivo {giorno} verso le {ora}, camera doppia per due notti, colazione compresa. Il giorno prima le arrivano le indicazioni per raggiungerci e il numero da chiamare quando arriva.",
            quando: "il giorno prima dell'arrivo, alle 10",
            promemoria: "La Corte dei Limoni: la aspettiamo domani, {giorno}, verso le {ora}. Porti un documento d'identità per ogni ospite: serve per la registrazione. Se tarda ci scriva, il check-in è possibile fino a mezzanotte." } },

        { id: "colazione", tipo: "info", domanda: "A che ora è la colazione?",
          re: /colazion|cornett|brioche|\bcaff[eè]|torte|dolci|salat[oi]/,
          risposta: ["Dalle 7:30 alle 10:30, in cortile quando c'è il sole. Dolci fatti in casa ogni mattina e, su richiesta, anche salato.", "Se ha un'intolleranza lo scriva quando prenota: la titolare la richiama per organizzarsi."] },

        { id: "arrivare", tipo: "info", domanda: "C'è parcheggio? Arrivo in treno",
          re: /parchegg|\bauto\b|macchin|treno|stazion|come (ci )?arriv|dove siete|indirizz|\bbus\b|autobus|taxi|aeroport/,
          risposta: ["Parcheggio gratuito nel cortile, quattro posti: il suo lo segniamo con la prenotazione.", "Dalla stazione sono dieci minuti a piedi. Se arriva con le valigie pesanti, glielo diciamo noi a che ora conviene chiamare il taxi."] },

        { id: "tardi", tipo: "info", priorita: 1, domanda: "Arrivo tardi, verso mezzanotte: si può?",
          re: /tard[io]|mezzanott|di notte|dopo le (2[0-3]|dieci|undici)|check-?in|self|chiav|portone/,
          risposta: ["Sì, fino a mezzanotte: basta dirci l'orario d'arrivo, e chi è di turno la aspetta per l'accoglienza e le consegna le chiavi.", "Se tarda per il treno o il traffico, ci scriva: risponde una persona, anche di sera."] },

        { id: "animali", tipo: "info", domanda: "Posso portare il cane?",
          re: /\bcan[ei]\b|cagnolin|gatt[oi]|animal|cucciol/,
          risposta: ["Sì, cani piccoli e medi sono benvenuti nelle camere al piano terra, con la ciotola già pronta.", "Lo scriva quando prenota, così le assegniamo la stanza giusta."] },

        { id: "tassa", tipo: "info", priorita: 1, domanda: "La tassa di soggiorno è compresa?",
          re: /tass[ae]|imposta|compres[oa] nel prezzo|extra|costi in più/,
          risposta: ["No: la tassa di soggiorno la decide il Comune e si paga a parte all'arrivo, a persona e per notte.", "L'importo esatto è scritto nella conferma della prenotazione, così non ci sono sorprese."] },

        { id: "rimborso", tipo: "persona", priorita: 2, domanda: "Devo cancellare: mi rimborsate?",
          re: /rimbors|cancell|disd|annull|caparra|penal|soldi indietro|restituit/,
          risposta: ["Mi dispiace per il cambio di programma.", "Sui rimborsi decide la titolare, secondo le condizioni della sua prenotazione: non voglio dirle una cosa sbagliata. Le passo la richiesta e la richiama entro oggi."],
          persona: { chi: "la titolare", motivo: "Soldi e condizioni di cancellazione: decide la titolare, caso per caso.",
            cosa: "prepara per la titolare le date della prenotazione e le condizioni accettate, così risponde subito." } },

        { id: "sconto", tipo: "persona", priorita: 2, domanda: "Fate un prezzo per una settimana intera?",
          re: /scont|prezzo (speciale|migliore|per una)|settiman|lungo soggiorno|offert|più notti/,
          risposta: ["Per una settimana intera di solito qualcosa si trova.", "Ma il prezzo lo fa la titolare, non io: le passo la richiesta con le date e le risponde lei, di solito entro la giornata."],
          persona: { chi: "la titolare", motivo: "Prezzi su misura: li decide la titolare, Jarvis non promette cifre.",
            cosa: "controlla che la camera sia libera per tutta la settimana e mette la richiesta in cima." } },

        { id: "guasto", tipo: "persona", priorita: 2, domanda: "In camera non funziona il riscaldamento",
          re: /non funzion|rott[oa]|guast|riscaldament|acqua calda|\bwi-?fi\b|internet|rumor|fa freddo|perde/,
          risposta: ["Mi scusi per il disagio: lo segnalo subito, con la precedenza su tutto il resto.", "La titolare la chiama entro pochi minuti e, se serve, sale lei a sistemare."],
          persona: { chi: "la titolare", motivo: "Un ospite in difficoltà parla con una persona, subito.",
            cosa: "manda la segnalazione con il numero della camera e, se la titolare non risponde, avvisa chi è di turno." } }
      ]
    },

    /* ------------------------------------------------------------------ studio medico o dentista */
    medico: {
      etichetta: "Studio medico o dentista", profilo: "studio",
      attivita: "Studio dentistico «Sorriso Chiaro»",
      indirizzo: "Via degli Esempi 27",
      riconosci: /dentist|odontoiatr|studio medic|\bmedic[oa]\b|ambulatori|poliambulator|fisioterap|ortodon|igienist|pediatr/,
      apertura: "Buongiorno, sono l'assistente dello studio Sorriso Chiaro. Mi occupo di agenda e informazioni pratiche; su sintomi e cure risponde sempre la dottoressa. Come posso aiutarla?",
      orari: { giorni: [1, 2, 3, 4, 5], fasce: ["09:00", "10:00", "11:30", "15:00", "16:30", "18:00"] },
      scambi: [
        { id: "controllo", tipo: "prenota", domanda: "Vorrei una visita di controllo",
          re: /prenot|appuntament|visita di controllo|controll|liber[oi]|disponibil|fissa(re|rmi|mi)|quando (posso|potrei) (venire|passare)/,
          risposta: ["Certo. La visita di controllo dura mezz'ora, con la dottoressa.", "Questi sono i primi orari liberi:"],
          prenota: { servizio: "Visita di controllo", durata: 30,
            conferma: "Segnato: {giorno} alle {ora}, visita di controllo. Il giorno prima le arriva il promemoria con cosa portare.",
            quando: "il giorno prima, alle 17",
            promemoria: "Studio Sorriso Chiaro: le ricordiamo la visita di domani, {giorno}, alle {ora}. Porti la tessera sanitaria e, se li ha, esami o radiografie recenti. Per spostarla risponda SPOSTA." } },

        { id: "igiene", tipo: "prenota", domanda: "Quando posso fare la pulizia dei denti?",
          re: /pulizi|igien|detartras|tartaro|sbiancament/,
          risposta: ["La pulizia la fa l'igienista e dura circa tre quarti d'ora.", "Ecco i primi posti liberi:"],
          prenota: { servizio: "Igiene professionale", durata: 45,
            conferma: "Segnato: {giorno} alle {ora}, igiene professionale con l'igienista, circa tre quarti d'ora.",
            quando: "il giorno prima, alle 17",
            promemoria: "Studio Sorriso Chiaro: domani, {giorno}, alle {ora} la aspetta l'igienista. Se non riesce a venire risponda SPOSTA, così il posto va a un altro paziente." } },

        { id: "portare", tipo: "info", priorita: 1, domanda: "Cosa devo portare alla prima visita?",
          re: /portar|document|tessera|prima visita|impegnativ|carta d'identit/,
          risposta: ["Per la prima visita: un documento d'identità, la tessera sanitaria e, se li ha, esami o radiografie degli ultimi anni.", "Se prende dei farmaci, porti l'elenco scritto: lo guarda la dottoressa durante la visita."],
          poi: "controllo" },

        { id: "costi", tipo: "info", priorita: 1, domanda: "Quanto costa una visita e come si paga?",
          re: /cost|prezz|pagament|pagar|bancomat|carta di credito|fattur|ricevut|tariff|preventiv/,
          risposta: ["Il costo della visita lo comunica la segreteria prima dell'appuntamento, così sa sempre cosa paga.", "Si paga in studio con carta, bancomat o contanti, e la fattura gliela diamo sempre. Per le cure, la dottoressa prepara un preventivo scritto prima di cominciare."] },

        { id: "orari", tipo: "info", domanda: "Che orari fate? Siete aperti il sabato?",
          re: /orar|aperti|apert[oe]\b|chius|sabato|domenic|dove siete|indirizz|parchegg/,
          risposta: ["Lo studio è aperto dal lunedì al venerdì, 9–13 e 14:30–19. Il sabato è chiuso.", "Siamo in Via degli Esempi 27, al primo piano con ascensore; il parcheggio più comodo è quello coperto dietro l'angolo."] },

        { id: "sposta", tipo: "prenota", priorita: 1, domanda: "Devo spostare la visita",
          re: /spost|disd|annull|cambiare (l'|il |la |)(orario|appuntamento|giorno|visita)|anticip|posticip|rimandar|non (posso|riesco a) venire/,
          risposta: ["Nessun problema. Libero il suo posto e le propongo i primi orari per la stessa visita:"],
          prenota: { servizio: "Visita di controllo (spostata)", durata: 30,
            conferma: "Spostata: ora la aspettiamo {giorno} alle {ora}. Il posto di prima va al primo paziente in lista d'attesa.",
            quando: "il giorno prima, alle 17",
            promemoria: "Studio Sorriso Chiaro: le ricordiamo la visita di domani, {giorno}, alle {ora}." } },

        { id: "farmaci", tipo: "persona", priorita: 2, domanda: "Posso prendere un antidolorifico prima della visita?",
          // anche gravidanza, allergie e malattie: «posso fare la pulizia?» lì non è una domanda d'agenda
          re: /farmac|medicin|antidolor|antibiot|antinfiamm|anticoagul|pastigli|compress|ibuprofen|paracetamol|aspirin|dos[ei]\b|quante (gocce|pastiglie)|incint|gravidanz|allatt|allergi|anestesi|diabet|cardiopat|pacemaker/,
          risposta: ["Su farmaci, dosi e condizioni di salute non posso risponderle, nemmeno sui farmaci che si comprano senza ricetta: è una domanda per la dottoressa o per il suo medico.", "Le passo la domanda e la richiamano dallo studio."],
          persona: { chi: "la dottoressa", motivo: "Farmaci, dosi e condizioni di salute: risponde solo un medico.",
            cosa: "inoltra la domanda così com'è, senza aggiungere niente." } },

        { id: "dolore", tipo: "persona", priorita: 2, domanda: "Mi fa male un dente da due giorni",
          re: /\bmale\b|dolor|sensibil|pulsa|ascess|infiamm|carie|si è rott|si e' rott|scheggiat|otturazion|cadut|sanguin|gengiv|cosa (devo|posso) fare/,
          risposta: ["Mi dispiace. Sul dolore non le rispondo io: lo valuta la dottoressa.", "Passo la sua richiesta alla segreteria come prioritaria: la richiamano oggi e, se serve, le trovano posto tra i primi liberi."],
          persona: { chi: "la segreteria e la dottoressa", motivo: "Sintomi e dolore: nessuna indicazione automatica, decide il medico.",
            cosa: "mette la richiesta in cima alla lista della segreteria, segnata come prioritaria." } },

        { id: "referto", tipo: "persona", priorita: 2, domanda: "Mi spiegate cosa dice la mia radiografia?",
          re: /^(?!.*\bportar).*(risultat|refert|diagnos|cosa (vuol dire|significa|dice)|spieg\w* (cosa|il |la |l'|gli |i )?(refert|radiograf|lastr|esam|risultat)|(è|e') grave|lastr)/,
          risposta: ["Un referto lo spiega solo la dottoressa: io non lo leggo e non do interpretazioni.", "Le passo la richiesta e la segreteria le propone un momento per sentirla al telefono, oppure ne parlate alla prossima visita."],
          persona: { chi: "la dottoressa", motivo: "Referti ed esami: li interpreta solo il medico.",
            cosa: "segna la richiesta e propone alla dottoressa dieci minuti di telefonata in agenda." } },

        { id: "urgenza", tipo: "urgenza", priorita: 3, domanda: "Ho la guancia gonfia e la febbre",
          // «mi è caduta un'otturazione» o «sanguinano le gengive» vanno alla segreteria come priorità, non al 112
          re: /\b112\b|emergenz|urgent|respir|sangu\w* (molto|tanto|tantissimo|senza sosta)|non (si )?ferma(re)? (il )?sangue|emorrag|svenut|gonfi|febbre|incident|trauma|sono cadut|ho battuto|non riesco a (aprire|deglutire|parlare)/,
          risposta: ["Se è un'emergenza chiami subito il 112.", "Io sono l'assistente dell'agenda e su sintomi non posso darle indicazioni: segnalo subito la sua richiesta allo studio come urgente, e la richiama una persona."],
          persona: { chi: "lo studio, come urgenza", motivo: "Possibile urgenza: solo il 112 e il passaggio immediato a una persona, nessun altro consiglio.",
            cosa: "avvisa subito la segreteria e la dottoressa, anche sul telefono." } }
      ]
    },

    /* ------------------------------------------------------------------ studio legale */
    avvocato: {
      etichetta: "Studio legale", profilo: "legale",
      attivita: "Studio legale «Piazza Grande»",
      indirizzo: "Via degli Esempi 40",
      riconosci: /avvocat|studio legale|\blegale\b|giurist|penalist|civilist/,
      apertura: "Buongiorno, sono l'assistente dello studio legale Piazza Grande. Mi occupo di appuntamenti, documenti da portare e informazioni pratiche; i pareri li dà solo l'avvocata. Mi dica pure.",
      orari: { giorni: [1, 2, 3, 4, 5], fasce: ["09:30", "11:00", "15:00", "16:30", "18:00"] },
      scambi: [
        { id: "colloquio", tipo: "prenota", domanda: "Vorrei fissare un primo colloquio",
          re: /prenot|appuntament|colloqui|incontr|fissa(re|rmi|mi)|consulenz|liber[oi]|disponibil|ricev(ere|e|ete)|parlare con l'avvocat/,
          risposta: ["Volentieri. Il primo colloquio con l'avvocata dura circa tre quarti d'ora, in studio o in videochiamata.", "Primi orari disponibili:"],
          prenota: { servizio: "Primo colloquio con l'avvocata", durata: 45,
            conferma: "Segnato: {giorno} alle {ora}, primo colloquio. Prima dell'incontro la segreteria le manda per iscritto il costo del colloquio e l'elenco dei documenti da portare.",
            quando: "il giorno prima, alle 17",
            promemoria: "Studio legale Piazza Grande: le ricordiamo il colloquio di domani, {giorno}, alle {ora}. Porti un documento d'identità e le carte che ha ricevuto, anche quelle che le sembrano poco importanti." } },

        { id: "portare", tipo: "info", priorita: 1, domanda: "Cosa devo portare al colloquio?",
          re: /portar|document|\bcarte\b|preparar|cosa (serve|servirà)/,
          risposta: ["Un documento d'identità e tutte le carte che riguardano la questione: contratti, lettere, mail, messaggi, ricevute.", "Meglio una carta in più che una in meno: le guarda l'avvocata, e decide lei cosa serve."],
          poi: "colloquio" },

        { id: "costi", tipo: "info", priorita: 1, domanda: "Quanto costa il primo colloquio?",
          re: /cost|prezz|parcell|tariff|onorari|pagar|pagament|preventiv|patrocinio|gratuit/,
          risposta: ["Il costo del primo colloquio la segreteria glielo comunica per iscritto prima dell'incontro: così decide sapendo già la cifra.", "Per il resto del lavoro l'avvocata prepara un preventivo scritto dopo aver capito il caso. Sul patrocinio a spese dello Stato le risponde direttamente lei."],
          poi: "colloquio" },

        { id: "dove", tipo: "info", domanda: "Dove siete? Si può fare in videochiamata?",
          re: /dove siete|indirizz|sabato|orar|aperti|videochiam|online|a distanza|lontan|parchegg|zoom|meet/,
          risposta: ["Lo studio è in Via degli Esempi 40 e riceve dal lunedì al venerdì, 9–13 e 14:30–19. Il sabato è chiuso.", "Sì: se è lontano o ha poco tempo, il primo colloquio si fa anche in videochiamata. Il collegamento le arriva insieme alla conferma."],
          poi: "colloquio" },

        { id: "sposta", tipo: "prenota", priorita: 1, domanda: "Devo spostare l'appuntamento",
          re: /spost|disd|annull|cambiare (l'|il |lo |)(orario|appuntamento|giorno)|anticip|posticip|rimandar|non (posso|riesco a) venire/,
          risposta: ["Certo. Libero il suo orario e le propongo i primi disponibili:"],
          prenota: { servizio: "Primo colloquio (spostato)", durata: 45,
            conferma: "Spostato: ora l'avvocata la aspetta {giorno} alle {ora}.",
            quando: "il giorno prima, alle 17",
            promemoria: "Studio legale Piazza Grande: le ricordiamo il colloquio di domani, {giorno}, alle {ora}." } },

        { id: "ragione", tipo: "persona", priorita: 2, domanda: "Mi hanno licenziato: ho ragione io?",
          re: /ragione|torto|fare causa|denunc|querel|vincer|\bvinc|conviene|cosa (rischio|devo fare|posso fare)|che (diritti|rischi)|licenzi|\bmulta\b|eredit|separaz|divorz|sfratt|risarciment|affidament|mantenimento/,
          risposta: ["Capisco che sia una situazione pesante.", "Ma se ha ragione, e cosa conviene fare, può dirglielo solo l'avvocata dopo aver visto le carte: io non do pareri, nemmeno a grandi linee.", "Le passo la richiesta e, se vuole, le trovo subito un primo colloquio."],
          persona: { chi: "l'avvocata", motivo: "Domande di merito: un parere legale lo dà solo l'avvocata.",
            cosa: "riassume la richiesta in due righe per l'avvocata, senza aggiungere valutazioni." },
          poi: "colloquio" },

        { id: "scadenza", tipo: "persona", priorita: 3, domanda: "Mi è arrivato un atto con una scadenza vicina",
          re: /scadenz|\btermine\b|notific|\batto\b|ingiunzion|precett|pignor|citazion|udienz|entro (domani|pochi|\d)|urgent/,
          risposta: ["Grazie di averlo scritto subito: con le scadenze il tempo conta.", "Non le dico io cosa fare, ma passo la richiesta all'avvocata come urgente, con la scadenza in cima. La richiamano oggi.", "Intanto tenga a portata di mano l'atto e la busta in cui è arrivato."],
          persona: { chi: "l'avvocata, come urgenza", motivo: "Scadenze e atti: li valuta l'avvocata, subito.",
            cosa: "mette la richiesta in cima all'agenda dell'avvocata con la data di scadenza ben visibile." } },

        { id: "pratica", tipo: "persona", priorita: 2, domanda: "A che punto è la mia pratica?",
          re: /a che punto|pratica|novità|aggiornament|stato (della|del)|com'è andat|esito|sentenz/,
          risposta: ["Sulla sua pratica non le do aggiornamenti io: sono informazioni riservate, e le dà solo chi la segue.", "Le passo la richiesta e la richiamano entro domani."],
          persona: { chi: "l'avvocata o il collaboratore che segue la pratica", motivo: "Informazioni riservate su una pratica: solo una persona dello studio.",
            cosa: "ricorda all'avvocata di richiamare, senza aprire il fascicolo in chat." } }
      ]
    },

    /* ------------------------------------------------------------------ idraulico e artigiano */
    idraulico: {
      etichetta: "Idraulico e artigiano", profilo: "artigiano",
      attivita: "Termoidraulica «Goccia Ferma»",
      indirizzo: "Via degli Esempi 52",
      riconosci: /idraulic|termoidraul|artigian|elettricist|caldaist|muratore|impresa edile|falegnam|imbianchin|fabbro|manutenzion/,
      apertura: "Buongiorno, sono l'assistente di Goccia Ferma. Le fisso un intervento, le dico quanto costa l'uscita o la passo al tecnico. Se è un'emergenza me lo scriva subito.",
      orari: { giorni: [1, 2, 3, 4, 5, 6], fasce: ["8–10", "10–12", "14–16", "16–18"] },
      scambi: [
        { id: "caldaia", tipo: "prenota", domanda: "Devo fare la manutenzione della caldaia",
          re: /caldai|revision|manutenzion|fumi|bollin|libretto|controllo annual/,
          risposta: ["Ci pensiamo noi. La manutenzione dura circa un'ora; cosa serve per il suo impianto, controllo dei fumi compreso, glielo dice il tecnico.", "Fasce libere per l'intervento:"],
          prenota: { servizio: "Manutenzione caldaia", durata: 60, voce: "Fasce d'intervento",
            conferma: "Segnato: {giorno}, fascia {ora}, manutenzione caldaia. Mezz'ora prima il tecnico le manda un messaggio, così non deve aspettare chiuso in casa.",
            quando: "il giorno prima, alle 18",
            promemoria: "Goccia Ferma: domani, {giorno}, passiamo per la manutenzione della caldaia nella fascia {ora}. Tenga a portata di mano il libretto dell'impianto." } },

        { id: "rubinetto", tipo: "prenota", domanda: "Il rubinetto della cucina gocciola",
          re: /gocciol|rubinett|miscelator|sciacquon|scaric|intasat|lavandin|lavell|\bwc\b|water|bidet|doccia|sifon/,
          // vale per tutte le piccole riparazioni (rubinetto, sciacquone, scarico): i testi non nominano un pezzo solo
          risposta: ["Non è un'emergenza, ma un rubinetto che gocciola o uno scarico che non va peggiorano con il tempo: meglio sistemarlo presto.", "Quando il tecnico la richiama per confermare, gli mandi una foto: così porta il pezzo giusto al primo giro. Fasce libere:"],
          prenota: { servizio: "Piccola riparazione idraulica", durata: 60, voce: "Fasce d'intervento",
            conferma: "Segnato: {giorno}, fascia {ora}, piccola riparazione idraulica. Il tecnico arriva con i pezzi più comuni già nel furgone.",
            quando: "il giorno prima, alle 18",
            promemoria: "Goccia Ferma: domani, {giorno}, nella fascia {ora} passiamo per la riparazione. Mezz'ora prima il tecnico le scrive." } },

        { id: "preventivo", tipo: "prenota", priorita: 1, domanda: "Mi fate un preventivo per rifare il bagno?",
          re: /preventiv|rifare|ristruttur|bagno nuovo|sopralluog|cambiare (la |il )?(vasca|doccia|caldaia|scaldabagno)|box doccia|piatto doccia/,
          risposta: ["Volentieri. Per un preventivo serio il tecnico deve vedere il bagno: misure, tubature, cosa si può tenere.", "Il sopralluogo dura tre quarti d'ora ed è senza impegno. Fasce libere:"],
          prenota: { servizio: "Sopralluogo per il preventivo del bagno", durata: 45, voce: "Fasce d'intervento",
            conferma: "Segnato: {giorno}, fascia {ora}, sopralluogo per il bagno. Entro tre giorni le arriva il preventivo scritto, voce per voce, da rileggere con calma.",
            quando: "il giorno prima, alle 18",
            promemoria: "Goccia Ferma: domani, {giorno}, nella fascia {ora} veniamo a vedere il bagno per il preventivo. Se ha delle foto di bagni che le piacciono, le tenga pronte." } },

        { id: "costi", tipo: "info", domanda: "Quanto costa l'uscita?",
          re: /cost|prezz|uscit|diritto di chiamata|tariff|quanto (viene|si paga|prendete|chiedete)|manodopera|all'ora/,
          risposta: ["Dal listino d'esempio: uscita 35 €, poi la manodopera a ore e i pezzi a parte.", "Il tecnico le dice il totale prima di cominciare, non dopo: se non le va bene, paga solo l'uscita."] },

        { id: "zona", tipo: "info", domanda: "Venite anche di sabato? In che zona?",
          re: /sabato|domenic|festiv|\bzona\b|vicin|fuori città|paesi|comuni|orar|quando lavorate|di sera|reperibil/,
          risposta: ["Dal lunedì al sabato, dalle 8 alle 18. Domenica e festivi solo per le urgenze, con il tecnico reperibile.", "Copriamo la città e i comuni intorno, entro mezz'ora di strada."] },

        { id: "ancora", tipo: "persona", priorita: 2, domanda: "Dopo il vostro intervento perde ancora",
          re: /perde ancora|di nuovo|dopo (il|l'|il vostro) ?intervent|garanzi|reclam|non (è|e') (stato )?(risolt|sistemat)|fatto male|ancora rott|come prima/,
          risposta: ["Allora va rivisto, e senza discussioni.", "Passo la richiesta al titolare con l'intervento precedente sotto gli occhi: la richiama oggi e le fissa il ritorno del tecnico. Se nel frattempo perde molto, chiuda il rubinetto generale."],
          persona: { chi: "il titolare", motivo: "Un lavoro da rifare lo segue il titolare in persona.",
            cosa: "ritrova l'intervento precedente, con data e pezzi usati, e lo mette davanti al titolare." } },

        { id: "allagamento", tipo: "urgenza", priorita: 3, domanda: "Si è rotto un tubo, esce acqua ovunque!",
          re: /allag|esce acqua|acqua (ovunque|dappertutto|per terra|dal soffitto)|tubo (rott|scoppiat)|scoppiat|infiltraz|macchia (sul|al) soffitto|perdita (grossa|forte|enorme)/,
          risposta: ["Chiuda subito il rubinetto generale dell'acqua: di solito è vicino al contatore o sotto il lavello.", "Se l'acqua arriva a prese o elettrodomestici non li tocchi; se c'è pericolo chiami il 112.", "Intanto passo la richiesta al tecnico reperibile come urgenza: la richiama entro pochi minuti e le dice quando arriva."],
          persona: { chi: "il tecnico reperibile", motivo: "Un'urgenza la prende in mano una persona, subito.",
            cosa: "avvisa sul telefono il tecnico di turno e, se non risponde, avvisa il secondo della lista." } },

        { id: "gas", tipo: "urgenza", priorita: 4, domanda: "Sento odore di gas in cucina",
          // solo chi sente o perde gas: «la caldaia a gas» o «la bolletta del gas» non sono un'emergenza
          re: /\b(odor\w*|puzz\w*|sent\w*|fug[ah]|perdit\w*)\W+(\w+\W+){0,3}?(gas|metano)\b|\b(gas|metano)\W+(\w+\W+){0,2}?(odor|puzz|fug)|uova marce/,
          risposta: ["Non accenda e non spenga luci o fiamme, apra le finestre, esca di casa e da fuori chiami subito il 112.", "Avviso il tecnico reperibile, ma prima viene la sua sicurezza: lui interviene quando i soccorsi danno il via libera."],
          persona: { chi: "il 112 e il tecnico reperibile", motivo: "Odore di gas: prima i soccorsi, poi il tecnico.",
            cosa: "avvisa subito il tecnico di turno." } }
      ]
    },

    /* ------------------------------------------------------------------ negozio */
    negozio: {
      etichetta: "Negozio", profilo: "negozio",
      attivita: "Bottega «Filo di Seta», abbigliamento",
      indirizzo: "Via degli Esempi 9",
      riconosci: /negozi|bottega|boutique|abbigliament|commerci|merceri|scarpe|calzatur|vendo|vetrin|profumeri|libreri|ferrament|ottic/,
      apertura: "Buongiorno, sono l'assistente della bottega Filo di Seta. Le dico se un capo c'è nella sua taglia, glielo tengo da parte o le prenoto un'ora con la titolare. Mi dica.",
      orari: { giorni: [1, 2, 3, 4, 5, 6], fasce: ["10:00", "11:30", "16:00", "17:30", "18:30"] },
      scambi: [
        { id: "taglia", tipo: "prenota", domanda: "Avete la giacca blu in taglia M?",
          re: /tagli[ae]\b|in (xs|s|m|l|xl|xxl|\d\d)\b|misur|ce l'avete|c'è ancora|avete ancora|giacc|maglion|cappott|pantalon|camici|disponibil/,
          risposta: ["Dal magazzino d'esempio: la giacca blu in M c'è ancora, un pezzo solo.", "Gliela tengo da parte e le preparo il camerino. Quando passa a provarla?"],
          prenota: { servizio: "Prova della giacca blu, taglia M", dettaglio: "capo tenuto da parte", durata: 20, voce: "Quando passa",
            conferma: "Fatto: la giacca blu in M la aspetta in camerino {giorno} alle {ora}. Se non le sta come deve, nessun obbligo.",
            quando: "il giorno prima, alle 18",
            promemoria: "Filo di Seta: domani, {giorno}, alle {ora} la giacca blu in M la aspetta in camerino. Se non riesce a passare risponda qui: la teniamo un giorno in più." } },

        { id: "cerimonia", tipo: "prenota", domanda: "Posso prenotare una consulenza per un abito da cerimonia?",
          re: /cerimoni|matrimoni|sposa|testimon|\babito\b|vestito|consulenz|appuntament|prenot|un'ora/,
          risposta: ["Molto volentieri. Per una cerimonia è meglio un'ora tutta per lei, con il negozio tranquillo: la titolare prepara prima una selezione nella sua taglia.", "Questi sono gli orari più calmi della settimana:"],
          prenota: { servizio: "Consulenza abito da cerimonia", durata: 60, fasce: ["10:00", "11:30", "15:30"],
            conferma: "Segnato: {giorno} alle {ora}, un'ora di consulenza con la titolare. Se ha una foto dell'idea che ha in mente, la porti: aiuta più di cento parole.",
            quando: "il giorno prima, alle 18",
            promemoria: "Filo di Seta: domani, {giorno}, alle {ora} la aspettiamo per l'abito da cerimonia. Un'ora tutta per lei." } },

        { id: "orari", tipo: "info", domanda: "Siete aperti la domenica?",
          re: /domenic|orar|aperti|apert[oe]\b|chius|pausa pranzo|festiv|luned[iì]|dove siete|indirizz/,
          risposta: ["La domenica no. Dal lunedì al sabato siamo aperti dalle 9:30 alle 13 e dalle 15:30 alle 19:30.","A dicembre si aggiungono le domeniche prima di Natale: gli orari escono sulla pagina del negozio due settimane prima."] },

        { id: "cambio", tipo: "info", domanda: "Posso cambiare un regalo?",
          re: /^(?!.*\b(orario|appuntament|consulenz|giorno)).*(cambi(are|o)|\breso\b|restitu|rendere|scontrino|non mi (va|sta)|taglia sbagliat|regalat)/,
          risposta: ["Certo: il cambio si fa entro 30 giorni con lo scontrino, anche quello di cortesia che diamo con i regali.", "Il capo deve avere ancora il cartellino. Se la taglia giusta non c'è, gliela ordiniamo noi."] },

        { id: "spedizione", tipo: "info", domanda: "Spedite anche fuori città?",
          re: /sped|consegn|corriere|a casa|online|\bsito\b|ordinar|fuori città/,
          risposta: ["Sì, in tutta Italia: si sceglie il capo per messaggio, si paga con un collegamento di pagamento e il corriere arriva in due o tre giorni lavorativi.", "Il costo della spedizione glielo diciamo prima che paghi, mai dopo."] },

        { id: "buono", tipo: "info", domanda: "Fate buoni regalo?",
          re: /buon[oi]|carta regal|gift|idea regalo/,
          risposta: ["Sì, dell'importo che preferisce, validi un anno.", "Si fanno in negozio in un minuto, già impacchettati con il nastro della bottega."] },

        { id: "difetto", tipo: "persona", priorita: 2, domanda: "Il maglione si è rovinato al primo lavaggio",
          re: /rovinat|difett|scucit|bucat|rott[oa]|stint|ristrett|rimbors|soldi indietro|reclam|garanzi|infeltrit/,
          risposta: ["Mi dispiace, non dovrebbe succedere.", "Un difetto lo deve vedere la titolare, non una risposta automatica: le passo la richiesta, la richiama e le dice quando portare il capo. Tenga lo scontrino."],
          persona: { chi: "la titolare", motivo: "Difetti e rimborsi: li valuta la titolare guardando il capo, mai una risposta automatica.",
            cosa: "mette la richiesta in cima, con la data d'acquisto se il cliente la indica." } },

        { id: "sconto", tipo: "persona", priorita: 2, domanda: "Mi fate uno sconto se ne prendo due?",
          re: /scont(?!rin)|\bsaldi\b|promozion|prezzo (migliore|speciale)|due per|meno car|trattar/,
          risposta: ["Sugli sconti decide solo la titolare: non le prometto una cifra che poi non potrei mantenere.", "Le passo la domanda e le risponde lei, di solito entro la giornata."],
          persona: { chi: "la titolare", motivo: "Prezzi e sconti: li decide la titolare, Jarvis non promette cifre.",
            cosa: "segnala alla titolare i capi e la richiesta, pronta per una risposta veloce." } }
      ]
    }
  }
};
