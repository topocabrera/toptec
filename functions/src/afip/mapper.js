const { computeTotals } = require('./calc');
const { isFacturaCClass, DRAFT_CBTE_TO_AFIP } = require('./types');
const { escapeXml } = require('./xmlUtil');

/**
 * @param {object} draft
 * @param {{ docTipo: number, docNro: number, cbteTipo: number }} validated
 * @param {number} cbteNro próximo número
 */
function buildFecaDet(draft, validated, cbteNro) {
  const { cbteTipo } = validated;
  const isC = isFacturaCClass(cbteTipo);
  const t = computeTotals(draft.items, isC);

  const monId = String(draft.cbte?.moneda || 'PES');
  const cotiz = Number(draft.cbte?.cotizacion ?? 1);

  /** @type {object} */
  const det = {
    Concepto: Number(draft.cbte.concepto),
    DocTipo: validated.docTipo,
    DocNro: validated.docNro,
    CbteDesde: cbteNro,
    CbteHasta: cbteNro,
    CbteFch: String(draft.cbte.fecha),
    ImpTotal: t.impTotal,
    ImpTotConc: t.impTotConc,
    ImpNeto: t.impNeto,
    ImpOpEx: t.impOpEx,
    ImpTrib: t.impTrib,
    ImpIVA: t.impIVA,
    MonId: monId,
    MonCotiz: cotiz,
  };

  const condRec = draft.customer?.condicionIvaReceptorId;
  if (condRec != null && condRec !== '') {
    det.CondicionIVAReceptorId = Number(condRec);
  }

  /** @type {{ Tipo: number, PtoVta: number, Nro: number, Cuit: string, CbteFch?: string }[]} */
  let cbtesAsoc;
  if (draft.references?.original && String(draft.cbte?.type || '').startsWith('NC')) {
    const o = draft.references.original;
    const tipoRef = DRAFT_CBTE_TO_AFIP[o.cbteTipo] || Number(o.cbteTipo);
    cbtesAsoc = [
      {
        Tipo: tipoRef,
        PtoVta: Number(o.ptoVta),
        Nro: Number(o.cbteNro),
        Cuit: String(o.cuit).replace(/\D/g, ''),
        ...(o.cbteFch ? { CbteFch: String(o.cbteFch) } : {}),
      },
    ];
  }

  return {
    feCabReq: {
      CantReg: 1,
      PtoVta: Number(draft.issuer.ptoVta),
      CbteTipo: cbteTipo,
    },
    det,
    ivaArray: t.ivaArray,
    cbtesAsoc,
    totals: t,
  };
}

module.exports = {
  escapeXml,
  buildFecaDet,
  DRAFT_CBTE_TO_AFIP,
};
