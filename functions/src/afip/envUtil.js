const { X509Certificate } = require('crypto');

/**
 * Resuelve HOMO | PROD desde el valor del secreto/param (tolera espacios y mayúsculas).
 * @param {string|undefined|null} raw
 * @returns {'HOMO'|'PROD'}
 */
function resolveAfipEnv(raw) {
  const v = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (v === 'PROD' || v === 'PRODUCTION' || v === '1' || v === 'TRUE') {
    return 'PROD';
  }
  return 'HOMO';
}

/**
 * Log no sensible para verificar en Cloud Logging que el PEM es el cert esperado.
 * @param {string} certPem
 */
function logCertSummary(certPem, label = 'AFIP') {
  try {
    const x = new X509Certificate(certPem);
    console.log(`[${label}] Certificado — subject: ${x.subject}`);
    console.log(`[${label}] Certificado — issuer: ${x.issuer}`);
    console.log(`[${label}] Certificado — válido hasta: ${x.validTo}`);
  } catch (e) {
    console.warn(`[${label}] No se pudo parsear el cert PEM:`, e.message);
  }
}

module.exports = { resolveAfipEnv, logCertSummary };
