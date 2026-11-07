// La galassia dentro la scena (non più uno sfondo): il nucleo è il suo cuore luminoso.
// Bracci a spirale con rotazione differenziale calcolata nel vertex shader, nebulose come punti morbidi,
// e il cielo lontano. Le stelle nascono in ordine casuale: abbassando la qualità basta disegnarne meno.
import * as S from './shader.js';

export const RAGGIO = 34;

export function creaGalassia(T, Q) {
  const gruppo = new T.Group();
  const N = Q.stelle, NEB = 90, TOT = N + NEB;
  const r = new Float32Array(TOT), ang = new Float32Array(TOT), alt = new Float32Array(TOT), dim = new Float32Array(TOT),
    fase = new Float32Array(TOT), tipo = new Float32Array(TOT), col = new Float32Array(TOT * 3);
  const c = new T.Color(), bianco = new T.Color('#ffffff'), azzurro = new T.Color('#bdeff2');
  const palette = [['#88e3e8', .48], ['#b8adff', .24], ['#e8c98b', .12], ['#ff9cc6', .08], ['#9cdbb7', .08]];
  const scegli = () => { let x = Math.random(); for (const [h, p] of palette) { if ((x -= p) < 0) return h; } return '#88e3e8'; };
  const BRACCI = 4;
  for (let i = 0; i < N; i++) {
    if (Math.random() < .14) {                                 // rigonfiamento centrale intorno al nucleo
      const d = 1.6 + Math.pow(Math.random(), 2) * 6.5;
      r[i] = d; ang[i] = Math.random() * Math.PI * 2; alt[i] = (Math.random() - .5) * 2 * (2.6 - d * .25) * Math.random();
      c.copy(bianco).lerp(azzurro, Math.random() * .7);
      dim[i] = .7 + Math.random() * 1.6;
    } else {
      const d = Math.pow(Math.random(), 1.3) * RAGGIO + 2.2, b = Math.floor(Math.random() * BRACCI);
      const sparso = (Math.random() - .5) * (1.1 + d * .1) * Math.pow(Math.random(), .6);
      r[i] = d + (Math.random() - .5) * 1.2;
      ang[i] = b / BRACCI * Math.PI * 2 + d * .21 + sparso * .16;
      alt[i] = (Math.random() - .5) * (1.6 - d / RAGGIO) * Math.pow(Math.random(), 2) * 1.6;
      c.set(scegli()).lerp(bianco, Math.max(0, .45 - d / RAGGIO));
      dim[i] = .45 + Math.pow(Math.random(), 3) * 2.6;
    }
    fase[i] = Math.random() * 6.283;
    col.set([c.r, c.g, c.b], i * 3);
  }
  for (let k = 0; k < NEB; k++) {                              // nebulose: pochi punti grandi e tenui lungo i bracci
    const i = N + k, d = 4 + Math.random() * (RAGGIO - 6), b = k % BRACCI;
    r[i] = d; ang[i] = b / BRACCI * Math.PI * 2 + d * .21 + (Math.random() - .5) * .3; alt[i] = (Math.random() - .5) * .4;
    dim[i] = 14 + Math.random() * 22; fase[i] = Math.random() * 6.283; tipo[i] = 1;
    c.set(scegli()); col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(TOT * 3), 3));
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  geo.setAttribute('aRaggio', new T.BufferAttribute(r, 1));
  geo.setAttribute('aAng', new T.BufferAttribute(ang, 1));
  geo.setAttribute('aAlt', new T.BufferAttribute(alt, 1));
  geo.setAttribute('aDim', new T.BufferAttribute(dim, 1));
  geo.setAttribute('aFase', new T.BufferAttribute(fase, 1));
  geo.setAttribute('aTipo', new T.BufferAttribute(tipo, 1));
  const u = { uT: { value: 0 }, uPx: { value: 1 }, uAudio: { value: 0 }, uTorsione: { value: 1 }, uForza: { value: .4 } };
  const stelle = new T.Points(geo, new T.ShaderMaterial({
    uniforms: u, vertexShader: S.GALASSIA_V, fragmentShader: S.GALASSIA_F, vertexColors: true,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  stelle.frustumCulled = false; stelle.renderOrder = 1;
  gruppo.add(stelle);

  /* disco: la luce diffusa e la polvere tra le stelle */
  const uDisco = { uT: u.uT, uForza: { value: 0 }, uR: { value: RAGGIO } };
  const disco = new T.Mesh(new T.PlaneGeometry(RAGGIO * 2.7, RAGGIO * 2.7), new T.ShaderMaterial({
    uniforms: uDisco, vertexShader: S.DISCO_V, fragmentShader: S.DISCO_F, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending
  }));
  disco.rotation.x = -Math.PI / 2; disco.frustumCulled = false; disco.renderOrder = 0;
  gruppo.add(disco);

  /* cielo lontano */
  const M = Q.cielo, cp = new Float32Array(M * 3), cf = new Float32Array(M);
  for (let i = 0; i < M; i++) {
    const v = Math.random() * 2 - 1, a = Math.random() * 6.283, R = 260 + Math.random() * 80, s = Math.sqrt(1 - v * v);
    cp.set([s * Math.cos(a) * R, v * R, s * Math.sin(a) * R], i * 3); cf[i] = Math.random();
  }
  const cg = new T.BufferGeometry();
  cg.setAttribute('position', new T.BufferAttribute(cp, 3));
  cg.setAttribute('aFase', new T.BufferAttribute(cf, 1));
  const uCielo = { uT: u.uT, uPx: u.uPx, uForza: { value: .8 } };
  const cielo = new T.Points(cg, new T.ShaderMaterial({
    uniforms: uCielo, vertexShader: S.CIELO_V, fragmentShader: S.CIELO_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  cielo.frustumCulled = false;

  return {
    gruppo, cielo, u, uCielo, uDisco,
    // a qualità più bassa si disegna solo una parte delle stelle (sono già in ordine casuale)
    // a piena densità si disegnano anche le nebulose (stanno in fondo al buffer)
    densita(frazione) { geo.setDrawRange(0, frazione >= 1 ? TOT : Math.round(N * frazione)); }
  };
}
