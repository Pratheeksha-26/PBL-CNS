/**
 * Builds the canonical data object for a certificate.
 *
 * CRITICAL: This exact same function MUST be used both:
 *   1. At issuance time (to compute the hash that gets signed), and
 *   2. At verification time (to recompute the hash from stored fields
 *      and compare it against the stored hash / signature).
 *
 * If the two call sites ever construct the object differently, valid
 * certificates would incorrectly show as TAMPERED. Only fields that
 * are printed on the certificate / are part of its "meaning" are
 * included here — never internal DB fields like _id, timestamps, etc.
 */

function buildCanonicalCertificateData({
  certificateId,
  athleteName,
  athleteEmail,
  eventName,
  sportName,
  achievement,
  position,
  eventDate,
  issuingAuthority,
}) {
  return {
    certificateId: String(certificateId),
    athleteName: String(athleteName).trim(),
    athleteEmail: String(athleteEmail).trim().toLowerCase(),
    eventName: String(eventName).trim(),
    sportName: String(sportName).trim(),
    achievement: String(achievement).trim(),
    position: String(position || '').trim(),
    eventDate: new Date(eventDate).toISOString().slice(0, 10), // normalize to YYYY-MM-DD
    issuingAuthority: String(issuingAuthority).trim(),
  };
}

module.exports = { buildCanonicalCertificateData };
