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
  console.log('🎫 getTicket called, env:', env);

  if (isFresh(memoryTa[env])) {
    console.log('✅ Using fresh token from memory');
    return { token: memoryTa[env].token, sign: memoryTa[env].sign };
  }
  console.log('📀 Memory cache not fresh, trying disk...');

  const disk = await readCachedTa(env);
  console.log('📀 Disk cache read:', !!disk);
  if (isFresh(disk)) {
    console.log('✅ Using fresh token from disk');
    memoryTa[env] = disk;
    return { token: disk.token, sign: disk.sign };
  }
  console.log('🔄 No fresh cache, fetching new ticket from WSAA...');

  try {
    const fresh = await fetchNewTicketFromWsaa(env, certPem, keyPem);
    console.log('✅ New ticket fetched, expiresAt:', new Date(fresh.expiresAt).toISOString());
    memoryTa[env] = fresh;
    await writeCachedTa(env, {
      token: fresh.token,
      sign: fresh.sign,
      expiresAt: fresh.expiresAt,
      updatedAt: Date.now(),
    });
    console.log('✅ New ticket cached');
    return { token: fresh.token, sign: fresh.sign };
  } catch (err) {
    console.error('❌ WSAA fetch failed:', err.name, err.message);
    throw err;
  }
}

module.exports = { getTicket, isFresh };
