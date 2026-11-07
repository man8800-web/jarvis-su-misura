// Il nucleo di Jarvis e tutto quello che gli gira intorno:
// sfera viva, alone, guscio di particelle (che diventa la forma del mestiere),
// anelli dei sensi e della squadra, filo della giornata, scudo dei dati.
import * as S from './shader.js';

const COLORI_SENSI = ['#88e3e8', '#e8c98b', '#9cdbb7', '#ff9cc6', '#b8adff'];

export function creaNucleo(T, Q) {
  const gruppo = new T.Group();
  const colore = new T.Color('#88e3e8');
  const colore2 = new T.Color('#8f7bff');
  const u = {
    uT: { value: 0 }, uAgita: { value: 0 }, uForza: { value: 0 }, uAudio: { value: 0 }, uLuce: { value: 1 },
    uTocco: { value: new T.Vector3(0, 0, 1) }, uColore: { value: colore }, uColore2: { value: colore2 }, uCamLoc: { value: new T.Vector3(0, 0, 8) }
  };

  /* filamenti e cuore: la mesh è solo il contenitore dei raggi. Copre in parte quello che ha dietro (vapore scuro) */
  const matSfera = new T.ShaderMaterial({
    uniforms: u, vertexShader: S.NUCLEO_V, fragmentShader: S.NUCLEO_F, defines: { PASSI: Q.passi }, extensions: { derivatives: true },
    transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide,
    blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor,
    blendSrcAlpha: T.OneFactor, blendDstAlpha: T.OneMinusSrcAlphaFactor
  });
  const sfera = new T.Mesh(new T.IcosahedronGeometry(1.56, 3), matSfera);
  sfera.frustumCulled = false; sfera.renderOrder = 3;
  gruppo.add(sfera);

  /* alone */
  const uAlone = { uScala: { value: 3.2 }, uColore: { value: colore }, uForza: { value: .5 } };
  const alone = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
    uniforms: uAlone, vertexShader: S.ALONE_V, fragmentShader: S.ALONE_F,
    transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending
  }));
  alone.frustumCulled = false; alone.renderOrder = 2;
  gruppo.add(alone);

  /* guscio di particelle */
  const NG = Q.guscio;
  const gp = new Float32Array(NG * 3), gf = new Float32Array(NG * 3), gs = new Float32Array(NG);
  for (let i = 0; i < NG; i++) {
    const v = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 1.32 + Math.pow(Math.random(), 3) * .7;
    const s = Math.sqrt(1 - v * v);
    gp.set([Math.cos(a) * s * r, v * r, Math.sin(a) * s * r], i * 3);
    gs[i] = Math.random();
  }
  const gGuscio = new T.BufferGeometry();
  gGuscio.setAttribute('position', new T.BufferAttribute(gp, 3));
  gGuscio.setAttribute('aForma', new T.BufferAttribute(gf, 3));
  gGuscio.setAttribute('aSeme', new T.BufferAttribute(gs, 1));
  const uGuscio = { uT: u.uT, uMorph: { value: 0 }, uPx: { value: 1 }, uAgita: u.uAgita, uAudio: u.uAudio, uTiro: { value: 0 }, uPunta: { value: new T.Vector3() }, uColore: { value: colore }, uForza: { value: .9 } };
  const guscio = new T.Points(gGuscio, new T.ShaderMaterial({
    uniforms: uGuscio, vertexShader: S.GUSCIO_V, fragmentShader: S.PUNTO_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  guscio.frustumCulled = false; guscio.renderOrder = 4;
  gruppo.add(guscio);

  // punti della forma: arrivano da sito.js (stesse forme del canvas 2D), in 3D con un po' di spessore
  function impostaForma(punti) {
    if (!punti || !punti.length) return;
    for (let i = 0; i < NG; i++) {
      const p = punti[i % punti.length], prof = (Math.random() - .5) * .22;
      gf.set([p[0] * 1.55 + (Math.random() - .5) * .025, -p[1] * 1.55 + (Math.random() - .5) * .025, prof], i * 3);
    }
    gGuscio.attributes.aForma.needsUpdate = true;
  }

  /* anelli: cinque orbite, una per senso (e per la squadra) */
  const NA = Math.round(Q.guscio * .9), aAng = new Float32Array(NA), aR = new Float32Array(NA), aIdx = new Float32Array(NA),
    aTilt = new Float32Array(NA * 2), aCol = new Float32Array(NA * 3), pos0 = new Float32Array(NA * 3);
  const tilt = [[.25, .1], [-.5, .35], [.9, -.2], [-1.1, -.5], [1.35, .6]];
  const c = new T.Color();
  for (let i = 0; i < NA; i++) {
    const k = i % 5;
    aIdx[i] = k; aAng[i] = Math.random() * Math.PI * 2; aR[i] = 2.1 + k * .34 + (Math.random() - .5) * .05;
    aTilt.set(tilt[k], i * 2); c.set(COLORI_SENSI[k]); aCol.set([c.r, c.g, c.b], i * 3);
  }
  const gAnelli = new T.BufferGeometry();
  gAnelli.setAttribute('position', new T.BufferAttribute(pos0, 3));
  gAnelli.setAttribute('aAng', new T.BufferAttribute(aAng, 1));
  gAnelli.setAttribute('aRaggio', new T.BufferAttribute(aR, 1));
  gAnelli.setAttribute('aAnello', new T.BufferAttribute(aIdx, 1));
  gAnelli.setAttribute('aTilt', new T.BufferAttribute(aTilt, 2));
  gAnelli.setAttribute('aColore', new T.BufferAttribute(aCol, 3));
  const uAnelli = { uT: u.uT, uPx: uGuscio.uPx, uEvid: { value: -1 }, uForza: { value: 0 } };
  const anelli = new T.Points(gAnelli, new T.ShaderMaterial({
    uniforms: uAnelli, vertexShader: S.ANELLI_V, fragmentShader: S.ANELLI_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  anelli.frustumCulled = false; anelli.renderOrder = 4;
  gruppo.add(anelli);

  /* filo della giornata */
  const NF = 900, fu = new Float32Array(NF);
  for (let i = 0; i < NF; i++) fu[i] = i / NF;
  const gFilo = new T.BufferGeometry();
  gFilo.setAttribute('position', new T.BufferAttribute(new Float32Array(NF * 3), 3));
  gFilo.setAttribute('aU', new T.BufferAttribute(fu, 1));
  const uFilo = { uT: u.uT, uPx: uGuscio.uPx, uProg: { value: 0 }, uColore: { value: colore }, uForza: { value: 0 } };
  const filo = new T.Points(gFilo, new T.ShaderMaterial({
    uniforms: uFilo, vertexShader: S.FILO_V, fragmentShader: S.PUNTO_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  filo.frustumCulled = false; filo.renderOrder = 4;
  gruppo.add(filo);

  /* scudo */
  const uScudo = { uT: u.uT, uForza: { value: 0 }, uColore: { value: new T.Color('#9cdbb7') } };
  const scudo = new T.Mesh(new T.SphereGeometry(2.35, 48, 32), new T.ShaderMaterial({
    uniforms: uScudo, vertexShader: S.SCUDO_V, fragmentShader: S.SCUDO_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide
  }));
  scudo.frustumCulled = false; scudo.renderOrder = 5;
  gruppo.add(scudo);

  // meno strati = meno lavoro per la scheda grafica
  function impostaPassi(n) {
    if (matSfera.defines.PASSI === n) return;
    matSfera.defines.PASSI = n; matSfera.needsUpdate = true;
  }

  return {
    gruppo, sfera, u, uAlone, uGuscio, uAnelli, uFilo, uScudo, colore,
    impostaForma, impostaPassi,
    // nasconde ciò che non serve: meno lavoro per la scheda grafica
    visibilita() {
      guscio.visible = uGuscio.uForza.value > .01;
      anelli.visible = uAnelli.uForza.value > .01;
      filo.visible = uFilo.uForza.value > .01;
      scudo.visible = uScudo.uForza.value > .01;
      sfera.visible = alone.visible = sfera.scale.x > .02;
    }
  };
}
