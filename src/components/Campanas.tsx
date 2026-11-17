import {useRef} from 'react';
import {CAMPANAS, densidad} from '../modelo';
import {clamp} from '../lib/math';

const W = 600;
const H = 250;
const BASE = 210;
const ALTO = 170;
const X = (s: number) => 20 + (s / 100) * (W - 40);
const S = (x: number) => ((x - 20) / (W - 40)) * 100;

type Props = {
  umbral: number;
  onUmbral: (u: number) => void;
  /** Peso de cada campana: misma altura (1, 1) o proporcional al número de eventos. */
  pesoNormal: number;
  pesoAtaque: number;
};

function curva(media: number, escala: number, desde: number, hasta: number, cerrar: boolean) {
  const pts: string[] = [];
  for (let s = desde; s <= hasta + 1e-9; s += 0.5) pts.push(`${X(s).toFixed(1)},${(BASE - densidad(s, media, CAMPANAS.sd) * escala).toFixed(2)}`);
  return cerrar ? `M${X(desde)},${BASE} L${pts.join(' L')} L${X(hasta)},${BASE} Z` : `M${pts.join(' L')}`;
}

/**
 * Teoría de detección de señales en una figura: dos campanas de «puntuación de sospecha»
 * y un umbral que se arrastra. El SVG es solo para puntero (aria-hidden); el control accesible
 * es el deslizador que lo acompaña en la página.
 */
export function Campanas({umbral, onUmbral, pesoNormal, pesoAtaque}: Props) {
  const arrastrando = useRef(false);
  const pico = densidad(0, 0, CAMPANAS.sd);
  const max = Math.max(pesoNormal, pesoAtaque);
  const eN = (ALTO / pico) * (pesoNormal / max);
  const eA = (ALTO / pico) * (pesoAtaque / max);
  const u = umbral;

  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const m = e.currentTarget.getScreenCTM()!.inverse();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m);
    onUmbral(Math.round(clamp(S(p.x), 0, 100)));
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="campanas mt-4 w-full select-none"
      aria-hidden
      onPointerDown={(e) => {
        arrastrando.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        mover(e);
      }}
      onPointerMove={(e) => arrastrando.current && mover(e)}
      onPointerUp={() => (arrastrando.current = false)}
    >
      {/* Normales: a la izquierda del umbral, tranquilos; a la derecha, falsas alarmas. */}
      <path d={curva(CAMPANAS.normal, eN, 0, u, true)} className="zona-normal" />
      <path d={curva(CAMPANAS.normal, eN, u, 100, true)} className="zona-falsa" />
      {/* Ataques: a la izquierda se escapan; a la derecha, detectados. */}
      <path d={curva(CAMPANAS.ataque, eA, 0, u, true)} className="zona-escapa" />
      <path d={curva(CAMPANAS.ataque, eA, u, 100, true)} className="zona-real" />
      <path d={curva(CAMPANAS.normal, eN, 0, 100, false)} className="linea-normal" />
      <path d={curva(CAMPANAS.ataque, eA, 0, 100, false)} className="linea-ataque" />

      <line x1={X(0)} x2={X(100)} y1={BASE} y2={BASE} className="eje" />
      {[0, 25, 50, 75, 100].map((s) => (
        <text key={s} x={X(s)} y={BASE + 22} textAnchor="middle" className="eje-texto">
          {s}
        </text>
      ))}
      <text x={X(CAMPANAS.normal)} y={BASE - ALTO * (pesoNormal / max) - 10} textAnchor="middle" className="rotulo">
        eventos normales
      </text>
      <text x={X(CAMPANAS.ataque)} y={Math.min(BASE - 14, BASE - ALTO * (pesoAtaque / max) - 10)} textAnchor="middle" className="rotulo">
        ataques
      </text>

      <line x1={X(u)} x2={X(u)} y1={14} y2={BASE} className="umbral" />
      <rect x={X(u) - 34} y={0} width={68} height={24} rx={12} className="umbral-asa" />
      <text x={X(u)} y={16.5} textAnchor="middle" className="umbral-texto">
        umbral {u}
      </text>
    </svg>
  );
}
