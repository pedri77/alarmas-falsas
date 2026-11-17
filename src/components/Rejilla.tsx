import {useEffect, useRef, useState} from 'react';
import {EVENTOS, clasificar, permutacion, type Detector} from '../modelo';

const ORDEN = permutacion(EVENTOS);
const COLUMNAS = 100;

const color = (nombre: string) => getComputedStyle(document.documentElement).getPropertyValue(`--color-${nombre}`).trim();

/**
 * Los 10.000 eventos del día, uno por punto, en canvas (10.000 nodos DOM serían demasiados).
 * Normales: punto tenue. Falsas alarmas: cuadrado rojo. Ataques: círculo turquesa (detectado)
 * o aro ámbar (se escapa), con halo para que se encuentren: son pocos y eso es la lección.
 * La descripción accesible va en aria-label; las cifras también se leen en el texto de al lado.
 */
export function Rejilla({det, descripcion}: {det: Detector; descripcion: string}) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const c = lienzo.current!;
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)));
    ro.observe(c.parentElement!);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = lienzo.current;
    if (!c || ancho === 0) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = ancho * dpr;
    c.height = ancho * dpr;
    const g = c.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, ancho, ancho);
    const celda = ancho / COLUMNAS;
    const tipo = clasificar(det, ORDEN);
    const [punto, rojo, turquesa, ambar] = ['punto', 'acento', 'acento-2', 'escapa'].map(color);

    const centro = (i: number) => [(i % COLUMNAS + 0.5) * celda, (Math.floor(i / COLUMNAS) + 0.5) * celda] as const;
    const ataques: number[] = [];

    g.fillStyle = punto;
    const p = Math.max(1, celda * 0.34);
    for (let i = 0; i < EVENTOS; i++) {
      if (tipo[i] === 0) {
        const [x, y] = centro(i);
        g.fillRect(x - p / 2, y - p / 2, p, p);
      }
    }
    g.fillStyle = rojo;
    const q = Math.max(1.5, celda * 0.78);
    for (let i = 0; i < EVENTOS; i++) {
      if (tipo[i] === 1) {
        const [x, y] = centro(i);
        g.fillRect(x - q / 2, y - q / 2, q, q);
      } else if (tipo[i] >= 2) ataques.push(i);
    }
    // Ataques encima, con halo.
    const r = ataques.length <= 60 ? Math.max(2.5, celda * 0.6) : Math.max(1.5, celda * 0.42);
    // El halo solo ayuda a encontrarlos cuando son pocos; con muchos, ensucia.
    const halo = ataques.length <= 60;
    for (const i of ataques) {
      const [x, y] = centro(i);
      const real = tipo[i] === 2 ? turquesa : ambar;
      g.strokeStyle = real;
      if (halo) {
        g.globalAlpha = 0.45;
        g.lineWidth = 1;
        g.beginPath();
        g.arc(x, y, r * 2.4, 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = 1;
      }
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      if (tipo[i] === 2) {
        g.fillStyle = real;
        g.fill();
      } else {
        g.lineWidth = Math.max(1.2, celda * 0.3);
        g.stroke();
      }
    }
  }, [det, ancho]);

  return (
    <div className="w-full">
      <canvas ref={lienzo} role="img" aria-label={descripcion} style={{width: ancho, height: ancho, display: 'block'}} />
    </div>
  );
}
