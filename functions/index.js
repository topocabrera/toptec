const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { emitFromDraft, DraftValidationError } = require('./src/handlers/emitComprobante');

const afipCertPem = defineSecret('AFIP_CERT_PEM');
const afipKeyPem = defineSecret('AFIP_KEY_PEM');
const afipCuit = defineSecret('AFIP_CUIT');
const emitApiToken = defineSecret('EMIT_API_TOKEN');
const afipEnv = defineString('AFIP_ENV', { default: 'HOMO' });

const secrets = [afipCertPem, afipKeyPem, afipCuit, emitApiToken];

function cors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseBearer(req) {
  const h = req.get('authorization') || req.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

function requireJsonBody(req) {
  if (req.method !== 'POST') return null;
  const b = req.body;
  if (typeof b === 'string') {
    try {
      return JSON.parse(b || '{}');
    } catch {
      return null;
    }
  }
  return b && typeof b === 'object' ? b : null;
}

/**
 * POST { "draftId": "..." }
 * Header: Authorization: Bearer <EMIT_API_TOKEN>
 */
exports.emitInvoice = onRequest(
  { region: 'southamerica-east1', secrets },
  async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST requerido' });
      return;
    }
    const token = parseBearer(req);
    if (!token || token !== emitApiToken.value()) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }
    const body = requireJsonBody(req);
    const draftId = body?.draftId;
    if (!draftId) {
      res.status(400).json({ error: 'draftId requerido' });
      return;
    }

    const env = afipEnv.value() === 'PROD' ? 'PROD' : 'HOMO';
    const cuit = afipCuit.value().replace(/\D/g, '');

    try {
      const out = await emitFromDraft({
        env,
        cuit,
        certPem: afipCertPem.value(),
        keyPem: afipKeyPem.value(),
        draftId,
        kind: 'INVOICE',
      });
      res.status(200).json(out);
    } catch (err) {
      if (err instanceof DraftValidationError) {
        res.status(400).json({ error: err.message, code: err.code });
        return;
      }
      if (err.code === 'NOT_FOUND') {
        res.status(404).json({ error: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ error: err.message || 'Error interno' });
    }
  }
);

/**
 * POST { "draftId": "..." } — borrador tipo NCA/NCB/NCC con references.original
 */
exports.emitCreditNote = onRequest(
  { region: 'southamerica-east1', secrets },
  async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST requerido' });
      return;
    }
    const token = parseBearer(req);
    if (!token || token !== emitApiToken.value()) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }
    const body = requireJsonBody(req);
    const draftId = body?.draftId;
    if (!draftId) {
      res.status(400).json({ error: 'draftId requerido' });
      return;
    }

    const env = afipEnv.value() === 'PROD' ? 'PROD' : 'HOMO';
    const cuit = afipCuit.value().replace(/\D/g, '');

    try {
      const out = await emitFromDraft({
        env,
        cuit,
        certPem: afipCertPem.value(),
        keyPem: afipKeyPem.value(),
        draftId,
        kind: 'CREDIT_NOTE',
      });
      res.status(200).json(out);
    } catch (err) {
      if (err instanceof DraftValidationError) {
        res.status(400).json({ error: err.message, code: err.code });
        return;
      }
      if (err.code === 'NOT_FOUND') {
        res.status(404).json({ error: err.message });
        return;
      }
      console.error(err);
      res.status(500).json({ error: err.message || 'Error interno' });
    }
  }
);
