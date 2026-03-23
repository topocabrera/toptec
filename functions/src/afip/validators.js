const {
  DRAFT_CBTE_TO_AFIP,
  INVOICE_TYPES,
  CREDIT_NOTE_TYPES,
  resolveDocTipo,
  DOC_TIPO,
  ISSUER_IVA,
  CBTE_TIPO,
  creditNoteMatchesOriginal,
} = require('./types');

class DraftValidationError extends Error {
  constructor(message, code = 'VALIDATION') {
    super(message);
    this.name = 'DraftValidationError';
    this.code = code;
  }
}

function assert(cond, msg) {
  if (!cond) throw new DraftValidationError(msg);
}

function normalizeCuit(nro) {
  return String(nro || '').replace(/\D/g, '');
}

/**
 * @param {object} draft
 * @param {'INVOICE'|'CREDIT_NOTE'} kind
 */
function validateDraft(draft, kind) {
  assert(draft && typeof draft === 'object', 'Borrador inválido');
  assert(draft.status === 'DRAFT', `Estado del borrador debe ser DRAFT (actual: ${draft.status})`);

  const cbteType = draft.cbte?.type;
  assert(cbteType, 'cbte.type requerido (FA|FB|FC|NCA|NCB|NCC)');
  assert(DRAFT_CBTE_TO_AFIP[cbteType], `cbte.type desconocido: ${cbteType}`);

  if (kind === 'INVOICE') {
    assert(INVOICE_TYPES.has(cbteType), 'Para emitir factura el tipo debe ser FA, FB o FC');
  } else {
    assert(CREDIT_NOTE_TYPES.has(cbteType), 'Para nota de crédito el tipo debe ser NCA, NCB o NCC');
  }

  const issuerIva = draft.issuer?.condicionIva;
  assert(
    issuerIva === ISSUER_IVA.RI || issuerIva === ISSUER_IVA.MONO,
    'issuer.condicionIva debe ser RI o MONO'
  );

  const ptoVta = Number(draft.issuer?.ptoVta);
  assert(ptoVta > 0 && ptoVta < 100000, 'issuer.ptoVta inválido');

  if (issuerIva === ISSUER_IVA.MONO) {
    assert(cbteType === 'FC' || cbteType === 'NCC', 'Monotributo: solo Factura C / Nota de Crédito C');
  }
  if (issuerIva === ISSUER_IVA.RI) {
    assert(cbteType !== 'FC' && cbteType !== 'NCC', 'Responsable inscripto: no usar FC/NCC (usar A/B)');
  }

  assert(draft.cbte?.fecha && /^\d{8}$/.test(String(draft.cbte.fecha)), 'cbte.fecha requerida (YYYYMMDD)');
  assert(draft.cbte?.concepto >= 1 && draft.cbte?.concepto <= 3, 'cbte.concepto debe ser 1, 2 o 3');

  const cust = draft.customer || {};
  const docTipo = resolveDocTipo(cust.docTipo);
  let docNro = normalizeCuit(cust.docNro);

  if (docTipo === DOC_TIPO.CUIT || docTipo === DOC_TIPO.CUIL) {
    assert(docNro.length === 11, 'docNro debe tener 11 dígitos para CUIT/CUIL');
  } else if (docTipo === DOC_TIPO.DNI) {
    assert(docNro.length >= 7 && docNro.length <= 8, 'DNI: docNro entre 7 y 8 dígitos');
  } else if (docTipo === DOC_TIPO.CONSUMIDOR_FINAL) {
    docNro = '0';
  }

  const items = draft.items;
  assert(Array.isArray(items) && items.length > 0, 'items: al menos una línea');

  for (const it of items) {
    assert(it.description, 'Cada ítem debe tener description');
    assert(Number(it.qty) > 0, 'qty debe ser > 0');
    assert(Number(it.unitPriceNet) >= 0, 'unitPriceNet no negativo');
    const disc = Number(it.discount) || 0;
    assert(disc >= 0, 'discount no negativo');
    const mode = String(it.tax?.mode || '').toUpperCase();
    assert(
      mode === 'GRAVADO' || mode === 'EXENTO' || mode === 'NOGRAVADO' || mode === 'NO_GRAVADO',
      `tax.mode inválido: ${it.tax?.mode}`
    );
    if (mode === 'GRAVADO') {
      const r = Number(it.tax?.ivaRate);
      assert(r === 21 || r === 10.5, 'tax.ivaRate debe ser 21 o 10.5 para GRAVADO');
    }
  }

  if (kind === 'CREDIT_NOTE') {
    const ref = draft.references?.original;
    assert(ref, 'references.original obligatorio para nota de crédito');
    assert(ref.ptoVta && ref.cbteTipo && ref.cbteNro, 'references.original incompleto');
    assert(ref.cuit, 'references.original.cuit requerido (CUIT emisor de la factura original)');
    const origTipoStr = String(ref.cbteTipo);
    const origNum = DRAFT_CBTE_TO_AFIP[origTipoStr] || Number(origTipoStr);
    assert(origNum, 'references.original.cbteTipo inválido');
    const ncNum = DRAFT_CBTE_TO_AFIP[cbteType];
    assert(
      creditNoteMatchesOriginal(ncNum, origNum),
      'Tipo de NC debe corresponder a la clase de factura original (A/B/C)'
    );
  }

  return {
    docTipo,
    docNro: docTipo === DOC_TIPO.CONSUMIDOR_FINAL ? 0 : Number(docNro),
    cbteTipo: DRAFT_CBTE_TO_AFIP[cbteType],
  };
}

module.exports = {
  DraftValidationError,
  validateDraft,
  normalizeCuit,
};
