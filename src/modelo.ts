/**
 * Modelo del explorable. Funciones puras, sin React: se prueban con `node --test tests/`.
 *
 * Falacia de la tasa base (Axelsson, 2000): de todas las alarmas, la fracción que son ataques reales
 * (valor predictivo positivo) es  vp / (vp + fa), con
 *   vp = ataques · sensibilidad          (alarmas buenas)
 *   fa = (eventos − ataques) · tasa de falsos positivos
 * Se cuenta en frecuencias naturales («10 de cada 10.000») porque así se entiende mejor
 * (Gigerenzer y Hoffrage, 1995).
 */

export const EVENTOS = 10_000;

export type Detector = {
  /** Ataques reales por cada 10.000 eventos. */
  ataques: number;
  /** Fracción de ataques que el detector marca (0–1). */
  sens: number;
  /** Fracción de eventos normales que el detector marca por error (0–1). */
  fp: number;
};

export function recuento({ataques, sens, fp}: Detector, eventos = EVENTOS) {
  const reales = (ataques * eventos) / EVENTOS;
  const normales = eventos - reales;
  const vp = reales * sens;
  const fn = reales - vp;
  const fa = normales * fp;
  const alarmas = vp + fa;
  return {reales, normales, vp, fn, fa, alarmas, vpp: alarmas > 0 ? vp / alarmas : 0};
}

/** Recuento en unidades enteras, el que se dibuja: los puntos de la rejilla no pueden ser medio evento. */
export function recuentoEntero(d: Detector) {
  const reales = Math.round(d.ataques);
  const vp = Math.round(reales * d.sens);
  const fa = Math.round((EVENTOS - reales) * d.fp);
  const alarmas = vp + fa;
  return {reales, vp, fn: reales - vp, fa, alarmas, vpp: alarmas > 0 ? vp / alarmas : 0};
}

/** Función de distribución de la normal estándar (Abramowitz y Stegun 7.1.26, error < 1,5·10⁻⁷). */
export function phi(z: number) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function densidad(x: number, media: number, sd: number) {
  const z = (x - media) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

/**
 * Teoría de detección de señales: cada evento recibe una «puntuación de sospecha» de 0 a 100.
 * Normales ~ N(30, 10), ataques ~ N(77, 10). Valores elegidos para que el umbral 53 dé
 * ≈ 99 % de detección y ≈ 1 % de falsos positivos, los mismos del resto de la página. Ilustrativo.
 */
export const CAMPANAS = {normal: 30, ataque: 77, sd: 10} as const;

export function porUmbral(u: number) {
  const {normal, ataque, sd} = CAMPANAS;
  return {fp: 1 - phi((u - normal) / sd), sens: 1 - phi((u - ataque) / sd)};
}

/** Horas al día que se van en revisar alarmas falsas. */
export function horasFalsas(d: Detector, eventosDia: number, minutosPorAlarma: number) {
  return (recuento(d, eventosDia).fa * minutosPorAlarma) / 60;
}

/** Permutación determinista de 0..n−1 (mulberry32 + Fisher-Yates): los puntos no saltan al mover controles. */
export function permutacion(n: number, semilla = 7) {
  let s = semilla >>> 0;
  const azar = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const p = Array.from({length: n}, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

/** Tipo de cada evento para dibujar: 0 normal, 1 falsa alarma, 2 alarma buena, 3 ataque que se escapa. */
export function clasificar(d: Detector, orden: number[]) {
  const {reales, vp, fa} = recuentoEntero(d);
  const tipo = new Uint8Array(EVENTOS);
  let normalesVistos = 0;
  orden.forEach((celda, rango) => {
    if (rango < reales) tipo[celda] = rango < vp ? 2 : 3;
    else tipo[celda] = normalesVistos++ < fa ? 1 : 0;
  });
  return tipo;
}
