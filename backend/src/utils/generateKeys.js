/**
 * One-time script to generate the RSA-2048 keypair used to digitally
 * sign certificates. Run with: npm run generate-keys
 *
 * The private key must be kept secret and NEVER committed to source
 * control or sent to the frontend (see backend/.gitignore).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keysDir = path.join(__dirname, '..', '..', 'keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });

const privatePath = path.join(keysDir, 'private.pem');
const publicPath = path.join(keysDir, 'public.pem');

if (fs.existsSync(privatePath) && fs.existsSync(publicPath)) {
  console.log('[generate-keys] Keys already exist at backend/keys/. Skipping generation.');
  console.log('Delete backend/keys/*.pem manually if you want to regenerate them.');
  process.exit(0);
}

console.log('[generate-keys] Generating RSA-2048 keypair for certificate signing...');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(privatePath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicPath, publicKey, { mode: 0o644 });

console.log(`[generate-keys] Private key written to ${privatePath}`);
console.log(`[generate-keys] Public key written to  ${publicPath}`);
console.log('[generate-keys] Done. Keep private.pem secret — it is gitignored by default.');
