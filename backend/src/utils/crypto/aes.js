/**
 * AES-256-GCM Encryption Utility
 * ---------------------------------------------------------------
 * Used to encrypt/decrypt sensitive athlete fields at rest
 * (e.g. date of birth, phone, address, government ID).
 *
 * AES-256-GCM is an Authenticated Encryption with Associated Data
 * (AEAD) cipher: it provides confidentiality AND integrity.
 * Every encryption uses a fresh, cryptographically random 12-byte
 * IV (Initialization Vector) so that identical plaintexts never
 * produce identical ciphertexts. A 16-byte GCM authentication tag
 * is generated and stored so tampering with ciphertext is detected
 * automatically on decryption (it throws instead of silently
 * returning corrupted data).
 *
 * The key is never hardcoded — it is loaded from the AES_SECRET_KEY
 * environment variable and must be exactly 32 bytes (256 bits).
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

function getKey() {
  const raw = process.env.AES_SECRET_KEY;
  if (!raw) {
    throw new Error('AES_SECRET_KEY is not set in environment variables');
  }
  // Accept either a 64-char hex string or a raw 32-byte string.
  let key;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex');
  } else {
    key = Buffer.from(raw, 'utf8');
  }
  if (key.length !== 32) {
    throw new Error(
      `AES_SECRET_KEY must resolve to exactly 32 bytes (got ${key.length}). ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  return key;
}

/**
 * Encrypts a plaintext string.
 * @param {string} plaintext
 * @returns {string} Combined payload: base64(iv).base64(authTag).base64(ciphertext)
 */
function encrypt(plaintext) {
  if (plaintext === undefined || plaintext === null || plaintext === '') return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH); // secure random IV, unique per encryption
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // GCM authentication tag (integrity)

  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

/**
 * Decrypts a payload produced by encrypt().
 * Throws if the auth tag does not match (data was tampered with).
 * @param {string} payload
 * @returns {string} plaintext
 */
function decrypt(payload) {
  if (payload === undefined || payload === null || payload === '') return payload;
  const key = getKey();
  const parts = String(payload).split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Returns true if a string looks like a value produced by encrypt() */
function isEncryptedPayload(value) {
  return typeof value === 'string' && /^[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(value);
}

module.exports = { encrypt, decrypt, isEncryptedPayload, ALGORITHM };
