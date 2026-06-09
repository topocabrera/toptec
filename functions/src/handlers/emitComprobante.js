const { v4: uuidv4 } = require('uuid');
const { validateDraft, DraftValidationError } = require('../afip/validators');
const { buildFecaDet } = require('../afip/mapper');
const { getTicket } = require('../afip/ticket');
const { getLastAuthorized, solicitarCae } = require('../afip/wsfe');
const { readDraft, commitInvoiceAndDraft } = require('../firebase/rtdb');
const { getAdminApp } = require('../firebase/init');
const { generateInvoicePdf } = require('../pdf/generateInvoicePdf');

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

  console.log('📖 emitFromDraft started:', { draftId, kind, env });

  const row = await readDraft(draftId);
  console.log('📖 Draft read from RTDB:', !!row);
  if (!row) {
    const e = new Error('Borrador no encontrado');
    e.code = 'NOT_FOUND';
    throw e;
  }

  const draft = row.val;
  console.log('📖 Draft status:', draft.status);

  let validated;
  try {
    console.log('🔍 Validating draft...');
    validated = validateDraft(draft, kind);
    console.log('✅ Draft validated:', { docTipo: validated.docTipo, cbteTipo: validated.cbteTipo });
  } catch (err) {
    console.error('❌ Draft validation failed:', err.message);
    if (err instanceof DraftValidationError) {
      err.code = err.code || 'VALIDATION';
    }
    throw err;
  }

  console.log('🎫 Getting AFIP ticket...');
  const ta = await getTicket(env, certPem, keyPem);
  console.log('✅ Ticket obtained:', { token: `${ta.token.slice(0, 20)}...`, sign: `${ta.sign.slice(0, 20)}...` });

  const ptoVta = Number(draft.issuer.ptoVta);
  console.log('🔢 Getting last authorized cbte number for ptoVta:', ptoVta, 'cbteTipo:', validated.cbteTipo);
  const last = await getLastAuthorized(env, ta, cuit, ptoVta, validated.cbteTipo);
  console.log('✅ Last authorized number:', last);
  const nextNro = last + 1;
  console.log('📝 Next cbte number will be:', nextNro);

  console.log('🔨 Building FECA request...');
  const built = buildFecaDet(draft, validated, nextNro);
  console.log('✅ FECA request built');
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

  console.log('💬 Requesting CAE from AFIP WSFE...');
  const caeRes = await solicitarCae(
    env,
    ta,
    cuit,
    built.feCabReq,
    built.det,
    built.ivaArray,
    built.cbtesAsoc
  );
  console.log('✅ CAE response received:', { resultado: caeRes.resultado, cae: caeRes.cae, caeFchVto: caeRes.caeFchVto });

  const invoiceId = uuidv4();
  console.log('📋 Generated invoice ID:', invoiceId);

  const baseInvoice = {
    draftId,
    createdAt: Date.now(),
    totals: built.totals.snapshot,
    pdf: null,
  };

  const approved = caeRes.resultado === 'A' && caeRes.cae;
  console.log('✓ Invoice approved by AFIP:', approved);

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
    console.log('💾 Writing approved invoice to RTDB...');
    try {
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
      console.log('✅ Invoice committed to RTDB');
    } catch (dbErr) {
      console.error('❌ Database write failed:', dbErr.message, dbErr.code);
      throw dbErr;
    }

    // Generate and upload PDF
    console.log('💾 PDF: Starting PDF generation and upload process...');
    let pdfUrl = null;
    let pdfDebug = { steps: [], timestamps: {} };
    try {
      console.log('📄 PDF: Step 1 - Generating PDF from draft');
      pdfDebug.timestamps.start = Date.now();
      const pdfBuffer = await generateInvoicePdf({
        draft,
        afip: afipBlock,
        invoiceId,
        totals: built.totals.snapshot,
      });
      console.log('📄 PDF: Generated successfully,', pdfBuffer?.length || 0, 'bytes');
      pdfDebug.steps.push(`generated_${pdfBuffer?.length || 0}_bytes`);
      pdfDebug.timestamps.generated = Date.now();

      console.log('📄 PDF: Step 2 - Getting Firebase Admin app');
      const app = getAdminApp();
      pdfDebug.steps.push('got_app');
      console.log('✅ Got app');

      console.log('📄 PDF: Step 3 - Getting Storage bucket');
      const bucket = app.storage().bucket();
      console.log('✅ Got bucket:', bucket?.name);
      pdfDebug.steps.push(`got_bucket_${bucket?.name}`);
      pdfDebug.timestamps.bucket = Date.now();

      console.log('📄 PDF: Step 4 - Creating file reference');
      const filePath = `invoices/${invoiceId}/factura.pdf`;
      const file = bucket.file(filePath);
      pdfDebug.steps.push('created_file_ref');
      console.log('✅ Created file ref:', filePath);

      console.log('📄 PDF: Step 5 - Uploading PDF to Storage');
      const downloadToken = uuidv4();
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });
      console.log('✅ PDF uploaded to Storage');
      pdfDebug.steps.push('uploaded_to_storage');
      pdfDebug.timestamps.uploaded = Date.now();

      console.log('📄 PDF: Step 6 - Generating public URL');
      const bucketName = bucket.name;
      pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;
      console.log('✅ Got public URL, length:', pdfUrl?.length);
      pdfDebug.steps.push('got_public_url');
      pdfDebug.timestamps.signed = Date.now();

      console.log('📄 PDF: Step 7 - Saving PDF URL to RTDB');
      await app.database().ref(`invoices/${invoiceId}/pdfUrl`).set(pdfUrl);
      console.log('✅ PDF URL saved to RTDB');
      pdfDebug.steps.push('saved_url_to_rtdb');
      pdfDebug.timestamps.complete = Date.now();
      pdfDebug.success = true;
    } catch (pdfErr) {
      console.error('❌ PDF ERROR:', pdfErr.name, '-', pdfErr.message);
      pdfDebug.error = { name: pdfErr.name, message: pdfErr.message };
      pdfDebug.steps.push(`error_${pdfErr.name}`);
      pdfDebug.timestamps.error = Date.now();
    }
    // Save debug info to RTDB
    console.log('📋 PDF: Saving debug info to RTDB');
    await getAdminApp().database().ref(`invoices/${invoiceId}/debug`).set(pdfDebug);
    console.log('✅ PDF Debug info saved');

    console.log('✅ emitFromDraft returning approved invoice, pdfUrl:', !!pdfUrl);
    return {
      invoiceId,
      status: 'APPROVED',
      pdfUrl,
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

  console.log('⚠️ Invoice rejected by AFIP:', rejectMsg);
  console.log('💾 Writing rejected invoice to RTDB...');
  try {
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
    console.log('✅ Rejected invoice committed to RTDB');
  } catch (dbErr) {
    console.error('❌ Database write failed for rejected invoice:', dbErr.message, dbErr.code);
    throw dbErr;
  }

  console.log('✅ emitFromDraft returning rejected invoice');
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
