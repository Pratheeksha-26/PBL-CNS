require('dotenv').config();
const fs = require('fs');
const path = require('path');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const { seed } = require('./src/seed');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Sanity check: warn (don't crash) if RSA keys are missing so the
// developer knows to run `npm run generate-keys`.
const privKeyPath = path.join(__dirname, process.env.RSA_PRIVATE_KEY_PATH || './keys/private.pem');
const pubKeyPath = path.join(__dirname, process.env.RSA_PUBLIC_KEY_PATH || './keys/public.pem');
if (!fs.existsSync(privKeyPath) || !fs.existsSync(pubKeyPath)) {
  console.warn('\n[WARNING] RSA keypair not found. Run "npm run generate-keys" before issuing certificates.\n');
}

connectDB()
  .then(async () => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[BOOTSTRAP] No user accounts found. Seeding demo accounts...');
      await seed({ skipConnection: true });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Digital Sports Records API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[DB] Failed to start server:', err.message);
    process.exit(1);
  });
