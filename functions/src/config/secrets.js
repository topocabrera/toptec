/**
 * Referencia de secretos y parámetros (no lee archivos: solo documentación en código).
 *
 * Secretos (Firebase/Google Secret Manager, vinculados al deploy):
 *   AFIP_CERT_PEM   — certificado X.509 en PEM (texto)
 *   AFIP_KEY_PEM    — clave privada en PEM (texto)
 *   AFIP_CUIT       — CUIT del emisor (11 dígitos, puede ir con guiones)
 *   EMIT_API_TOKEN  — Bearer token para llamar a emitInvoice / emitCreditNote
 *
 * Parámetro (defineString en index.js, default HOMO):
 *   AFIP_ENV        — HOMO | PROD
 */

module.exports = {
  SECRET_IDS: ['AFIP_CERT_PEM', 'AFIP_KEY_PEM', 'AFIP_CUIT', 'EMIT_API_TOKEN'],
  STRING_PARAMS: ['AFIP_ENV'],
};
