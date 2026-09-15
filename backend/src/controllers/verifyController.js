const Certificate = require('../models/Certificate');
const { buildCanonicalCertificateData } = require('../utils/canonicalCertificate');
const { sha256OfCanonicalData } = require('../utils/crypto/hash');
const { verifySignature } = require('../utils/crypto/rsa');

/**
 * GET /api/verify/:certificateId
 *
 * PUBLIC endpoint — no authentication required. This is intentional
 * per the spec: verifiers/recruiters must be able to check a
 * certificate via QR/Certificate ID "without accessing private
 * system data". Only non-sensitive certificate fields are returned;
 * no athlete contact info, no signatures/keys, no internal IDs.
 *
 * CRYPTOGRAPHIC VERIFICATION FLOW:
 *   1. Retrieve the stored certificate by certificateId
 *   2. Reconstruct the EXACT canonical data from stored snapshot fields
 *   3. Recompute SHA-256 hash of that canonical data
 *   4. Compare recomputed hash to the stored hash
 *        -> mismatch means the stored data was altered => TAMPERED
 *   5. Verify the RSA-SHA256 signature (stored) against the recomputed
 *      hash using the issuing authority's PUBLIC key
 *        -> failure means signature doesn't match => INVALID
 *   6. Only if both checks pass: AUTHENTIC / VALID
 */
async function verifyCertificate(req, res, next) {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return res.status(404).json({
        success: true,
        result: 'NOT_FOUND',
        message: 'No certificate exists with this ID. It may be invalid or fabricated.',
      });
    }

    // STEP 2: Rebuild canonical data from the stored snapshot
    const canonicalData = buildCanonicalCertificateData({
      certificateId: certificate.certificateId,
      athleteName: certificate.athleteName,
      athleteEmail: certificate.athleteEmail,
      eventName: certificate.eventName,
      sportName: certificate.sportName,
      achievement: certificate.achievement,
      position: certificate.position,
      eventDate: certificate.eventDate,
      issuingAuthority: certificate.issuingAuthority,
    });

    // STEP 3: Recompute SHA-256 hash
    const recomputedHash = sha256OfCanonicalData(canonicalData);

    // STEP 4: Compare hashes -> detects tampering with stored record fields
    const hashMatches = recomputedHash === certificate.canonicalDataHash;

    // STEP 5: Verify RSA signature against the STORED hash using public key
    const signatureValid = verifySignature(certificate.canonicalDataHash, certificate.signature);

    let result;
    let message;

    if (certificate.status === 'revoked') {
      result = 'REVOKED';
      message = 'This certificate was revoked by the issuing authority and is no longer valid.';
    } else if (!hashMatches) {
      result = 'TAMPERED';
      message = 'The certificate data does not match its original cryptographic hash. This record may have been altered.';
    } else if (!signatureValid) {
      result = 'INVALID';
      message = 'The digital signature could not be verified against the issuing authority\'s public key.';
    } else {
      result = 'VALID';
      message = 'This certificate is authentic and has not been tampered with.';
    }

    const isAuthentic = result === 'VALID';

    res.json({
      success: true,
      result, // VALID | TAMPERED | INVALID | REVOKED | NOT_FOUND
      isAuthentic,
      message,
      verification: {
        hashMatches,
        signatureValid,
        recomputedHash,
        storedHash: certificate.canonicalDataHash,
        publicKeyFingerprint: certificate.publicKeyFingerprint,
      },
      certificate: isAuthentic || result === 'TAMPERED' || result === 'REVOKED'
        ? {
            certificateId: certificate.certificateId,
            athleteName: certificate.athleteName,
            eventName: certificate.eventName,
            sportName: certificate.sportName,
            achievement: certificate.achievement,
            position: certificate.position,
            eventDate: certificate.eventDate,
            issuingAuthority: certificate.issuingAuthority,
            issuedAt: certificate.createdAt,
            status: certificate.status,
          }
        : null,
    });
  } catch (err) { next(err); }
}

module.exports = { verifyCertificate };
