/**
 * SHA-256 Hashing Utility
 * ---------------------------------------------------------------
 * Produces a deterministic SHA-256 hash of certificate data.
 * "Canonical" means: given the same logical data, the exact same
 * byte string is produced every time, regardless of key ordering.
 * This is essential — if we hashed JSON.stringify(obj) directly,
 * key order or whitespace differences could produce a different
 * hash for logically identical data, breaking verification.
 */

const crypto = require('crypto');

/**
 * Deterministically stringifies an object by sorting keys recursively.
 */
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  return `{${entries.join(',')}}`;
}

/**
 * Computes SHA-256 hash (hex) of a canonical (sorted-key) JSON
 * representation of the given data object.
 * @param {object} data
 * @returns {string} hex-encoded SHA-256 hash
 */
function sha256OfCanonicalData(data) {
  const canonicalString = stableStringify(data);
  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/** Plain SHA-256 of an arbitrary string (used to hash the canonical string too). */
function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

module.exports = { stableStringify, sha256OfCanonicalData, sha256 };
