# Cloud Functions — Facturación AFIP/ARCA

Emisión vía **WSAA** (ticket) + **WSFE** (último comprobante + CAE). Certificado y clave **solo** en secretos.

## Endpoints (HTTPS)

| Función           | Método | Body JSON           | Header                          |
|-------------------|--------|---------------------|---------------------------------|
| `emitInvoice`     | POST   | `{ "draftId": "…" }` | `Authorization: Bearer <token>` |
| `emitCreditNote`  | POST   | `{ "draftId": "…" }` | igual                           |

Región por defecto: `southamerica-east1` (ajustá en `index.js` si preferís otra).

## Secretos y parámetros

```bash
# Crear secretos (te pedirá el valor; para PEM pegá el archivo completo)
firebase functions:secrets:set AFIP_CERT_PEM
firebase functions:secrets:set AFIP_KEY_PEM
firebase functions:secrets:set AFIP_CUIT
firebase functions:secrets:set EMIT_API_TOKEN
```

En el primer deploy, Firebase pedirá enlazar los secretos a las funciones.

**AFIP_ENV**: parámetro de entorno `HOMO` (default) o `PROD`. Con Firebase Functions v2 podés definirlo al desplegar (consola GCP → la función → Variables/Parámetros) o según la guía actual de [params](https://firebase.google.com/docs/functions/config-env#params).

## RTDB

- Borradores: `drafts/{draftId}` (estructura en `files/plan.md`).
- Emitidos: `invoices/{invoiceId}`.
- Cache TA: `afipTokens/HOMO` o `afipTokens/PROD` — `{ token, sign, expiresAt, updatedAt }`.

El proyecto Firebase debe tener **Realtime Database** habilitada; `initializeApp()` usa la URL por defecto del proyecto.

## Desarrollo local

```bash
cd functions
npm install
npm test
```

Homologación AFIP requiere certificado de testing y punto de venta habilitado en **wsfe**.

## OpenSSL

La firma del TRA usa el binario `openssl` del entorno de ejecución (disponible en Cloud Functions). Si tu certificado requiere proveedores legacy en OpenSSL 3, puede ser necesario ajustar flags en `afip/wsaa.js`.

## Próximo paso (PDF + Storage)

Tras `APPROVED`, generar PDF (p. ej. pdfkit), subir a Cloud Storage y escribir `invoices/{id}/pdf`.
