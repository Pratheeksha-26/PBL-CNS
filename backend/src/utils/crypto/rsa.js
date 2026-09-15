/**
 * RSA Digital Signature Utility (RSA-SHA256)
 * ---------------------------------------------------------------
 * The issuing authority (organizer/system) holds an RSA-2048 PRIVATE
 * key (never sent to the frontend, never exposed via any API).
 * When a certificate is issued, we sign the SHA-256 hash of the
 * certificate's canonical data with this private key.
 *
 * Anyone (including the public verification page) can then use the
 * corresponding PUBLIC key to verify that:
 *   1. The certificate was genuinely issued by the holder of the
 *      private key (authenticity), and
 *   2. The signed data has not been altered since signing (integrity).
 *
 * Keys are generated once via `npm run generate-keys` and stored as
 * PEM files referenced by RSA_PRIVATE_KEY_PATH / RSA_PUBLIC_KEY_PATH
 * environment variables — never hardcoded in source.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let cachedPrivateKey = null;
let cachedPublicKey = null;

function resolvePath(p) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function getPrivateKey() {
  if (cachedPrivateKey) return cachedPrivateKey;
  const keyPath = resolvePath(process.env.RSA_PRIVATE_KEY_PATH || './keys/private.pem');
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `RSA private key not found at ${keyPath}. Run "npm run generate-keys" first.`
    );
  }
  cachedPrivateKey = fs.readFileSync(keyPath, 'utf8');
  return cachedPrivateKey;
}

function getPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const keyPath = resolvePath(process.env.RSA_PUBLIC_KEY_PATH || './keys/public.pem');
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `RSA public key not found at ${keyPath}. Run "npm run generate-keys" first.`
    );
  }
  cachedPublicKey = fs.readFileSync(keyPath, 'utf8');
  return cachedPublicKey;
}

/**
 * Signs a string (typically the SHA-256 hash hex string of the
 * canonical certificate data) using RSA-SHA256 and the private key.
 * @param {string} data
 * @returns {string} base64-encoded signature
 */
function signData(data) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data, 'utf8');
  signer.end();
  const privateKey = getPrivateKey();
  const signature = signer.sign(privateKey);
  return signature.toString('base64');
}

/**
 * Verifies an RSA-SHA256 signature against the original data using
 * the public key.
 * @param {string} data - original signed string
 * @param {string} signatureBase64
 * @returns {boolean}
 */
function verifySignature(data, signatureBase64) {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data, 'utf8');
    verifier.end();
    const publicKey = getPublicKey();
    return verifier.verify(publicKey, Buffer.from(signatureBase64, 'base64'));
  } catch (err) {
    return false;
  }
}

/** A short fingerprint of the public key, stored on certificates for reference. */
function getPublicKeyFingerprint() {
  const publicKey = getPublicKey();
  return crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);
}

module.exports = { signData, verifySignature, getPublicKey, getPublicKeyFingerprint };
