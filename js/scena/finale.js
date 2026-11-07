// L'immagine finale, scritta a mano: la scena in un buffer ad alta gamma, un bagliore su più scale
// (scende e risale dimezzando), poi aberrazione, chiusura morbida delle luci e grana.
// Un solo triangolo a schermo intero per ogni passaggio. Ai livelli bassi non si usa affatto.
import * as S from './shader.js';

const SCALE = 5;

export function creaFinale(T, rend) {
  const hdr = rend.capabilities.isWebGL2 && (rend.extensions.has('EXT_color_buffer_float') || rend.extensions.has('EXT_color_buffer_half_float'));
  const opz = { type: hdr ? T.HalfFloatType : T.UnsignedByteType, format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false, stencilBuffer: false };
  const nuovo = () => new T.WebGLRenderTarget(4, 4, opz);
  const rtScena = nuovo(), giu = [], su = [];
  for (let i = 0; i < SCALE; i++) { giu.push(nuovo()); if (i < SCALE - 1) su.push(nuovo()); }

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const mat = (fragmentShader, uniforms) => new T.ShaderMaterial({ vertexShader: S.PIENO_V, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const mGiu = mat(S.GIU_F, { uTex: { value: null }, uPasso: { value: new T.Vector2() }, uSoglia: { value: 0 } });
  const mSu = mat(S.SU_F, { uTex: { value: null }, uBase: { value: null }, uPasso: { value: new T.Vector2() } });
  const mFine = mat(S.FINALE_F, { uScena: { value: rtScena.texture }, uAlone: { value: null }, uT: { value: 0 }, uBagliore: { value: .44 }, uRis: { value: new T.Vector2(1, 1) } });
  const tri = new T.Mesh(geo, mGiu);
  tri.frustumCulled = false;
  const sc = new T.Scene(); sc.add(tri);
  const camFinta = new T.Camera();

  function passa(m, dest) {
    tri.material = m;
    rend.setRenderTarget(dest);
    rend.render(sc, camFinta);
  }
  const dim = new T.Vector2();
  return {
    misura() {
      rend.getDrawingBufferSize(dim);
      const w = dim.x, h = dim.y;
      rtScena.setSize(w, h);
      mFine.uniforms.uRis.value.set(w, h);
      for (let i = 0; i < SCALE; i++) {
        const k = 2 << i;
        giu[i].setSize(Math.max(2, w / k | 0), Math.max(2, h / k | 0));
        if (i < SCALE - 1) su[i].setSize(Math.max(2, w / k | 0), Math.max(2, h / k | 0));
      }
    },
    disegna(r, scena, cam, t) {
      r.setRenderTarget(rtScena);
      r.render(scena, cam);
      let sorgente = rtScena.texture;
      for (let i = 0; i < SCALE; i++) {
        mGiu.uniforms.uTex.value = sorgente;
        mGiu.uniforms.uPasso.value.set(1 / giu[i].width, 1 / giu[i].height);
        mGiu.uniforms.uSoglia.value = i === 0 ? .85 : 0;      // solo le luci vere fanno bagliore
        passa(mGiu, giu[i]);
        sorgente = giu[i].texture;
      }
      for (let i = SCALE - 2; i >= 0; i--) {
        mSu.uniforms.uTex.value = sorgente;
        mSu.uniforms.uBase.value = giu[i].texture;
        mSu.uniforms.uPasso.value.set(.5 / su[i].width, .5 / su[i].height);
        passa(mSu, su[i]);
        sorgente = su[i].texture;
      }
      mFine.uniforms.uAlone.value = sorgente;
      mFine.uniforms.uT.value = t;
      passa(mFine, null);
    },
    libera() {
      [rtScena, ...giu, ...su].forEach(x => x.dispose());
      [mGiu, mSu, mFine].forEach(m => m.dispose());
      geo.dispose();
    }
  };
}
