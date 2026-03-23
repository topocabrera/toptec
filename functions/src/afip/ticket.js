const { fetchNewTicketFromWsaa } = require('./wsaa');
const { readCachedTa, writeCachedTa } = require('../firebase/rtdb');

const memoryTa = { HOMO: null, PROD: null };
const SKEW_MS = 3 * 60 * 1000;

function isFresh(entry) {
  return entry && entry.token && entry.sign && Number(entry.expiresAt) > Date.now() + SKEW_MS;
}

/**
 * TA con cache en memoria + RTDB.
 * @param {'HOMO'|'PROD'} env
 * @param {string} certPem
 * @param {string} keyPem
 */
async function getTicket(env, certPem, keyPem) {
  if (isFresh(memoryTa[env])) {
    return { token: memoryTa[env].token, sign: memoryTa[env].sign };
  }

  const disk = await readCachedTa(env);
  if (isFresh(disk)) {
    memoryTa[env] = disk;
    return { token: disk.token, sign: disk.sign };
  }

  const fresh = await fetchNewTicketFromWsaa(env, certPem, keyPem);
  memoryTa[env] = fresh;
  await writeCachedTa(env, {
    token: fresh.token,
    sign: fresh.sign,
    expiresAt: fresh.expiresAt,
    updatedAt: Date.now(),
  });
  return { token: fresh.token, sign: fresh.sign };
}

module.exports = { getTicket, isFresh };
