/**
 * Redondeo monetario consistente (2 decimales).
 * @param {number} n
 */
function round2(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return 0;
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

module.exports = { round2 };
