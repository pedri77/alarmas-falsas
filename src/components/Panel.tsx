import {permutacion, recuentoEntero, type Detector} from '../modelo';
import {num} from '../lib/math';
import {pct} from '../lib/formato';
import {Rejilla} from './Rejilla';

const MAX_FICHAS = 300;

/** Muestra de las alarmas del día, una a una: aquí se ve la proporción sin buscar en la rejilla. */
function Bandeja({vp, fa}: {vp: number; fa: number}) {
  const total = vp + fa;
  // Las buenas en posiciones al azar pero fijas (misma semilla): no forman columnas al cambiar el ancho.
  const fichas = new Array<number>(total).fill(1);
  permutacion(total, 11).slice(0, vp).forEach((i) => (fichas[i] = 2));
  const muestra = fichas.slice(0, MAX_FICHAS);
  return (
    <div className="bandeja" aria-hidden>
      {muestra.map((t, i) => (
        <span key={i} className={t === 2 ? 'ficha ficha-real' : 'ficha ficha-falsa'} />
      ))}
    </div>
  );
}

export function Leyenda() {
  return (
    <ul className="leyenda" aria-label="Leyenda">
      <li><span className="ficha ficha-falsa" /> falsa alarma</li>
      <li><span className="ficha ficha-real" /> ataque detectado</li>
      <li><span className="ficha ficha-escapa" /> ataque que se escapa</li>
      <li><span className="ficha ficha-normal" /> evento normal</li>
    </ul>
  );
}

export function Panel({det, conBandeja = true}: {det: Detector; conBandeja?: boolean}) {
  const r = recuentoEntero(det);
  const frase =
    r.alarmas === 0
      ? 'Hoy no ha saltado ninguna alarma.'
      : `De ${num(r.alarmas)} ${r.alarmas === 1 ? 'alarma' : 'alarmas'}, ${num(r.vp)} ${r.vp === 1 ? 'es un ataque real' : 'son ataques reales'}.`;
  return (
    <div className="tarjeta mt-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2" aria-live="polite">
        <p className="text-body text-texto-2 max-w-[26ch]">{frase}</p>
        <p className="font-cifra text-display tabular-nums leading-none">
          <span className="text-acento-2">{pct(r.vpp)}</span>
          <span className="ml-2 text-etiqueta uppercase text-texto-3">de alarmas reales</span>
        </p>
      </div>
      <div className="mt-5">
        <Rejilla
          det={det}
          descripcion={`Rejilla de 10.000 eventos: ${r.fa} falsas alarmas, ${r.vp} ataques detectados, ${r.fn} ataques que se escapan.`}
        />
      </div>
      <Leyenda />
      {conBandeja && r.alarmas > 0 && (
        <div className="mt-5">
          <p className="text-etiqueta uppercase text-texto-3">
            {r.alarmas > MAX_FICHAS ? `${MAX_FICHAS} de las ${num(r.alarmas)} alarmas del día, al azar` : `Las ${num(r.alarmas)} alarmas del día, una a una`}
            {r.fn > 0 && <span className="normal-case tracking-normal"> · y {num(r.fn)} {r.fn === 1 ? 'ataque se escapa' : 'ataques se escapan'} sin alarma</span>}
          </p>
          <Bandeja vp={r.vp} fa={r.fa} />
        </div>
      )}
    </div>
  );
}
