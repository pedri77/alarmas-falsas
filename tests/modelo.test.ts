import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EVENTOS, clasificar, horasFalsas, permutacion, phi, porUmbral, recuento, recuentoEntero} from '../src/modelo.ts';

const base = {ataques: 10, sens: 0.99, fp: 0.01};

test('caso por defecto: ≈ 9 % de las alarmas son reales', () => {
  const r = recuento(base);
  assert.ok(Math.abs(r.vpp - 0.0902) < 0.001, String(r.vpp));
  assert.equal(Math.round(r.vp), 10);
  assert.equal(Math.round(r.fa), 100);
});

test('sin alarmas no hay NaN', () => {
  const r = recuento({ataques: 0, sens: 1, fp: 0});
  assert.equal(r.vpp, 0);
  assert.equal(recuentoEntero({ataques: 1, sens: 0, fp: 0}).vpp, 0);
});

test('extremos de los controles dan valores finitos entre 0 y 1', () => {
  for (const ataques of [1, 1000]) for (const sens of [0.5, 1]) for (const fp of [0.0001, 0.1]) {
    const r = recuentoEntero({ataques, sens, fp});
    assert.ok(r.vpp >= 0 && r.vpp <= 1);
    assert.ok(Number.isFinite(horasFalsas({ataques, sens, fp}, 1_000_000, 30)));
  }
});

test('phi conocida', () => {
  assert.ok(Math.abs(phi(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(phi(1.96) - 0.975) < 1e-3);
  assert.ok(Math.abs(phi(-2.326) - 0.01) < 1e-3);
});

test('umbral 53 reproduce el detector por defecto', () => {
  const {fp, sens} = porUmbral(53);
  assert.ok(Math.abs(fp - 0.0107) < 0.001, String(fp));
  assert.ok(Math.abs(sens - 0.9918) < 0.001, String(sens));
});

test('subir el umbral baja falsos positivos y detección a la vez', () => {
  const a = porUmbral(45), b = porUmbral(65);
  assert.ok(b.fp < a.fp && b.sens < a.sens);
});

test('la clasificación cuadra con el recuento y es estable', () => {
  const orden = permutacion(EVENTOS);
  assert.equal(new Set(orden).size, EVENTOS);
  const t = clasificar(base, orden);
  const n = [0, 0, 0, 0];
  t.forEach((v) => n[v]++);
  const r = recuentoEntero(base);
  assert.deepEqual(n.slice(1), [r.fa, r.vp, r.fn]);
  // Más falsos positivos solo añade puntos rojos: los que ya lo eran siguen igual.
  const t2 = clasificar({...base, fp: 0.02}, orden);
  t.forEach((v, i) => v === 1 && assert.equal(t2[i], 1));
});
