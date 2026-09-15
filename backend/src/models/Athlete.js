const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/crypto/aes');

/**
 * Sensitive personal fields (dateOfBirth, phone, address, governmentId)
 * are ENCRYPTED AT REST using AES-256-GCM before being written to
 * MongoDB. They are transparently decrypted only when explicitly
 * requested via `athlete.getDecrypted()` in a controller (which
 * requires an authenticated, authorized request). Raw DB reads
 * (e.g. via Compass) only ever show ciphertext.
 */

const athleteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    photoUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1000 },
    sports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sport' }],

    // --- Encrypted (AES-256-GCM) sensitive fields ---
    dateOfBirthEnc: { type: String, default: '' },
    phoneEnc: { type: String, default: '' },
    addressEnc: { type: String, default: '' },
    governmentIdEnc: { type: String, default: '' },
  },
  { timestamps: true }
);

/** Set encrypted fields from plaintext input. */
athleteSchema.methods.setSensitiveFields = function setSensitiveFields({
  dateOfBirth,
  phone,
  address,
  governmentId,
} = {}) {
  if (dateOfBirth !== undefined) this.dateOfBirthEnc = dateOfBirth ? encrypt(dateOfBirth) : '';
  if (phone !== undefined) this.phoneEnc = phone ? encrypt(phone) : '';
  if (address !== undefined) this.addressEnc = address ? encrypt(address) : '';
  if (governmentId !== undefined) this.governmentIdEnc = governmentId ? encrypt(governmentId) : '';
};

/** Returns a plain object with sensitive fields decrypted (authorized use only). */
athleteSchema.methods.getDecrypted = function getDecrypted() {
  const obj = this.toObject();
  try {
    obj.dateOfBirth = this.dateOfBirthEnc ? decrypt(this.dateOfBirthEnc) : '';
    obj.phone = this.phoneEnc ? decrypt(this.phoneEnc) : '';
    obj.address = this.addressEnc ? decrypt(this.addressEnc) : '';
    obj.governmentId = this.governmentIdEnc ? decrypt(this.governmentIdEnc) : '';
  } catch (err) {
    obj.decryptionError = 'Failed to decrypt one or more fields';
  }
  delete obj.dateOfBirthEnc;
  delete obj.phoneEnc;
  delete obj.addressEnc;
  delete obj.governmentIdEnc;
  return obj;
};

module.exports = mongoose.model('Athlete', athleteSchema);
