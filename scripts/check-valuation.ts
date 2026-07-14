// Pruebas del motor de valoración. Ejecutar: node scripts/check-valuation.ts
//
// Lo que de verdad se examina aquí no es que el motor sepa multiplicar,
// sino que sepa CALLARSE: que devuelva null cuando no tiene base para
// dar un precio. Un tasador que siempre responde es un tasador que miente.

import assert from 'node:assert/strict';
import {
  estimateValue,
  selectComps,
  median,
  MIN_COMPS,
  LISTING_HAIRCUT,
  type Comp,
  type PropertyInput,
} from '../lib/valuation.ts';

const NOW = new Date('2026-07-14');
const RECIENTE = new Date('2026-06-01');
const VIEJO = new Date('2024-01-01');

let pasadas = 0;
function test(nombre: string, fn: () => void) {
  try {
    fn();
    pasadas++;
    console.log(`  ok  ${nombre}`);
  } catch (e) {
    console.error(`  FALLA  ${nombre}`);
    console.error(`        ${(e as Error).message}`);
    process.exitCode = 1;
  }
}

/** Fabrica n comparables de piso, todos al mismo €/m², para aislar la variable a probar. */
function comps(n: number, priceM2: number, over: Partial<Comp> = {}): Comp[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    district: 'Las Arenas',
    propertyType: 'piso',
    areaM2: 100,
    priceM2,
    isClosedSale: true,
    source: 'test',
    observedAt: RECIENTE,
    ...over,
  }));
}

const PISO: PropertyInput = {
  postalCode: '48930',
  district: 'Las Arenas',
  propertyType: 'piso',
  areaM2: 100,
  condition: 'bien',
};

console.log('\n── El motor se niega a valorar cuando no debe ──');

test('sin comparables → no da precio', () => {
  const r = estimateValue(PISO, [], NOW);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'sin_comparables');
});

test(`con menos de ${MIN_COMPS} comparables → no da precio`, () => {
  const r = estimateValue(PISO, comps(MIN_COMPS - 1, 4000), NOW);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'pocos_comparables');
  assert.equal(r.ok === false && r.compsFound, MIN_COMPS - 1);
});

test('sin metros cuadrados → no da precio', () => {
  const r = estimateValue({ ...PISO, areaM2: 0 }, comps(20, 4000), NOW);
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, 'datos_insuficientes');
});

test('comparables caducados no cuentan → no da precio', () => {
  const r = estimateValue(PISO, comps(20, 4000, { observedAt: VIEJO }), NOW);
  assert.equal(r.ok, false, 'un dato de 2024 no puede valorar una casa en 2026');
});

test('un chalet no se valora con comparables de pisos', () => {
  const r = estimateValue({ ...PISO, propertyType: 'casa' }, comps(20, 4000), NOW);
  assert.equal(r.ok, false, 'mezclar tipos de inmueble es exactamente el error a evitar');
});

test('un piso de 40 m² no se valora con comparables de 100 m²', () => {
  const r = estimateValue({ ...PISO, areaM2: 40 }, comps(20, 4000), NOW);
  assert.equal(r.ok, false);
});

console.log('\n── Cuando sí valora, el número sale de los datos ──');

test('el precio es la mediana de la zona × metros', () => {
  const r = estimateValue(PISO, comps(20, 4000), NOW);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.valuation.zonePricePerM2, 4000);
  assert.equal(r.valuation.central, 400_000); // 4.000 €/m² × 100 m²
  assert.ok(r.valuation.min < r.valuation.central);
  assert.ok(r.valuation.max > r.valuation.central);
  assert.equal(r.valuation.compsUsed, 20);
});

test('un outlier no arrastra la valoración (mediana, no media)', () => {
  const normales = comps(19, 4000);
  const chaletCaro: Comp = { ...normales[0], id: 99, priceM2: 40_000 };
  const r = estimateValue(PISO, [...normales, chaletCaro], NOW);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.valuation.zonePricePerM2, 4000, 'la media habría dado ~5.800 €/m²');
});

test('los precios de oferta llevan recorte: no son precios pagados', () => {
  const r = estimateValue(PISO, comps(20, 4000, { isClosedSale: false }), NOW);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.valuation.zonePricePerM2, Math.round(4000 * LISTING_HAIRCUT)); // 3.720
});

console.log('\n── Los ajustes van en la dirección correcta ──');

const base = () => {
  const r = estimateValue(PISO, comps(20, 4000), NOW);
  assert.ok(r.ok);
  return r.ok ? r.valuation.central : 0;
};

test('a reformar vale menos que en buen estado', () => {
  const r = estimateValue({ ...PISO, condition: 'reformar' }, comps(20, 4000), NOW);
  assert.ok(r.ok && r.valuation.central < base());
});

test('reformado vale más que en buen estado', () => {
  const r = estimateValue({ ...PISO, condition: 'reformado' }, comps(20, 4000), NOW);
  assert.ok(r.ok && r.valuation.central > base());
});

test('un 4º sin ascensor vale menos que un 4º con ascensor', () => {
  const sin = estimateValue({ ...PISO, floor: 4, hasElevator: false }, comps(20, 4000), NOW);
  const con = estimateValue({ ...PISO, floor: 4, hasElevator: true }, comps(20, 4000), NOW);
  assert.ok(sin.ok && con.ok);
  if (!sin.ok || !con.ok) return;
  assert.ok(sin.valuation.central < con.valuation.central);
});

test('interior vale menos que exterior', () => {
  const r = estimateValue({ ...PISO, isExterior: false }, comps(20, 4000), NOW);
  assert.ok(r.ok && r.valuation.central < base());
});

test('cada ajuste queda explicado, para poder auditarlo', () => {
  const r = estimateValue(
    { ...PISO, condition: 'reformar', floor: 0, hasGarage: true },
    comps(20, 4000),
    NOW
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  const etiquetas = r.valuation.adjustments.map((a) => a.label);
  assert.deepEqual(etiquetas, ['A reformar', 'Planta baja', 'Garaje']);
});

console.log('\n── La confianza refleja la calidad de los datos ──');

test('zona homogénea y muchos testigos → confianza alta', () => {
  const r = estimateValue(PISO, comps(20, 4000), NOW);
  assert.ok(r.ok && r.valuation.confidence === 'alta');
});

test('zona dispar → rango más ancho y menos confianza', () => {
  const dispares = comps(20, 4000).map((c, i) => ({
    ...c,
    priceM2: i % 2 === 0 ? 2500 : 6000, // barrio partido en dos
  }));
  const r = estimateValue(PISO, dispares, NOW);
  assert.ok(r.ok);
  if (!r.ok) return;
  const amplitud = (r.valuation.max - r.valuation.min) / r.valuation.central;
  assert.ok(amplitud > 0.15, `esperaba un rango ancho, salió ${(amplitud * 100).toFixed(1)}%`);
  assert.notEqual(r.valuation.confidence, 'alta');
});

console.log('\n── Piezas sueltas ──');

test('la mediana es la mediana', () => {
  assert.equal(median([1, 2, 3]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
});

test('se prefiere el barrio al municipio cuando el barrio da suficientes testigos', () => {
  const barrio = comps(10, 5000, { district: 'Neguri' });
  const resto = comps(50, 3000, { district: 'Romo' }).map((c, i) => ({ ...c, id: 1000 + i }));
  const sel = selectComps({ ...PISO, district: 'Neguri' }, [...barrio, ...resto], NOW);
  assert.equal(sel.length, 10, 'debe usar solo Neguri, no diluirlo con todo Getxo');
});

console.log(`\n${pasadas} pruebas pasadas.\n`);
