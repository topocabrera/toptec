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

## Producción vs homologación (error «Certificado no emitido por AC de confianza»)

Ese mensaje lo devuelve **WSAA de producción** cuando el CMS está firmado con un certificado cuya **autoridad certificadora no es la que producción confía** (típico: certificado de **homologación** o de otro entorno).

Qué verificar:

1. **Mismo par certificado + entorno**  
   - Producción: certificado emitido desde Clave Fiscal → **Administrador de Certificados Digitales** (servicio de producción, no el de homologación/testing).  
   - Secreto `AFIP_CERT_PEM` / `AFIP_KEY_PEM` en la función que desplegás en prod deben ser **esos** PEM (clave que corresponde al `.crt`).

2. **Secreto `AFIP_ENV`**  
   Debe resolverse a producción: valor `PROD` (también aceptamos `production`, `1`, `true` tras normalizar). Si está vacío o mal escrito, la función usa **HOMO** (URLs de homologación) y un cert de **producción** puede fallar con un error de confianza en el otro sentido.

3. **Versión del secreto en Google Cloud**  
   Tras subir un cert nuevo, confirmá que la función usa la **versión actual** del secreto (redeploy si hace falta).

4. **Comprobar el cert localmente** (issuer de homologación vs producción):

   ```bash
   openssl x509 -in cert.pem -noout -issuer -subject -dates
   ```

5. **Logs de la función**  
   Tras el deploy reciente se registra `issuer` / `subject` del PEM (sin exponer la clave). Compará con el certificado que AFIP te dio para **producción**.

Las URLs de producción en código son `wsaa.afip.gov.ar` y `servicios1.afip.gov.ar/wsfev1` (ver `src/config/endpoints.js`).

## OpenSSL

La firma del TRA usa el binario `openssl` del entorno de ejecución (disponible en Cloud Functions). Si tu certificado requiere proveedores legacy en OpenSSL 3, puede ser necesario ajustar flags en `afip/wsaa.js`.

## Próximo paso (PDF + Storage)

Tras `APPROVED`, generar PDF (p. ej. pdfkit), subir a Cloud Storage y escribir `invoices/{id}/pdf`.
