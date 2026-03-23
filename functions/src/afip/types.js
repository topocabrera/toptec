/**
 * Constantes AFIP WSFEv1 (verificar en homologación con FEParamGetTiposCbte / Tipos de IVA).
 * @see https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
 */

/** @enum {number} */
const CBTE_TIPO = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  RECIBO_A: 4,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  RECIBO_B: 9,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
};

/** Clave draft → número AFIP */
const DRAFT_CBTE_TO_AFIP = {
  FA: CBTE_TIPO.FACTURA_A,
  FB: CBTE_TIPO.FACTURA_B,
  FC: CBTE_TIPO.FACTURA_C,
  NCA: CBTE_TIPO.NOTA_CREDITO_A,
  NCB: CBTE_TIPO.NOTA_CREDITO_B,
  NCC: CBTE_TIPO.NOTA_CREDITO_C,
};

const INVOICE_TYPES = new Set(['FA', 'FB', 'FC']);
const CREDIT_NOTE_TYPES = new Set(['NCA', 'NCB', 'NCC']);

/** @enum {number} */
const DOC_TIPO = {
  CUIT: 80,
  CUIL: 86,
  DNI: 96,
  CONSUMIDOR_FINAL: 99,
};

/**
 * Códigos de alícuota IVA (WSFE) — comunes homologación.
 * Confirmar con FEParamGetTiposIva.
 */
const IVA_ID = {
  0: 3,
  10.5: 4,
  21: 5,
  27: 6,
};

/** Condición IVA emisor en borrador */
const ISSUER_IVA = {
  RI: 'RI',
  MONO: 'MONO',
};

/**
 * DocTipo string en draft.customer.docTipo → número AFIP
 */
function resolveDocTipo(docTipoStr) {
  if (!docTipoStr) return DOC_TIPO.CONSUMIDOR_FINAL;
  const u = String(docTipoStr).toUpperCase().replace(/\s/g, '_');
  if (u === 'CUIT') return DOC_TIPO.CUIT;
  if (u === 'CUIL') return DOC_TIPO.CUIL;
  if (u === 'DNI') return DOC_TIPO.DNI;
  if (u === 'CONSUMIDOR_FINAL' || u === 'CF') return DOC_TIPO.CONSUMIDOR_FINAL;
  return DOC_TIPO.CONSUMIDOR_FINAL;
}

function isFacturaCClass(cbteTipo) {
  return (
    cbteTipo === CBTE_TIPO.FACTURA_C
    || cbteTipo === CBTE_TIPO.NOTA_DEBITO_C
    || cbteTipo === CBTE_TIPO.NOTA_CREDITO_C
  );
}

function creditNoteMatchesOriginal(ncTipo, originalTipo) {
  const pairs = [
    [CBTE_TIPO.NOTA_CREDITO_A, CBTE_TIPO.FACTURA_A],
    [CBTE_TIPO.NOTA_CREDITO_B, CBTE_TIPO.FACTURA_B],
    [CBTE_TIPO.NOTA_CREDITO_C, CBTE_TIPO.FACTURA_C],
  ];
  return pairs.some(([nc, inv]) => nc === ncTipo && inv === originalTipo);
}

module.exports = {
  CBTE_TIPO,
  DRAFT_CBTE_TO_AFIP,
  INVOICE_TYPES,
  CREDIT_NOTE_TYPES,
  DOC_TIPO,
  IVA_ID,
  ISSUER_IVA,
  resolveDocTipo,
  isFacturaCClass,
  creditNoteMatchesOriginal,
};
