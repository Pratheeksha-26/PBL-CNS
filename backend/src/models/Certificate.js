const mongoose = require('mongoose');

/**
 * Stores the issued certificate along with all cryptographic
 * artifacts needed to independently re-verify it later:
 *   - canonicalDataHash: SHA-256 hash (hex) of the canonical certificate data
 *   - signature: RSA-SHA256 signature (base64) of canonicalDataHash, signed
 *                with the issuing authority's PRIVATE key
 *   - publicKeyFingerprint: fingerprint of the public key used for verification
 *
 * Snapshot fields (athleteName, eventName, etc.) are stored directly
 * (not just referenced) because the canonical data — and therefore the
 * hash/signature — must be reproducible exactly as it was at issuance,
 * even if the athlete's profile name or event name changes later.
 */
const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true, index: true },

    athlete: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    result: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', default: null },

    // Snapshot fields frozen at issuance time (used to rebuild canonical data)
    athleteName: { type: String, required: true },
    athleteEmail: { type: String, required: true },
    eventName: { type: String, required: true },
    sportName: { type: String, required: true },
    achievement: { type: String, required: true },
    position: { type: String, default: '' },
    eventDate: { type: String, required: true }, // YYYY-MM-DD, normalized
    issuingAuthority: { type: String, required: true },
    organizerName: { type: String, default: '' },

    // Cryptographic artifacts
    canonicalDataHash: { type: String, required: true }, // SHA-256 hex
    signature: { type: String, required: true }, // RSA-SHA256 base64
    publicKeyFingerprint: { type: String, required: true },

    qrCodeDataUrl: { type: String, required: true }, // base64 PNG, encodes verification URL only
    verificationUrl: { type: String, required: true },
    pdfPath: { type: String, default: '' },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
