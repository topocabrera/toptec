const { getAdminApp } = require('./init');

function db() {
  return getAdminApp().database();
}

/**
 * @param {string} draftId
 * @returns {Promise<{ key: string, val: object } | null>}
 */
async function readDraft(draftId) {
  const snap = await db().ref(`drafts/${draftId}`).once('value');
  const val = snap.val();
  if (!val) return null;
  return { key: draftId, val };
}

/**
 * Cache TA en RTDB (sobrevive cold starts mejor que solo memoria).
 * @param {'HOMO'|'PROD'} env
 */
async function readCachedTa(env) {
  const snap = await db().ref(`afipTokens/${env}`).once('value');
  return snap.val();
}

/**
 * @param {'HOMO'|'PROD'} env
 * @param {{ token: string, sign: string, expiresAt: number }} payload
 */
async function writeCachedTa(env, payload) {
  await db().ref(`afipTokens/${env}`).set(payload);
}

/**
 * @param {string} invoiceId
 * @param {object} payload
 */
async function writeInvoice(invoiceId, payload) {
  await db().ref(`invoices/${invoiceId}`).set(payload);
}

/**
 * Actualización atómica: factura + estado del borrador.
 * @param {string} draftId
 * @param {string} invoiceId
 * @param {object} invoicePayload
 * @param {object} draftPatch
 */
async function commitInvoiceAndDraft(draftId, invoiceId, invoicePayload, draftPatch) {
  const updates = {
    [`invoices/${invoiceId}`]: invoicePayload,
    [`drafts/${draftId}/updatedAt`]: Date.now(),
    ...Object.fromEntries(
      Object.entries(draftPatch || {}).map(([k, v]) => [`drafts/${draftId}/${k}`, v])
    ),
  };
  await db().ref().update(updates);
}

module.exports = {
  db,
  readDraft,
  readCachedTa,
  writeCachedTa,
  writeInvoice,
  commitInvoiceAndDraft,
};
