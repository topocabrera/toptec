Plan técnico (React + Firebase RTDB + Cloud Functions) para facturación ARCA/AFIP (WSFE + WSAA) + Notas de Crédito
Objetivo
Mantener tu arquitectura actual (React → Realtime Database) y agregar un “backend” seguro con Firebase Cloud Functions (Node.js) para emitir comprobantes oficiales:

Monotributo: Factura C / NC C
Responsable Inscripto: Factura A/B / NC A/B
Alícuotas IVA: 21% y 10.5%, más Exento / No gravado
Guardar CAE, vencimiento, número, request/response, PDF (opcional)
0) Decisiones base
No se integra desde el frontend: WSAA/WSFE requiere certificado + clave privada → solo en Cloud Functions.
CUIT fijo: un emisor único simplifica.
RTDB como fuente de verdad: drafts y comprobantes finales quedan persistidos ahí.
Homologación primero (ambiente de testing de AFIP/ARCA), luego producción.
1) Estructura de datos en Realtime Database (propuesta)
1.1. Borrador de comprobante (draft)
/drafts/{draftId}

json
Copiar código
{
  "status": "DRAFT", 
  "createdAt": 1710000000000,
  "updatedAt": 1710000000000,

  "source": { "type": "remito", "remitoId": "R-123" },

  "customer": {
    "docTipo": "CUIT|DNI|CONSUMIDOR_FINAL",
    "docNro": "20123456789|12345678|0",
    "name": "Cliente SA",
    "address": "..."
  },

  "issuer": {
    "ptoVta": 3,
    "condicionIva": "RI|MONO"
  },

  "cbte": {
    "type": "FA|FB|FC|NCA|NCB|NCC",
    "concepto": 1, 
    "fecha": "20260320",
    "moneda": "PES",
    "cotizacion": 1
  },

  "items": [
    {
      "sku": "ABC",
      "description": "Producto 1",
      "qty": 2,
      "unitPriceNet": 1000,
      "discount": 0,

      "tax": {
        "mode": "GRAVADO|EXENTO|NOGRAVADO",
        "ivaRate": 21
      }
    }
  ],

  "references": {
    "original": {
      "ptoVta": 3,
      "cbteTipo": "FA|FB|FC",
      "cbteNro": 1234,
      "cuit": "TU_CUIT"
    }
  }
}
Notas:

concepto: 1=Productos, 2=Servicios, 3=Productos y Servicios. Para remitos suele ser 1.
Para Nota de Crédito, references.original es obligatorio.
1.2. Comprobante emitido
/invoices/{invoiceId}

json
Copiar código
{
  "status": "APPROVED|REJECTED",
  "draftId": "xxx",

  "afip": {
    "env": "HOMO|PROD",
    "ptoVta": 3,
    "cbteTipo": 1,
    "cbteNro": 1234,
    "cae": "71234567890123",
    "caeVto": "20260401",
    "result": "A|R",
    "observations": [],
    "request": {},
    "response": {}
  },

  "totals": {
    "neto": 2000,
    "iva21": 420,
    "iva105": 210,
    "exento": 0,
    "noGravado": 0,
    "total": 2630
  },

  "pdf": { "url": "gs://..." }
}
2) Cloud Functions: endpoints (Callable o HTTPS)
Te recomiendo HTTPS Callable si ya usás Firebase Auth; como dijiste que tu auth es propio, podés usar HTTPS onRequest con tu verificación.

Funciones mínimas
POST /emitInvoice

input: { draftId }
output: { invoiceId, afip: { cbteNro, cae, caeVto }, status }
POST /emitCreditNote

input: { draftId } (draft con references.original completo)
output similar
(Opcional) GET /invoice/:id si preferís no leer RTDB desde front.

3) Módulos internos en Functions (Node.js)
Estructura propuesta:

scss
Copiar código
functions/
  src/
    index.js
    afip/
      wsaa.js
      wsfe.js
      types.js (constantes tipos comprobante, doc types, iva)
      calc.js (cálculos neto/iva/total)
      mapper.js (draft -> FECAEReq)
      validators.js
    firebase/
      rtdb.js
    config/
      secrets.js
4) WSAA (Token/Sign) – implementación y cache
Qué hacer
Generar loginTicketRequest (XML)
Firmarlo con tu clave privada
Enviar a WSAA
Obtener token + sign
Cachear el TA (por ejemplo en memoria + respaldo en RTDB o Firestore) con vencimiento
Cache recomendado
Guardar en memoria (rápido) y también: /afipTokens/{env}:
json
Copiar código
{ "token": "...", "sign": "...", "expiresAt": 1710000000000 }
Así, si la function “se enfría”, no pedís WSAA cada vez.

5) WSFE – flujo de emisión
Paso a paso dentro de emitInvoice
Leer draft desde RTDB.
Validar:
ptoVta, tipo de comprobante coherente con condición IVA (RI/Mono)
cliente docTipo/docNro presentes
items > 0
importes no negativos
Calcular totales (ver sección 6).
Obtener TA (WSAA).
Llamar FECompUltimoAutorizado para (ptoVta, cbteTipo) → lastNro
nextNro = lastNro + 1
Construir FECAEReq y llamar FECAESolicitar
Si aprobado:
guardar en /invoices/{invoiceId} con CAE, vto, nro, request/response
marcar draft como EMITTED
Si rechazado:
guardar REJECTED + observaciones y respuesta completa
6) Cálculos (precio base sin IVA, con opción 21 / 10.5 / exento / no gravado)
Tus remitos guardan unitPriceNet (sin IVA). Perfecto.

Por ítem
base = qty * unitPriceNet - discount
Si mode = GRAVADO:
iva = base * (ivaRate/100)
acumular por alícuota (21 o 10.5)
Si mode = EXENTO:
va a ImpOpEx
Si mode = NOGRAVADO:
va a ImpTotConc (conceptos no gravados)
totalItem = base + iva (si gravado) o base (si exento/no gravado)
Totales del comprobante (WSFE típicos)
ImpNeto: suma bases gravadas
ImpIVA: suma IVA
ImpOpEx: suma exentos
ImpTotConc: suma no gravados
ImpTotal: suma final
Iva (array): solo si hay gravado, por alícuota:
21% y/o 10.5% con BaseImp y Importe
Importante: redondeo consistente (2 decimales). Definí un helper round2() y usalo siempre.

7) Mapeos clave para WSFE (para implementar en mapper.js)
7.1 Tipo de comprobante (CbteTipo)
No hardcodeo números acá porque varían por tabla AFIP; en el código definilo en constantes (ej: FACTURA_A, FACTURA_B, FACTURA_C, NC_A, etc.) y confirmalo contra el WSFE “paramétricas”.

7.2 DocTipo / DocNro del receptor
CUIT → doc tipo CUIT, doc nro 11 dígitos
DNI → doc tipo DNI, doc nro
Consumidor final → doc tipo “Consumidor Final” y doc nro 0 (dependiendo reglas vigentes)
7.3 Fechas
CbteFch formato YYYYMMDD string.
7.4 IVA
Si no hay gravado, normalmente Iva puede omitirse o ir vacío (según tipo de comprobante; validar en homologación).
8) Notas de Crédito (NC)
Reglas prácticas
La NC debe tener mismo tipo “familia” que la factura original:
Factura A → NC A
Factura C → NC C
Debe incluir referencia al comprobante original. En WSFE se hace con un bloque de “comprobantes asociados”.
Cómo lo modelás
En draft, completás:
references.original: { ptoVta, cbteTipo, cbteNro, cuit }

En mapper:

Agregar CbtesAsoc o equivalente con esos datos.
9) Secrets / Configuración (Functions)
Necesitás separar homologación y producción:

AFIP_ENV=HOMO|PROD
AFIP_CUIT=...
AFIP_CERT_PEM=...
AFIP_KEY_PEM=...
URLs WSDL/Endpoints para WSAA/WSFE según ambiente
Guardarlo en Secret Manager (ideal) o functions:config:set si no querés SM (menos ideal).

10) PDF (opcional pero recomendado)
Después de aprobar CAE:

Generar PDF con pdfkit o similar en la function
Subir a Cloud Storage
Guardar URL en /invoices/{id}/pdf/url
Incluí en PDF:

tipo + letra, punto de venta, número
CAE + fecha vto CAE
datos emisor/receptor
importes + IVA discriminado si corresponde
11) Checklist de implementación (para que Cursor lo ejecute paso a paso)
Crear proyecto functions y desplegar “hello world”.
Implementar RTDB read/write helpers.
Implementar calc.js con tests locales (mismos casos de 21%, 10.5%, exento/no gravado).
Implementar WSAA getTA(env) con cache.
Implementar WSFE:
getLastVoucher(ptoVta, cbteTipo)
requestCAE(payload)
Implementar emitInvoice(draftId) end-to-end en homologación.
Guardar factura final en RTDB y reflejar estado en UI.
Implementar NC repitiendo el flujo con comprobante asociado.
Agregar PDF.
Pasar a producción (nuevo cert + endpoints + validaciones finales).

12) Implementación en este repo (Cloud Functions)
Carpeta `functions/` con módulos `src/afip/{wsaa,wsfe,calc,mapper,validators}.js`, `ticket.js` (cache TA), `src/handlers/emitComprobante.js`, `src/firebase/rtdb.js`.

**HTTPS** (región `southamerica-east1`): `emitInvoice`, `emitCreditNote`. Autenticación: header `Authorization: Bearer <EMIT_API_TOKEN>` (secreto). Body JSON: `{ "draftId": "..." }`.

**Secretos**: `AFIP_CERT_PEM`, `AFIP_KEY_PEM`, `AFIP_CUIT`, `EMIT_API_TOKEN`. Parámetro `AFIP_ENV` (default `HOMO`). Ver `functions/README.md` y `functions/src/config/secrets.js`.

**Cache WSAA** en RTDB: `afipTokens/HOMO` | `afipTokens/PROD` → `{ token, sign, expiresAt, updatedAt }`.

**Estados borrador** tras emisión: `EMITTED` + `invoiceId` si CAE OK; `EMIT_FAILED` si rechazo (igual se crea registro en `invoices` con `status: REJECTED`).

13) Mapeo remito / pedido (`facturaTemplate.js`) → `draft.items`
En pantalla de remito los productos usan `codigo`, `descripcion`, `cantidad`, `precio`, `descuento` (% en UI), `subtotal`. En el **draft** AFIP conviene:
- `sku` ← `codigo`
- `description` ← `descripcion`
- `qty` ← `cantidad`
- `unitPriceNet` ← precio **neto sin IVA** (si hoy `precio` es otro criterio, convertir en cliente antes de guardar el draft).
- `discount` ← **importe fijo** de bonificación de la línea (no porcentaje): por ejemplo `qty * unitPriceNet * (parseFloat(descuento||0)/100)` si `descuento` es % como en la tabla actual.
- `tax.mode` / `tax.ivaRate` ← elegidos por ítem en la UI (`GRAVADO` 21 o 10.5, `EXENTO`, `NOGRAVADO`).

`customer.docTipo` / `docNro`: mapear desde cliente (ej. CUIT en `currentClient.dni` si aplica). Opcional AFIP RG 5618: `customer.condicionIvaReceptorId` (número paramétrico).