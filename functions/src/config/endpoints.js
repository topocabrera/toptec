/**
 * URLs WSAA / WSFE según ambiente (homologación vs producción).
 * @param {'HOMO'|'PROD'} env
 */
function getEndpoints(env) {
  const isProd = env === 'PROD';
  return {
    wsaaUrl: isProd
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfeUrl: isProd
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
    wsfeSoapActionBase: 'http://ar.gov.afip.dif.FEV1/',
    wsaaSoapNs: 'http://wsaa.view.sua.dvadac.desein.afip.gov',
  };
}

module.exports = { getEndpoints };
