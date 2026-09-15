require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Sanity check: warn (don't crash) if RSA keys are missing so the
// developer knows to run `npm run generate-keys`.
const privKeyPath = path.join(__dirname, process.env.RSA_PRIVATE_KEY_PATH || './keys/private.pem');
const pubKeyPath = path.join(__dirname, process.env.RSA_PUBLIC_KEY_PATH || './keys/public.pem');
if (!fs.existsSync(privKeyPath) || !fs.existsSync(pubKeyPath)) {
  console.warn('\n[WARNING] RSA keypair not found. Run "npm run generate-keys" before issuing certificates.\n');
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Digital Sports Records API running on http://localhost:${PORT}`);
  });
});
