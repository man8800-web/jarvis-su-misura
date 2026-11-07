// La plancia: sotto il piano della galassia, un pavimento a griglia infinita
// con le onde che partono dal nucleo quando Jarvis «parla» o si scrive.
import * as S from './shader.js';

export const QUOTA = -13;   // altezza del pavimento

export function creaPlancia(T, Q) {
  const u = {
    uT: { value: 0 }, uForza: { value: 0 }, uOnda: { value: 0 },
    uColore: { value: new T.Color('#88e3e8') }, uCentro: { value: new T.Vector3(0, QUOTA, 0) }
  };
  const mat = new T.ShaderMaterial({
    uniforms: u, vertexShader: S.GRIGLIA_V, fragmentShader: S.GRIGLIA_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    extensions: { derivatives: true }
  });
  const piano = new T.Mesh(new T.PlaneGeometry(520, 520, 1, 1), mat);
  piano.rotation.x = -Math.PI / 2;
  piano.position.y = QUOTA;
  piano.frustumCulled = false;

  /* torri di luce intorno al nucleo: un solo disegno, molte istanze; il centro resta libero */
  const box = new T.BoxGeometry(1, 1, 1);
  const geo = new T.InstancedBufferGeometry();
  geo.index = box.index; geo.setAttribute('position', box.attributes.position);
  const dove = new Float32Array(Q.torri * 3);
  for (let i = 0; i < Q.torri; i++) {
    const a = Math.random() * Math.PI * 2, r = 7 + Math.pow(Math.random(), .7) * 62;
    dove.set([Math.round(Math.cos(a) * r / 2) * 2, Math.round(Math.sin(a) * r / 2) * 2, Math.random()], i * 3);
  }
  geo.setAttribute('aDove', new T.InstancedBufferAttribute(dove, 3));
  geo.instanceCount = Q.torri;
  const uTorri = { uT: u.uT, uOnda: u.uOnda, uColore: u.uColore, uForza: { value: 0 }, uBase: { value: QUOTA } };
  const torri = new T.Mesh(geo, new T.ShaderMaterial({
    uniforms: uTorri, vertexShader: S.TORRI_V, fragmentShader: S.TORRI_F,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending
  }));
  torri.frustumCulled = false; torri.renderOrder = 1;
  return { piano, torri, u, uTorri };
}
