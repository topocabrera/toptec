const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { getEndpoints } = require('../config/endpoints');
const { escapeXml } = require('./xmlUtil');

const SOAP_NS = 'http://www.w3.org/2003/05/soap-envelope';
const AR_NS = 'http://ar.gov.afip.dif.FEV1/';

function authXml(token, sign, cuit) {
  return (
    `<ar:Auth>`
    + `<ar:Token>${escapeXml(token)}</ar:Token>`
    + `<ar:Sign>${escapeXml(sign)}</ar:Sign>`
    + `<ar:Cuit>${cuit}</ar:Cuit>`
    + `</ar:Auth>`
  );
}

function wrapSoap12(operation, inner) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="${SOAP_NS}" xmlns:ar="${AR_NS}">
  <soap12:Body>
    <ar:${operation}>
      ${inner}
    </ar:${operation}>
  </soap12:Body>
</soap12:Envelope>`;
}

/**
 * @param {'HOMO'|'PROD'} env
 * @param {string} operation ej. FECompUltimoAutorizado
 * @param {string} innerXml contenido dentro de ar:Operation
 */
async function soapPost(env, operation, innerXml) {
  const { wsfeUrl, wsfeSoapActionBase } = getEndpoints(env);
  const xml = wrapSoap12(operation, innerXml);
  const res = await axios.post(wsfeUrl, xml, {
    headers: {
      'Content-Type': `application/soap+xml; charset=utf-8; action="${wsfeSoapActionBase}${operation}"`,
    },
    timeout: 90000,
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    throw new Error(`WSFE HTTP ${res.status}: ${String(res.data).slice(0, 600)}`);
  }
  return String(res.data);
}

function parseFeSoap(xmlStr) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trim: true,
    removeNSPrefix: true,
  });
  return parser.parse(xmlStr);
}

function parseFeErrors(xmlStr) {
  const root = parseFeSoap(xmlStr);
  const body =
    root?.['soap:Envelope']?.['soap:Body']
    || root?.['soap12:Envelope']?.['soap12:Body']
    || root?.Envelope?.Body;
  return body;
}

/**
 * @param {string} responseXml
 * @param {string} resultTag ej. FECompUltimoAutorizadoResult
 */
function extractResultObject(responseXml, resultTag) {
  const root = parseFeSoap(responseXml);
  const body =
    root?.Envelope?.Body
    || root?.['soap:Envelope']?.['soap:Body']
    || root?.['soap12:Envelope']?.['soap12:Body'];
  if (!body) return { result: null, raw: responseXml };

  const respKey = Object.keys(body).find((k) => k.includes('Response'));
  const resp = respKey ? body[respKey] : body;
  const result = resp?.[resultTag] ?? resp?.[`${resultTag}`] ?? resp;
  return { result, responseBody: body };
}

/**
 * @param {'HOMO'|'PROD'} env
 * @param {{ token: string, sign: string }} ta
 * @param {string|number} cuit
 * @param {number} ptoVta
 * @param {number} cbteTipo
 */
async function getLastAuthorized(env, ta, cuit, ptoVta, cbteTipo) {
  const inner = `${authXml(ta.token, ta.sign, String(cuit).replace(/\D/g, ''))}`
    + `<ar:PtoVta>${ptoVta}</ar:PtoVta>`
    + `<ar:CbteTipo>${cbteTipo}</ar:CbteTipo>`;

  const xml = await soapPost(env, 'FECompUltimoAutorizado', inner);
  const { result } = extractResultObject(xml, 'FECompUltimoAutorizadoResult');

  const err = normalizeErrors(result?.Errors);
  if (err.length) {
    const e = new Error(err.map((x) => x.Msg || x.msg).join('; '));
    e.code = 'WSFE';
    e.obs = err;
    throw e;
  }

  const nro = Number(result?.CbteNro);
  return Number.isFinite(nro) ? nro : 0;
}

function normalizeErrors(errorsNode) {
  if (!errorsNode) return [];
  const arr = errorsNode.Err || errorsNode.err || errorsNode;
  const list = Array.isArray(arr) ? arr : [arr];
  return list.filter(Boolean).map((e) => ({
    Code: e.Code,
    Msg: e.Msg,
  }));
}

function serializeDet(det, ivaArray, cbtesAsoc) {
  let xml = '';
  const keys = [
    'Concepto',
    'DocTipo',
    'DocNro',
    'CbteDesde',
    'CbteHasta',
    'CbteFch',
    'ImpTotal',
    'ImpTotConc',
    'ImpNeto',
    'ImpOpEx',
    'ImpTrib',
    'ImpIVA',
    'FchServDesde',
    'FchServHasta',
    'FchVtoPago',
    'MonId',
    'MonCotiz',
    'CondicionIVAReceptorId',
  ];
  for (const k of keys) {
    const v = det[k];
    if (v === undefined || v === null || v === '') continue;
    xml += `<ar:${k}>${v}</ar:${k}>`;
  }

  if (cbtesAsoc?.length) {
    xml += '<ar:CbtesAsoc>';
    for (const c of cbtesAsoc) {
      xml += '<ar:CbteAsoc>';
      for (const ck of ['Tipo', 'PtoVta', 'Nro', 'Cuit', 'CbteFch']) {
        const cv = c[ck];
        if (cv === undefined || cv === null || cv === '') continue;
        xml += `<ar:${ck}>${cv}</ar:${ck}>`;
      }
      xml += '</ar:CbteAsoc>';
    }
    xml += '</ar:CbtesAsoc>';
  }

  if (ivaArray?.length) {
    xml += '<ar:Iva>';
    for (const a of ivaArray) {
      xml += '<ar:AlicIva>';
      xml += `<ar:Id>${a.Id}</ar:Id><ar:BaseImp>${a.BaseImp}</ar:BaseImp><ar:Importe>${a.Importe}</ar:Importe>`;
      xml += '</ar:AlicIva>';
    }
    xml += '</ar:Iva>';
  }

  return xml;
}

/**
 * @param {'HOMO'|'PROD'} env
 * @param {{ token: string, sign: string }} ta
 * @param {string|number} cuit
 * @param {object} feCabReq
 * @param {object} det
 * @param {object[]} ivaArray
 * @param {object[]|undefined} cbtesAsoc
 */
async function solicitarCae(env, ta, cuit, feCabReq, det, ivaArray, cbtesAsoc) {
  const cuitClean = String(cuit).replace(/\D/g, '');
  const cab = ''
    + `<ar:CantReg>${feCabReq.CantReg}</ar:CantReg>`
    + `<ar:PtoVta>${feCabReq.PtoVta}</ar:PtoVta>`
    + `<ar:CbteTipo>${feCabReq.CbteTipo}</ar:CbteTipo>`;

  const detXml = serializeDet(det, ivaArray, cbtesAsoc);
  const inner = `${authXml(ta.token, ta.sign, cuitClean)}`
    + '<ar:FeCAEReq>'
    + '<ar:FeCabReq>'
    + cab
    + '</ar:FeCabReq>'
    + '<ar:FeDetReq>'
    + '<ar:FECAEDetRequest>'
    + detXml
    + '</ar:FECAEDetRequest>'
    + '</ar:FeDetReq>'
    + '</ar:FeCAEReq>';

  const xml = await soapPost(env, 'FECAESolicitar', inner);
  const { result } = extractResultObject(xml, 'FECAESolicitarResult');

  const feCabResp = result?.FeCabResp;
  const feDetResp = result?.FeDetResp;
  let detResp = feDetResp?.FECAEDetResponse ?? feDetResp;
  if (Array.isArray(detResp)) {
    [detResp] = detResp;
  }

  const errs = normalizeErrors(result?.Errors);
  const obs = detResp?.Observaciones?.Obs
    ? (Array.isArray(detResp.Observaciones.Obs) ? detResp.Observaciones.Obs : [detResp.Observaciones.Obs])
    : [];

  const resultado = detResp?.Resultado || feCabResp?.Resultado;
  const cae = detResp?.CAE;
  const caeFchVto = detResp?.CAEFchVto;

  return {
    rawXml: xml,
    result,
    feCabResp,
    detResp,
    resultado,
    cae,
    caeFchVto,
    errors: errs,
    observations: obs,
  };
}

module.exports = {
  getLastAuthorized,
  solicitarCae,
  soapPost,
  extractResultObject,
};
