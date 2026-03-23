const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { getEndpoints } = require('../config/endpoints');
const { escapeXml } = require('./xmlUtil');

const WSFE_SERVICE = 'wsfe';

/**
 * Timestamp para TRA en zona AR (ISO con -03:00).
 * @param {Date} d
 */
function formatAfipTime(d) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t)?.value || '00';
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}.${ms}-03:00`;
}

function buildLoginTicketRequestXml() {
  const uniqueId = String(Math.floor(Math.random() * 1e9));
  const now = new Date();
  const gen = new Date(now.getTime() - 10 * 60 * 1000);
  const exp = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>'
    + '<loginTicketRequest version="1.0">'
    + '<header>'
    + `<uniqueId>${uniqueId}</uniqueId>`
    + `<generationTime>${formatAfipTime(gen)}</generationTime>`
    + `<expirationTime>${formatAfipTime(exp)}</expirationTime>`
    + '</header>'
    + `<service>${WSFE_SERVICE}</service>`
    + '</loginTicketRequest>'
  );
}

/**
 * Firma TRA con OpenSSL (CMS) y devuelve base64 DER.
 * @param {string} certPem
 * @param {string} keyPem
 */
function signTraWithOpenssl(certPem, keyPem) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'afip-wsaa-'));
  const xmlPath = path.join(dir, 'tra.xml');
  const certPath = path.join(dir, 'cert.pem');
  const keyPath = path.join(dir, 'key.pem');
  const cmsPath = path.join(dir, 'tra.cms');
  try {
    fs.writeFileSync(xmlPath, buildLoginTicketRequestXml(), 'utf8');
    fs.writeFileSync(certPath, certPem, 'utf8');
    fs.writeFileSync(keyPath, keyPem, 'utf8');

    execFileSync(
      'openssl',
      [
        'cms',
        '-sign',
        '-in',
        xmlPath,
        '-signer',
        certPath,
        '-inkey',
        keyPath,
        '-nodetach',
        '-outform',
        'DER',
        '-out',
        cmsPath,
      ],
      { stdio: 'pipe' }
    );

    const der = fs.readFileSync(cmsPath);
    return der.toString('base64');
  } finally {
    for (const f of [xmlPath, certPath, keyPath, cmsPath]) {
      try {
        fs.unlinkSync(f);
      } catch (_) {
        /* ignore */
      }
    }
    try {
      fs.rmdirSync(dir);
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * @param {'HOMO'|'PROD'} env
 * @param {string} certPem
 * @param {string} keyPem
 */
async function fetchNewTicketFromWsaa(env, certPem, keyPem) {
  const { wsaaUrl, wsaaSoapNs } = getEndpoints(env);
  const cmsB64 = signTraWithOpenssl(certPem, keyPem);
  const body = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="${wsaaSoapNs}">
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${escapeXml(cmsB64)}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await axios.post(wsaaUrl, body, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: '""',
    },
    timeout: 60000,
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    throw new Error(`WSAA HTTP ${res.status}: ${String(res.data).slice(0, 500)}`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    trim: true,
    removeNSPrefix: true,
  });
  const parsed = parser.parse(String(res.data));
  const ret =
    parsed?.Envelope?.Body?.loginCmsResponse?.loginCmsReturn
    || parsed?.['soapenv:Envelope']?.['soapenv:Body']?.loginCmsResponse?.loginCmsReturn;

  if (!ret || typeof ret !== 'string') {
    throw new Error(`WSAA: respuesta inesperada: ${String(res.data).slice(0, 800)}`);
  }

  const credParser = new XMLParser({
    ignoreAttributes: false,
    trim: true,
    removeNSPrefix: true,
  });
  const credXml = credParser.parse(ret);
  const ltr = credXml.loginTicketResponse || credXml;
  const login = ltr.credentials || credXml.credentials;
  const token = login?.token;
  const sign = login?.sign;
  const hdr = ltr.header || credXml.header;
  const generationTime = login?.generationTime || hdr?.generationTime;
  const expirationTime = login?.expirationTime || hdr?.expirationTime;

  if (!token || !sign) {
    throw new Error(`WSAA: no token/sign en credenciales: ${ret.slice(0, 500)}`);
  }

  let expiresAt = Date.now() + 11 * 60 * 60 * 1000;
  if (expirationTime) {
    const p = Date.parse(String(expirationTime).replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    if (!Number.isNaN(p)) expiresAt = p - 120000;
  }

  return {
    token: String(token),
    sign: String(sign),
    expiresAt,
    generationTime,
    expirationTime,
  };
}

module.exports = {
  fetchNewTicketFromWsaa,
  buildLoginTicketRequestXml,
  signTraWithOpenssl,
};
