// Avvio progressivo della scena 3D. La pagina si legge subito sopra lo sfondo di riserva;
// la scena (Three.js locale + shader) si carica solo dopo il primo disegno, in un momento libero.
// Senza WebGL resta il ripiego: un poster per atto (nucleo, galassia, plancia) che segue le sezioni.
(function () {
  'use strict';
  var corpo = document.body;

  /* atto della sezione al centro dello schermo: guida i poster di riserva */
  var sezioni = document.querySelectorAll('main > section[data-atto]');
  if (sezioni.length) corpo.setAttribute('data-atto', sezioni[0].getAttribute('data-atto'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) { if (v.isIntersecting) corpo.setAttribute('data-atto', v.target.getAttribute('data-atto')); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    for (var i = 0; i < sezioni.length; i++) io.observe(sezioni[i]);
  }

  /* c'è WebGL? (il contesto di prova si rilascia subito) */
  function haWebGL() {
    try {
      var c = document.createElement('canvas');
      var g = c.getContext('webgl2') || c.getContext('webgl');
      if (!g) return false;
      var perdi = g.getExtension('WEBGL_lose_context'); if (perdi) perdi.loseContext();
      return true;
    } catch (e) { return false; }
  }
  var forzaRipiego = /[?&]3d=0\b/.test(location.search);
  if (forzaRipiego || !('noModule' in HTMLScriptElement.prototype)) { corpo.classList.add('senza-3d'); return; }

  function parti() {
    if (!haWebGL()) { corpo.classList.add('senza-3d'); return; }   // la prova costa: solo dopo che il testo è a schermo
    var s = document.createElement('script');
    s.type = 'module';
    s.src = 'js/scena/scena.js';
    s.onerror = function () { corpo.classList.add('senza-3d'); };
    document.head.appendChild(s);
  }
  function dopoIlPrimoDisegno() {
    requestAnimationFrame(function () {
      if ('requestIdleCallback' in window) requestIdleCallback(parti, { timeout: 900 });
      else setTimeout(parti, 120);
    });
  }
  if (document.readyState === 'complete') dopoIlPrimoDisegno();
  else addEventListener('load', dopoIlPrimoDisegno);
})();
