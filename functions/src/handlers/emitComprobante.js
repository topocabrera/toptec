const { v4: uuidv4 } = require('uuid');
const { validateDraft, DraftValidationError } = require('../afip/validators');
const { buildFecaDet } = require('../afip/mapper');
const { getTicket } = require('../afip/ticket');
const { getLastAuthorized, solicitarCae } = require('../afip/wsfe');
const { readDraft, commitInvoiceAndDraft } = require('../firebase/rtdb');

/**
 * @param {object} opts
 * @param {'HOMO'|'PROD'} opts.env
 * @param {string} opts.cuit emisor
 * @param {string} opts.certPem
 * @param {string} opts.keyPem
 * @param {string} opts.draftId
 * @param {'INVOICE'|'CREDIT_NOTE'} opts.kind
 */
async function emitFromDraft(opts) {
  const { env, cuit, certPem, keyPem, draftId, kind } = opts;

  const row = await readDraft(draftId);
  if (!row) {
    const e = new Error('Borrador no encontrado');
    e.code = 'NOT_FOUND';
    throw e;
  }

  const draft = row.val;
  let validated;
  try {
    validated = validateDraft(draft, kind);
  } catch (err) {
    if (err instanceof DraftValidationError) {
      err.code = err.code || 'VALIDATION';
    }
    throw err;
  }

  const ta = await getTicket(env, certPem, keyPem);
  const ptoVta = Number(draft.issuer.ptoVta);
  const last = await getLastAuthorized(env, ta, cuit, ptoVta, validated.cbteTipo);
  const nextNro = last + 1;

  const built = buildFecaDet(draft, validated, nextNro);
  const feReqSnapshot = {
    FeCabReq: built.feCabReq,
    FeDetReq: {
      FECAEDetRequest: {
        ...built.det,
        ...(built.ivaArray?.length ? { Iva: { AlicIva: built.ivaArray } } : {}),
        ...(built.cbtesAsoc?.length
          ? { CbtesAsoc: { CbteAsoc: built.cbtesAsoc } }
          : {}),
      },
    },
  };

  const caeRes = await solicitarCae(
    env,
    ta,
    cuit,
    built.feCabReq,
    built.det,
    built.ivaArray,
    built.cbtesAsoc
  );

  const invoiceId = uuidv4();
  const baseInvoice = {
    draftId,
    createdAt: Date.now(),
    totals: built.totals.snapshot,
    pdf: null,
  };

  const approved = caeRes.resultado === 'A' && caeRes.cae;
  const afipBlock = {
    env,
    ptoVta,
    cbteTipo: validated.cbteTipo,
    cbteNro: nextNro,
    cae: caeRes.cae || null,
    caeVto: caeRes.caeFchVto || null,
    result: caeRes.resultado || null,
    observations: caeRes.observations || [],
    errors: caeRes.errors || [],
    request: feReqSnapshot,
    response: {
      resultado: caeRes.resultado,
      cae: caeRes.cae,
      caeFchVto: caeRes.caeFchVto,
      detResp: caeRes.detResp,
      feCabResp: caeRes.feCabResp,
    },
  };

  if (approved) {
    await commitInvoiceAndDraft(
      draftId,
      invoiceId,
      {
        ...baseInvoice,
        status: 'APPROVED',
        afip: afipBlock,
      },
      {
        status: 'EMITTED',
        invoiceId,
        emittedAt: Date.now(),
      }
    );

    return {
      invoiceId,
      status: 'APPROVED',
      afip: {
        cbteNro: nextNro,
        cae: caeRes.cae,
        caeVto: caeRes.caeFchVto,
        resultado: caeRes.resultado,
      },
    };
  }

  const rejectMsg =
    (caeRes.errors?.[0] && (caeRes.errors[0].Msg || caeRes.errors[0].msg))
    || `AFIP resultado=${caeRes.resultado}`;

  await commitInvoiceAndDraft(
    draftId,
    invoiceId,
    {
      ...baseInvoice,
      status: 'REJECTED',
      afip: afipBlock,
    },
    {
      status: 'EMIT_FAILED',
      lastEmitError: rejectMsg,
      invoiceId,
      emittedAt: Date.now(),
    }
  );

  return {
    invoiceId,
    status: 'REJECTED',
    afip: {
      cbteNro: nextNro,
      cae: null,
      caeVto: null,
      resultado: caeRes.resultado,
      errors: caeRes.errors,
      observations: caeRes.observations,
      message: rejectMsg,
    },
  };
}

module.exports = { emitFromDraft, DraftValidationError };
