// Shader scritti a mano per la scena di Jarvis. Niente texture, niente modelli: tutto procedurale.
// Regola della casa (lezione del 17/10): con tanti punti additivi la luce si somma, si parte bassi.

// Rumore simplex 3D (Ashima Arts / Stefan Gustavson, licenza MIT), riscritto compatto.
export const RUMORE = /* glsl */`
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permuta(vec4 x){return m289(((x*34.)+10.)*x);}
vec4 invSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float rumore(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=m289(i);
  vec4 p=permuta(permuta(permuta(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 nr=invSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=nr.x; p1*=nr.y; p2*=nr.z; p3*=nr.w;
  vec4 m=max(.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 105.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/* ---------- nucleo: filamenti di luce su gusci concentrici, cuore e pelle calcolati in forma esatta ----------
   La mesh è solo un contenitore: per ogni pixel si intersecano le sfere del nucleo (davanti e dietro)
   e su ogni sfera si disegnano filamenti netti con un rumore a giroide. Pochi strati, resta tagliente
   a qualunque distanza e costa poco. Funziona anche con la camera dentro: è il tuffo dello scorrimento. */
export const NUCLEO_V = /* glsl */`
varying vec3 vLoc;
void main(){
  vLoc = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`;
export const NUCLEO_F = /* glsl */`
uniform float uT, uAgita, uForza, uAudio, uLuce;
uniform vec3 uCamLoc, uTocco, uColore, uColore2;
varying vec3 vLoc;
float gy(vec3 p){ return dot(sin(p), cos(p.zxy)); }
vec3 vel3;
float vel, dentro;
// filamenti su un punto di un guscio: linee sottili dove il campo passa per lo zero
float filamenti(vec3 p, float scala){
  vec3 w = p*scala + vel3;
  w += (.62 + uAgita*.5)*sin(w.yzx*1.3 + vel*.35);
  float a = gy(w), b = gy(w*2.3 + a + vel*.2);
  float f = abs(a + .32*b);
  float largo = fwidth(f)*1.2 + .03*(1. - dentro*.72);    // da vicino le linee restano sottili
  return smoothstep(largo*2.4, 0., f) + (.13 - dentro*.1)*smoothstep(.62, 0., f);
}
void main(){
  vec3 ro = uCamLoc, rd = normalize(vLoc - ro);
  float b = dot(ro, rd), c0 = dot(ro, ro);
  vec3 cp = ro - rd*b;                                   // il punto del raggio più vicino al centro
  float d = length(cp);
  if (d > 1.5) discard;
  vel = uT*(.3 + uAgita*.45);
  vel3 = vec3(0., vel*.55, vel*.3);
  vec3 dirz = cp/max(d, .001);
  vec3 tq = dirz - uTocco;
  float gonfia = uForza*exp(-dot(tq, tq)*3.2);
  float pelle = 1. + .05*gy(dirz*2.4 + vel*.5) + .016*gy(dirz*7. - vel) + uAudio*.13 + uAgita*.05 + gonfia*.16;
  dentro = smoothstep(1.05, .8, sqrt(c0));               // la camera è entrata nel nucleo
  float davanti = step(0., -b + 1.5);                    // niente da vedere se il nucleo è alle spalle
  vec3 caldo = mix(uColore, vec3(1.), .42);
  vec3 acc = vec3(0.);
  // gli strati, dall'esterno al centro e poi di nuovo fuori (la parte dietro, più fioca e più viola)
  for (int i = 0; i < PASSI; i++){
    if (dentro > .5 && i > 0 && i < PASSI - 1 && mod(float(i), 2.) > .5) continue;   // da dentro riempie lo schermo: si risparmia
    float k = float(i)/float(PASSI - 1);
    float r = pelle*mix(.97, .34, k);
    float h = b*b - c0 + r*r;
    if (h <= 0.) continue;
    h = sqrt(h);
    float bordo = smoothstep(0., .34, h/r);
    float scala = 2.9 + k*2.6;
    vec3 tinta = mix(uColore, uColore2, k*.7);
    float tA = -b - h, tB = -b + h;
    if (tA > 0.){
      vec3 p = ro + rd*tA; vec3 q = p - uTocco*gonfia*.3;
      vec3 to = p/r - uTocco;
      float t = uForza*exp(-dot(to, to)*5.);
      acc += tinta*filamenti(q, scala)*bordo*(.78 - k*.28)*(1. + t*3.6 + uAudio*2.);
    }
    if (tB > 0.){
      vec3 p = ro + rd*tB;
      acc += mix(tinta, uColore2, .6)*filamenti(p, scala + .7)*bordo*(.3 - k*.08)*(1. + uAudio*1.2);
    }
  }
  // il cuore: esatto lungo il raggio, tenue quando ci sei dentro
  float cuore = exp(-d*d*30.)*1.5 + exp(-d*d*4.)*.17;
  acc += caldo*cuore*(1. + uAudio*1.5)*(1. - dentro*.82)*davanti;
  // la pelle: sottile e tagliente, poi un velo appena fuori
  float fuori = max(d - pelle, 0.);
  acc += mix(uColore, vec3(1.), .25)*(exp(-abs(d - pelle)*42.)*.95 + exp(-fuori*8.)*step(pelle, d)*.2)*(1. + gonfia*2.)*(1. - dentro)*davanti;
  // il corpo copre le stelle dietro: vapore scuro, non una palla piena
  float copre = smoothstep(pelle + .012, pelle - .04, d)*.86*(1. - dentro);
  gl_FragColor = vec4(acc*uLuce, copre);
}`;

/* ---------- alone del nucleo (quadrato che guarda sempre la camera) ---------- */
export const ALONE_V = /* glsl */`
uniform float uScala; varying vec2 vUv;
void main(){
  vUv = position.xy;
  vec4 centro = modelViewMatrix * vec4(0.,0.,0.,1.);
  centro.xy += position.xy * uScala;
  gl_Position = projectionMatrix * centro;
}`;
export const ALONE_F = /* glsl */`
uniform vec3 uColore; uniform float uForza; varying vec2 vUv;
void main(){
  float d = length(vUv);
  float a = exp(-d*d*3.2)*.55 + exp(-d*7.)*.25;
  a *= smoothstep(1., .55, d);
  gl_FragColor = vec4(uColore * a * uForza, 1.);
}`;

/* ---------- guscio di particelle (diventa la forma del mestiere) ---------- */
export const GUSCIO_V = /* glsl */`
attribute vec3 aForma; attribute float aSeme;
uniform float uT, uMorph, uPx, uAgita, uAudio, uTiro;
uniform vec3 uPunta;
varying float vA;
${RUMORE}
mat2 gira(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
void main(){
  vec3 p = position;
  p.xz = gira(uT*(.07 + aSeme*.05)) * p.xz;
  p += .06*vec3(sin(uT*.9+aSeme*40.), cos(uT*.7+aSeme*31.), sin(uT*.8+aSeme*17.)) * (1. + uAgita*2.);
  p *= 1. + uAudio*.25;
  vec3 dp = uPunta - p; p += dp*uTiro*.42*exp(-dot(dp, dp)*.9);      // le particelle cercano il dito
  vec3 f = aForma;
  f.xy += .012*vec2(sin(uT*2.+aSeme*60.), cos(uT*1.7+aSeme*45.));
  float k = smoothstep(0., 1., clamp(uMorph*1.25 - aSeme*.25, 0., 1.));
  vec3 q = mix(p, f, k);
  vec4 mv = modelViewMatrix * vec4(q, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((1.8 + k*2.) * uPx * 6.5 / -mv.z, 1., 24.*uPx);
  vA = .45 + .55*fract(aSeme*13.7 + uT*.15);
}`;
export const PUNTO_F = /* glsl */`
uniform vec3 uColore; uniform float uForza; varying float vA;
void main(){
  vec2 p = gl_PointCoord - .5; float d = length(p); if (d > .5) discard;
  float a = smoothstep(.5, 0., d); a *= a;
  gl_FragColor = vec4(uColore * a * vA * uForza, 1.);
}`;

/* ---------- anelli: i sensi e la squadra in orbita ---------- */
export const ANELLI_V = /* glsl */`
attribute float aAng, aRaggio, aAnello; attribute vec2 aTilt; attribute vec3 aColore;
uniform float uT, uPx, uEvid;
varying vec3 vC; varying float vA;
void main(){
  float a = aAng + uT*(.12 + aAnello*.035)*(mod(aAnello,2.)*2.-1.);
  vec3 p = vec3(cos(a)*aRaggio, 0., sin(a)*aRaggio);
  float cx = cos(aTilt.x), sx = sin(aTilt.x), cz = cos(aTilt.y), sz = sin(aTilt.y);
  p = vec3(p.x, p.y*cx - p.z*sx, p.y*sx + p.z*cx);
  p = vec3(p.x*cz - p.y*sz, p.x*sz + p.y*cz, p.z);
  float evid = 1. - step(.5, abs(aAnello - uEvid));
  float scia = pow(fract(aAng/6.2831853*3. - uT*.08), 6.);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((1.2 + scia*2.2 + evid*1.4) * uPx * 7. / -mv.z, 1., 22.*uPx);
  vC = aColore; vA = (.25 + scia*.9) * (uEvid < -.5 ? 1. : .45 + evid*1.1);
}`;
export const ANELLI_F = /* glsl */`
uniform float uForza; varying vec3 vC; varying float vA;
void main(){
  vec2 p = gl_PointCoord - .5; float d = length(p); if (d > .5) discard;
  float a = smoothstep(.5, 0., d); a *= a;
  gl_FragColor = vec4(vC * a * vA * uForza, 1.);
}`;

/* ---------- filo della giornata: una linea di luce che scende dal nucleo ---------- */
export const FILO_V = /* glsl */`
attribute float aU; uniform float uT, uPx, uProg;
varying float vA;
void main(){
  vec3 p = vec3(sin(aU*40. + uT)*.02, -aU*46. - 1.3, 0.);
  float acceso = smoothstep(uProg + .02, uProg - .02, aU);
  float impulso = pow(fract(aU*6. - uT*.35), 14.) * acceso;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp((1.4 + impulso*2.5) * uPx * 9. / -mv.z, 1., 18.*uPx);
  vA = .07 + acceso*.5 + impulso*.9;
}`;

/* ---------- galassia: bracci con rotazione differenziale nel vertex shader ---------- */
export const GALASSIA_V = /* glsl */`
attribute float aRaggio, aAng, aAlt, aDim, aFase, aTipo;
uniform float uT, uPx, uAudio, uTorsione;
varying vec3 vC; varying float vB, vTipo, vVicino;
void main(){
  float r = aRaggio;
  // il centro gira più svelto dei bordi; la torsione oscilla e non arrotola mai i bracci
  float a = aAng + uT*.018 + uTorsione*.32*sin(uT*.045 + r*.11)/(1. + r*.09);
  vec3 p = vec3(cos(a)*r, aAlt*(1. + uAudio*.6), sin(a)*r);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float z = -mv.z;
  vVicino = smoothstep(.6, 3.5, z);
  float dim = aTipo > .5 ? aDim : aDim*(1. + uAudio*.9*smoothstep(10., 0., r));
  gl_PointSize = clamp(dim * uPx * 36. / z, .8, (aTipo > .5 ? 380. : 26.)*uPx);
  vB = (.6 + .4*sin(uT*1.4 + aFase)) * (1. + uAudio*.8);
  vC = color; vTipo = aTipo;
}`;
export const GALASSIA_F = /* glsl */`
uniform float uForza; varying vec3 vC; varying float vB, vTipo, vVicino;
void main(){
  vec2 p = gl_PointCoord - .5; float d = length(p); if (d > .5) discard;
  float a = vTipo > .5 ? smoothstep(.5, 0., d)*.05 : pow(smoothstep(.5, 0., d), 2.);
  gl_FragColor = vec4(vC * vB * a * uForza * vVicino, 1.);
}`;

/* ---------- disco della galassia: la luce e la polvere tra le stelle ----------
   Stessa spirale delle stelle (angolo = raggio*.21), stessa rotazione, così i bracci coincidono. */
export const DISCO_V = /* glsl */`
varying vec3 vMondo;
void main(){
  vec4 m = modelMatrix * vec4(position, 1.);
  vMondo = m.xyz;
  gl_Position = projectionMatrix * viewMatrix * m;
}`;
export const DISCO_F = /* glsl */`
uniform float uT, uForza, uR;
varying vec3 vMondo;
float gy(vec3 p){ return dot(sin(p), cos(p.zxy)); }
void main(){
  vec2 q = vMondo.xz;
  float r = length(q);
  float a = atan(q.y, q.x) - uT*.018;
  float polvere = gy(vec3(q*.62, uT*.015)) + .6*gy(vec3(q*1.55 + 3., 1.7)) + .3*gy(vec3(q*3.7, 4.1));
  float aper = a + polvere*.05;
  float braccio = pow(.5 + .5*cos(4.*(aper - r*.21)), 4.);
  float buio = smoothstep(-.1, 1.15, polvere);
  float luce = exp(-r*.5)*1.9 + braccio*exp(-r*.085)*(.42 + .9*buio);
  luce *= smoothstep(uR*1.28, uR*.62, r);
  vec3 c = mix(vec3(1.,.82,.58), vec3(.2,.78,.9), smoothstep(1.5, 10., r));
  c = mix(c, vec3(.5,.36,1.), smoothstep(8., 25., r));
  c = mix(c, vec3(1.,.36,.62), buio*braccio*.22);
  float pian = abs(normalize(cameraPosition - vMondo).y);
  gl_FragColor = vec4(c*luce*uForza*smoothstep(.0, .3, pian), 1.);
}`;

/* ---------- torri della plancia: colonne di luce che respirano e rispondono alle onde ---------- */
export const TORRI_V = /* glsl */`
attribute vec3 aDove;
uniform float uT, uOnda, uBase;
varying float vY, vA;
void main(){
  float seme = aDove.z, d = length(aDove.xy);
  float onda = sin(d*.55 - uT*1.5)*.5 + .5;
  float alta = (.4 + seme*seme*4.)*(.65 + .35*sin(uT*.5 + seme*50.)) * (1. + onda*uOnda*1.4);
  vec3 p = vec3(position.x*.11 + aDove.x, (position.y + .5)*alta + uBase, position.z*.11 + aDove.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
  vY = position.y + .5;
  vA = (.3 + onda*(.35 + uOnda*.8)) * exp(-d*.032) * smoothstep(9., 26., distance(p, cameraPosition));
}`;
export const TORRI_F = /* glsl */`
uniform vec3 uColore; uniform float uForza; varying float vY, vA;
void main(){
  float a = pow(1. - vY, 1.6) + smoothstep(.97, 1., vY)*.9;
  gl_FragColor = vec4(uColore*a*vA*uForza, 1.);
}`;

/* ---------- immagine finale: bagliore su più scale, aberrazione, grana ---------- */
export const PIENO_V = /* glsl */`
varying vec2 vUv;
void main(){ vUv = position.xy*.5 + .5; gl_Position = vec4(position.xy, 0., 1.); }`;
export const GIU_F = /* glsl */`
uniform sampler2D uTex; uniform vec2 uPasso; uniform float uSoglia; varying vec2 vUv;
void main(){
  vec2 o = uPasso;
  vec3 c = texture2D(uTex, vUv).rgb*4.;
  c += texture2D(uTex, vUv - o).rgb + texture2D(uTex, vUv + o).rgb;
  c += texture2D(uTex, vUv + vec2(o.x, -o.y)).rgb + texture2D(uTex, vUv + vec2(-o.x, o.y)).rgb;
  c /= 8.;
  if (uSoglia > 0.){ float l = max(c.r, max(c.g, c.b)); c *= smoothstep(uSoglia*.55, uSoglia*1.25, l); }
  gl_FragColor = vec4(c, 1.);
}`;
export const SU_F = /* glsl */`
uniform sampler2D uTex, uBase; uniform vec2 uPasso; varying vec2 vUv;
void main(){
  vec2 o = uPasso;
  vec3 c = texture2D(uTex, vUv + vec2(-o.x*2., 0.)).rgb + texture2D(uTex, vUv + vec2(o.x*2., 0.)).rgb;
  c += texture2D(uTex, vUv + vec2(0., -o.y*2.)).rgb + texture2D(uTex, vUv + vec2(0., o.y*2.)).rgb;
  c += (texture2D(uTex, vUv + vec2(-o.x, o.y)).rgb + texture2D(uTex, vUv + o).rgb + texture2D(uTex, vUv - o).rgb + texture2D(uTex, vUv + vec2(o.x, -o.y)).rgb)*2.;
  gl_FragColor = vec4(c/12. + texture2D(uBase, vUv).rgb, 1.);
}`;
export const FINALE_F = /* glsl */`
uniform sampler2D uScena, uAlone; uniform float uT, uBagliore; uniform vec2 uRis; varying vec2 vUv;
float scarto(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 d = vUv - .5; float d2 = dot(d, d);
  vec2 ab = d*d2*.016;
  vec3 c = vec3(texture2D(uScena, vUv + ab).r, texture2D(uScena, vUv).g, texture2D(uScena, vUv - ab).b);
  c += texture2D(uAlone, vUv).rgb*uBagliore;
  c = 1. - exp(-c*1.18);                                    // le luci forti si chiudono morbide, non bruciano
  c = mix(vec3(dot(c, vec3(.3,.59,.11))), c, 1.28);
  c *= 1. - smoothstep(.16, .72, d2)*.34;
  c += (scarto(vUv*uRis + fract(uT)*91.) - .5)*.016;
  gl_FragColor = vec4(c, 1.);
}`;

/* ---------- cielo lontano ---------- */
export const CIELO_V = /* glsl */`
attribute float aFase; uniform float uT, uPx; varying float vB;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1. + fract(aFase*7.)*1.2) * uPx;
  vB = .35 + .3*sin(uT*.8 + aFase*6.28);
}`;
export const CIELO_F = /* glsl */`
uniform float uForza; varying float vB;
void main(){
  vec2 p = gl_PointCoord - .5; if (length(p) > .5) discard;
  gl_FragColor = vec4(vec3(.62,.72,.84) * vB * uForza, 1.);
}`;

/* ---------- plancia: pavimento a griglia infinita con onde dal nucleo ---------- */
export const GRIGLIA_V = /* glsl */`
varying vec3 vMondo;
void main(){
  vec4 m = modelMatrix * vec4(position, 1.);
  vMondo = m.xyz;
  gl_Position = projectionMatrix * viewMatrix * m;
}`;
export const GRIGLIA_F = /* glsl */`
uniform float uT, uForza, uOnda; uniform vec3 uColore, uCentro;
varying vec3 vMondo;
float linee(vec2 p, float passo){
  vec2 q = p/passo; vec2 g = abs(fract(q - .5) - .5) / fwidth(q);
  return 1. - min(min(g.x, g.y), 1.);
}
void main(){
  vec2 p = vMondo.xz - uCentro.xz;
  float d = length(p);
  float l = linee(vMondo.xz, 2.)*.32 + linee(vMondo.xz, 10.)*.55;
  float sfuma = exp(-d*.022);
  float pozza = exp(-d*d*.012)*.35;
  float onde = (.5 + .5*sin(d*1.4 - uT*2.6)) * exp(-d*.05) * (.12 + uOnda*.9);
  vec3 c = mix(vec3(.45,.78,.82), uColore, .55) * (l*(.55 + onde) + pozza) * sfuma;
  gl_FragColor = vec4(c * uForza, 1.);
}`;

/* ---------- scudo: cupola che protegge il nucleo ---------- */
export const SCUDO_V = /* glsl */`
varying vec3 vN, vVista, vLoc;
void main(){
  vLoc = position;
  vec4 m = modelMatrix * vec4(position, 1.);
  vN = normalize(mat3(modelMatrix) * normal);
  vVista = normalize(cameraPosition - m.xyz);
  gl_Position = projectionMatrix * viewMatrix * m;
}`;
export const SCUDO_F = /* glsl */`
uniform float uT, uForza; uniform vec3 uColore;
varying vec3 vN, vVista, vLoc;
void main(){
  float fr = pow(1. - abs(dot(normalize(vN), vVista)), 2.6);
  float lat = smoothstep(.93, 1., 1. - abs(fract(vLoc.y*2.2 - uT*.12) - .5)*2.);
  float lon = smoothstep(.96, 1., 1. - abs(fract(atan(vLoc.z, vLoc.x)/6.2831853*24.) - .5)*2.);
  float scan = smoothstep(.0, .06, .06 - abs(vLoc.y - (fract(uT*.18)*4.4 - 2.2)));
  float a = fr*.55 + (lat + lon)*.07*(.4 + fr) + scan*.35;
  gl_FragColor = vec4(uColore * a * uForza, 1.);
}`;
