const { round2 } = require('./round');
const { IVA_ID } = require('./types');

/** @type {Record<string, { base: number, iva: number, id: number }>} */
function bumpGravado(byRate, ivaRate, base, ivaAmount) {
  const ivaId = IVA_ID[ivaRate];
  const key = String(ivaRate);
  if (!byRate[key]) {
    byRate[key] = { base: 0, iva: 0, id: ivaId };
  }
  byRate[key].base = round2(byRate[key].base + base);
  byRate[key].iva = round2(byRate[key].iva + ivaAmount);
}

/**
 * Precio neto por ítem (sin IVA), con descuento aplicado sobre la base.
 * @param {{ qty: number, unitPriceNet: number, discount?: number }} item
 */
function lineBase(item) {
  const qty = Number(item.qty) || 0;
  const unit = Number(item.unitPriceNet) || 0;
  const disc = Number(item.discount) || 0;
  const gross = qty * unit;
  const base = gross - disc;
  return round2(Math.max(0, base));
}

/**
 * Totales para WSFE a partir de ítems con tax.mode GRAVADO | EXENTO | NOGRAVADO.
 * @param {object[]} items
 * @param {boolean} isFacturaC si true, no se acumula IVA discriminado (ImpIVA = 0, sin array Iva)
 */
function computeTotals(items, isFacturaC) {
  let impNeto = 0;
  let impOpEx = 0;
  let impTotConc = 0;
  let impIVA = 0;
  /** @type {Record<string, { base: number, iva: number, id: number }>} */
  const byRate = {};

  for (const item of items || []) {
    const base = lineBase(item);
    const mode = String(item.tax?.mode || 'GRAVADO').toUpperCase();
    const rate = Number(item.tax?.ivaRate);

    if (mode === 'EXENTO') {
      impOpEx = round2(impOpEx + base);
      continue;
    }
    if (mode === 'NOGRAVADO' || mode === 'NO_GRAVADO') {
      impTotConc = round2(impTotConc + base);
      continue;
    }

    // GRAVADO
    const ivaRate = rate === 10.5 ? 10.5 : 21;
    const ivaId = IVA_ID[ivaRate];
    if (!ivaId) {
      throw new Error(`Alícuota IVA no soportada: ${rate}`);
    }

    const ivaAmount = round2(base * (ivaRate / 100));
    bumpGravado(byRate, ivaRate, base, ivaAmount);

    impNeto = round2(impNeto + base);
    if (!isFacturaC) {
      impIVA = round2(impIVA + ivaAmount);
    }
  }

  const ivaArray = [];
  if (!isFacturaC) {
    for (const k of Object.keys(byRate).sort()) {
      const b = byRate[k];
      ivaArray.push({
        Id: b.id,
        BaseImp: round2(b.base),
        Importe: round2(b.iva),
      });
    }
  }

  const impTotal = round2(impNeto + impIVA + impOpEx + impTotConc);

  return {
    impNeto: round2(impNeto),
    impIVA: round2(isFacturaC ? 0 : impIVA),
    impOpEx: round2(impOpEx),
    impTotConc: round2(impTotConc),
    impTrib: 0,
    impTotal,
    ivaArray,
    /** Totales guardados en /invoices para UI */
    snapshot: {
      neto: round2(impNeto),
      iva21: round2((byRate['21'] && byRate['21'].iva) || 0),
      iva105: round2((byRate['10.5'] && byRate['10.5'].iva) || 0),
      exento: round2(impOpEx),
      noGravado: round2(impTotConc),
      total: impTotal,
    },
  };
}

module.exports = {
  round2,
  lineBase,
  computeTotals,
};
