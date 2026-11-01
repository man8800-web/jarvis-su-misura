// ============================================================
//  UNICO PUNTO DI CONFIGURAZIONE DEL SITO
//  Qui si inseriscono i valori da compilare prima di andare online.
//  Niente segreti: l'indirizzo del web app di Apps Script è pubblico per natura
//  (chi apre il sito lo vede), per questo il foglio non va mai condiviso con altri.
// ============================================================
window.JARVIS_CONFIG = {
  // Indirizzo del web app di Google Apps Script (finisce con /exec).
  // Lasciato vuoto: il modulo mostra un avviso onesto e NON finge di inviare.
  // Istruzioni: apps-script/LEGGIMI.md
  moduloUrl: '',

  // Email del titolare, mostrata nell'informativa e nella pagina privacy.
  // Vuota: resta visibile il segnaposto [EMAIL DEL TITOLARE DA INSERIRE].
  emailTitolare: 'info@jarvissumisura.com',

  // Ragione sociale / P.IVA mostrata nel piede. Vuota: resta il segnaposto.
  datiSocieta: '',

  // Numero WhatsApp con prefisso, solo cifre (es. 39333xxxxxxx). Vuoto: il pulsante non compare.
  whatsappNumero: '',

  // Versione dell'informativa, salvata accanto alla richiesta come prova del consenso.
  versioneInformativa: '2026-11-01',

  // File multimediali opzionali (percorso relativo, es. 'media/video-apertura.mp4').
  // null = non c'è ancora: il sito mostra lo spazio d'attesa e non cerca file inesistenti.
  media: {
    video: null,      // video di apertura (senza foto di persone)
    voce: null,       // campione della voce di Jarvis (mp3)
    commento: null    // commento a voce per la modalità galassia (mp3)
  }
};
