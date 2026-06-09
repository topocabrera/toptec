const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const cors = require('cors')({ origin: true });
const { emitFromDraft, DraftValidationError } = require('./src/handlers/emitComprobante');
const { resolveAfipEnv, logCertSummary } = require('./src/afip/envUtil');

// Define secrets
const afipCertPem = defineSecret('AFIP_CERT_PEM');
const afipKeyPem = defineSecret('AFIP_KEY_PEM');
const afipCuit = defineSecret('AFIP_CUIT');
const afipEnv = defineSecret('AFIP_ENV');

/**
 * Cloud Function: emitInvoice
 * Method: POST
 * Body: { "draftId": "..." }
 */
exports.emitInvoice = onRequest(
  { region: 'southamerica-east1', timeoutSeconds: 120, secrets: [afipCertPem, afipKeyPem, afipCuit, afipEnv] },
  (req, res) => {
    cors(req, res, async () => {
      try {
        console.log('🔥 emitInvoice called');

        const { draftId } = req.body;
        console.log('📋 draftId:', draftId);

        if (!draftId) {
          console.error('❌ No draftId');
          return res.status(400).json({ error: 'draftId requerido' });
        }

        try {
          console.log('🔐 Checking secrets...');
          const certPem = afipCertPem.value();
          const keyPem = afipKeyPem.value();
          const cuitRaw = afipCuit.value();
          const env = resolveAfipEnv(afipEnv.value());

          console.log('📦 Secrets status:', {
            certPem: !!certPem ? `(${certPem.length} chars)` : '❌ MISSING',
            keyPem: !!keyPem ? `(${keyPem.length} chars)` : '❌ MISSING',
            cuitRaw: !!cuitRaw ? `(${cuitRaw.length} chars)` : '❌ MISSING',
            env,
            afipEnvSecretLen: String(afipEnv.value() ?? '').length,
          });

          logCertSummary(certPem, `emitInvoice:${env}`);

          if (!certPem || !keyPem || !cuitRaw) {
            const msg = `Missing AFIP credentials: cert=${!!certPem}, key=${!!keyPem}, cuit=${!!cuitRaw}`;
            console.error('❌', msg);
            return res.status(500).json({ error: msg });
          }

          console.log('✅ Secrets OK');
          const cuit = cuitRaw.replace(/\D/g, '');

          console.log('🚀 Calling emitFromDraft...');
          let result;
          try {
            result = await emitFromDraft({
              env,
              cuit,
              certPem,
              keyPem,
              draftId,
              kind: 'INVOICE',
            });
          } catch (emitErr) {
            console.error('❌ emitFromDraft threw error:', {
              name: emitErr.name,
              message: emitErr.message,
              code: emitErr.code,
            });
            throw emitErr;
          }

          console.log('✅ emitFromDraft success, returning:', JSON.stringify(result).substring(0, 100));
          return res.status(200).json(result);
        } catch (err) {
          console.error('💥 Error in emitInvoice:', err.message);

          if (err instanceof DraftValidationError) {
            return res.status(400).json({ error: err.message });
          }
          if (err.code === 'NOT_FOUND') {
            return res.status(404).json({ error: err.message });
          }
          return res.status(500).json({ error: `Error: ${err.message}` });
        }
      } catch (err) {
        console.error('💥 Unexpected error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);

/**
 * Cloud Function: emitCreditNote
 * Method: POST
 * Body: { "draftId": "..." }
 */
exports.emitCreditNote = onRequest(
  { region: 'southamerica-east1', timeoutSeconds: 120, secrets: [afipCertPem, afipKeyPem, afipCuit, afipEnv] },
  (req, res) => {
    cors(req, res, async () => {
      try {
        console.log('🔥 emitCreditNote called');

        const { draftId } = req.body;
        if (!draftId) {
          console.error('❌ No draftId');
          return res.status(400).json({ error: 'draftId requerido' });
        }

        try {
          const certPem = afipCertPem.value();
          const keyPem = afipKeyPem.value();
          const cuitRaw = afipCuit.value();
          const env = resolveAfipEnv(afipEnv.value());

          logCertSummary(certPem, `emitCreditNote:${env}`);

          if (!certPem || !keyPem || !cuitRaw) {
            const msg = 'Missing AFIP credentials. Check Secret Manager configuration.';
            console.error(msg);
            return res.status(500).json({ error: msg });
          }

          const cuit = cuitRaw.replace(/\D/g, '');

          const result = await emitFromDraft({
            env,
            cuit,
            certPem,
            keyPem,
            draftId,
            kind: 'CREDIT_NOTE',
          });

          return res.status(200).json(result);
        } catch (err) {
          if (err instanceof DraftValidationError) {
            return res.status(400).json({ error: err.message });
          }
          if (err.code === 'NOT_FOUND') {
            return res.status(404).json({ error: err.message });
          }
          console.error('emitCreditNote error:', err.message);
          return res.status(500).json({ error: `Error: ${err.message}` });
        }
      } catch (err) {
        console.error('💥 Unexpected error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
);
