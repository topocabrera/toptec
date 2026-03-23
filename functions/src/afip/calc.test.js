const test = require('node:test');
const assert = require('node:assert/strict');
const { computeTotals, lineBase } = require('./calc');
const { round2 } = require('./round');

test('round2', () => {
  assert.equal(round2(12.344), 12.34);
  assert.equal(round2(12.345), 12.35);
  assert.equal(round2(10.999), 11);
});

test('lineBase con descuento', () => {
  assert.equal(lineBase({ qty: 2, unitPriceNet: 100, discount: 10 }), 190);
});

test('totales A/B gravado 21%', () => {
  const t = computeTotals(
    [
      {
        qty: 1,
        unitPriceNet: 100,
        discount: 0,
        tax: { mode: 'GRAVADO', ivaRate: 21 },
      },
    ],
    false
  );
  assert.equal(t.impNeto, 100);
  assert.equal(t.impIVA, 21);
  assert.equal(t.impTotal, 121);
  assert.equal(t.ivaArray.length, 1);
  assert.equal(t.ivaArray[0].Id, 5);
});

test('mix exento + no gravado + 10.5%', () => {
  const t = computeTotals(
    [
      { qty: 1, unitPriceNet: 100, tax: { mode: 'EXENTO' } },
      { qty: 1, unitPriceNet: 50, tax: { mode: 'NOGRAVADO' } },
      { qty: 2, unitPriceNet: 200, tax: { mode: 'GRAVADO', ivaRate: 10.5 } },
    ],
    false
  );
  assert.equal(t.impOpEx, 100);
  assert.equal(t.impTotConc, 50);
  assert.equal(t.impNeto, 400);
  assert.equal(t.impIVA, 42);
  assert.equal(t.impTotal, round2(100 + 50 + 400 + 42));
});

test('Factura C sin IVA discriminado', () => {
  const t = computeTotals(
    [
      { qty: 1, unitPriceNet: 100, tax: { mode: 'GRAVADO', ivaRate: 21 } },
    ],
    true
  );
  assert.equal(t.impIVA, 0);
  assert.equal(t.ivaArray.length, 0);
  assert.equal(t.impNeto, 100);
  assert.equal(t.impTotal, 100);
});
