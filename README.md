# Digital Sports Records and Credential Verification System Using Cryptography

A complete, working full-stack application for issuing and verifying sports
achievement certificates, secured with real cryptography: **AES-256-GCM**
(sensitive data encryption), **SHA-256** (integrity hashing), and **RSA-2048
digital signatures** (authenticity).

Stack: **React + Vite + Tailwind CSS** (frontend) · **Node.js + Express**
(backend) · **MongoDB + Mongoose** (database) · **JWT + bcrypt** (auth).

---

## 1. Project Structure

```
sports-cred-verify/
├── backend/
│   ├── server.js                  # entry point
│   ├── src/
│   │   ├── app.js                 # Express app (security middleware, routes)
│   │   ├── config/db.js
│   │   ├── models/                # User, Athlete, Sport, Event, Registration,
│   │   │                          # Result, Achievement, Certificate
│   │   ├── middleware/            # auth (JWT), rbac, upload, validate, errors
│   │   ├── controllers/           # business logic per module
│   │   ├── routes/                # Express routers
│   │   ├── utils/
│   │   │   ├── crypto/
│   │   │   │   ├── aes.js         # AES-256-GCM encrypt/decrypt
│   │   │   │   ├── hash.js        # canonical SHA-256 hashing
│   │   │   │   └── rsa.js         # RSA-SHA256 sign/verify
│   │   │   ├── generateKeys.js    # RSA keypair generator (run once)
│   │   │   ├── canonicalCertificate.js
│   │   │   ├── qrcode.js          # QR containing verification URL only
│   │   │   └── pdfGenerator.js    # PDFKit certificate rendering
│   │   └── seed.js                # demo data for all 4 roles
│   ├── keys/                      # RSA private/public PEM (gitignored)
│   ├── uploads/                   # profile photos + generated PDFs
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js           # JWT-aware Axios instance
    │   ├── context/AuthContext.jsx
    │   ├── components/            # Navbar, ProtectedRoute (RBAC guard), UI, CryptoInfo
    │   ├── pages/
    │   │   ├── Home.jsx, Login.jsx, Register.jsx, Unauthorized.jsx
    │   │   ├── VerifyPage.jsx     # PUBLIC certificate verification
    │   │   ├── athlete/           # Dashboard, Profile, Events, Certificates
    │   │   ├── organizer/         # Dashboard, Events, EventDetail, Certificates
    │   │   └── admin/             # Dashboard, Users
    │   ├── App.jsx                # routes + RBAC guards
    │   └── main.jsx
    ├── package.json
    └── .env.example
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a MongoDB
  Atlas connection string

---

## 3. Setup & Run

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set real secrets:

```bash
# Generate a 32-byte AES key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste the output into AES_SECRET_KEY

# Generate a strong JWT secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Paste the output into JWT_SECRET

# Set MONGO_URI to your MongoDB connection string
```

Generate the RSA keypair used for certificate signing (one-time):

```bash
npm run generate-keys
# Creates backend/keys/private.pem and backend/keys/public.pem
```

Seed demo data (creates one user per role + a sample event/certificate):

```bash
npm run seed
```

Start the API:

```bash
npm run dev      # nodemon, http://localhost:5000
# or
npm start
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev              # http://localhost:5173
```

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | Admin@1234 |
| Organizer | organizer@demo.com | Organizer@1234 |
| Athlete | athlete@demo.com | Athlete@1234 |
| Athlete 2 | athlete2@demo.com | Athlete@1234 |
| Verifier | verifier@demo.com | Verifier@1234 (verification page needs **no login**) |

The seed script also issues one demo certificate — its ID is printed to
the console, e.g. `CERT-2026-DEMO001`. Go to `/verify/CERT-2026-DEMO001`
to see it verify as **VALID**.

---

## 4. How the Cryptography Works

### AES-256-GCM (confidentiality + integrity of sensitive athlete data)
File: `backend/src/utils/crypto/aes.js`
- Athlete `dateOfBirth`, `phone`, `address`, `governmentId` are encrypted
  before being saved to MongoDB (`Athlete` model, `*Enc` fields).
- Every encryption uses a fresh, cryptographically random 12-byte IV, so
  identical plaintexts never produce identical ciphertexts.
- A 16-byte GCM authentication tag is stored; on decryption, any tampering
  with the ciphertext causes the decrypt call to **throw**, not silently
  return corrupted data.
- The key is loaded only from `AES_SECRET_KEY` in `.env` — never hardcoded.

### SHA-256 (deterministic canonical hashing)
File: `backend/src/utils/crypto/hash.js`, `backend/src/utils/canonicalCertificate.js`
- `buildCanonicalCertificateData()` builds a fixed-shape object (certificate
  ID, athlete name/email, event, sport, achievement, position, date,
  issuing authority) — used identically at issuance and at verification.
- `sha256OfCanonicalData()` stringifies that object with recursively
  **sorted keys** before hashing, so the hash is 100% reproducible.

### RSA-2048 Digital Signature (authenticity)
File: `backend/src/utils/crypto/rsa.js`, `backend/src/utils/generateKeys.js`
- `npm run generate-keys` creates a 2048-bit RSA keypair once.
- At issuance, the SHA-256 hash of the canonical data is signed with the
  **private** key (`RSA-SHA256`).
- At verification, the signature is checked against the **public** key.
- The private key never leaves the backend filesystem and is never sent
  to the frontend or included in any API response.

### QR Code
File: `backend/src/utils/qrcode.js`
- Encodes **only** `https://<frontend>/verify/<certificateId>` — no
  athlete name, no scores, no hashes, no signatures.

### Certificate Issuance Flow (`POST /api/certificates`, organizer/admin only)
1. Build canonical certificate data
2. SHA-256 hash of that data
3. RSA-SHA256 sign the hash with the private key
4. Store certificate + hash + signature + public key fingerprint in MongoDB
5. Generate QR code (verification URL only)
6. Generate a downloadable PDF certificate (PDFKit) embedding the QR

### Verification Flow (`GET /api/verify/:certificateId`, public, no auth)
1. Retrieve the certificate record by ID
2. Rebuild the exact canonical data from stored snapshot fields
3. Recompute the SHA-256 hash
4. Compare recomputed hash vs. stored hash → mismatch = **TAMPERED**
5. Verify the RSA signature against the recomputed hash using the public
   key → failure = **INVALID**
6. If both checks pass → **VALID / AUTHENTIC**
   (a `REVOKED` status and `NOT_FOUND` case are also handled)

---

## 5. RBAC (Role-Based Access Control)

Enforced on **both** layers:

- **Backend** (authoritative): `middleware/auth.js` — `protect` verifies
  the JWT, `authorize(...roles)` checks `req.user.role` against an allow-
  list before any controller runs. Every sensitive route explicitly lists
  the roles allowed to call it (see `src/routes/*.js`).
- **Frontend** (UX only): `components/ProtectedRoute.jsx` hides/redirects
  navigation for roles that shouldn't see a page. This is **not** trusted
  for security — a user editing the frontend or calling the API directly
  is still blocked by the backend.

Roles: `athlete`, `organizer`, `verifier`, `admin`.
- Public self-registration always creates an `athlete` account.
- `organizer`, `verifier`, and `admin` accounts are created by an **Admin**
  via `POST /api/admin/users` (role escalation is not self-serve).
- The **verification page itself requires no login at all** — any
  recruiter/verifier can check a certificate via Certificate ID or QR.

---

## 6. API Reference

Base URL: `http://localhost:5000/api`

### Auth
| Method | Route | Access |
|---|---|---|
| POST | `/auth/register` | Public (creates athlete) |
| POST | `/auth/login` | Public |
| GET | `/auth/me` | Authenticated |

### Athletes
| Method | Route | Access |
|---|---|---|
| GET | `/athletes/me` | Athlete |
| PUT | `/athletes/me` | Athlete |
| POST | `/athletes/me/photo` | Athlete (multipart) |
| GET | `/athletes/me/history` | Athlete |
| GET | `/athletes` | Organizer, Admin |

### Sports
| Method | Route | Access |
|---|---|---|
| GET | `/sports` | Authenticated |
| POST | `/sports` | Organizer, Admin |
| PUT | `/sports/:id` | Organizer, Admin |
| DELETE | `/sports/:id` | Admin |

### Events
| Method | Route | Access |
|---|---|---|
| GET | `/events` | Authenticated |
| GET | `/events/:id` | Authenticated |
| POST | `/events` | Organizer, Admin |
| PUT | `/events/:id` | Organizer (own), Admin |
| DELETE | `/events/:id` | Organizer (own), Admin |
| GET | `/events/:id/registrations` | Organizer, Admin |

### Registrations
| Method | Route | Access |
|---|---|---|
| POST | `/registrations` | Athlete |
| GET | `/registrations/mine` | Athlete |
| PUT | `/registrations/:id/status` | Organizer, Admin |

### Results
| Method | Route | Access |
|---|---|---|
| POST | `/results` | Organizer, Admin |
| GET | `/results/event/:eventId` | Organizer, Admin |

### Achievements
| Method | Route | Access |
|---|---|---|
| POST | `/achievements` | Organizer, Admin |
| GET | `/achievements/mine` | Athlete |
| GET | `/achievements/athlete/:athleteId` | Organizer, Admin |

### Certificates
| Method | Route | Access |
|---|---|---|
| POST | `/certificates` | Organizer, Admin |
| GET | `/certificates/mine` | Athlete |
| GET | `/certificates` | Organizer, Admin |
| GET | `/certificates/:certificateId/download` | Authenticated |
| PUT | `/certificates/:certificateId/revoke` | Admin |

### Verification (public)
| Method | Route | Access |
|---|---|---|
| GET | `/verify/:certificateId` | **Public — no auth** |

### Admin
| Method | Route | Access |
|---|---|---|
| GET | `/admin/users` | Admin |
| POST | `/admin/users` | Admin |
| PUT | `/admin/users/:id/role` | Admin |
| PUT | `/admin/users/:id/status` | Admin |
| DELETE | `/admin/users/:id` | Admin |
| GET | `/admin/stats` | Admin |

---

## 7. Security Measures Implemented

- **bcrypt** password hashing (cost factor 12) — `User` model pre-save hook
- **JWT** authentication with expiry — `Authorization: Bearer <token>`
- **Authorization middleware** (`authorize(...roles)`) on every protected route
- **express-validator** input validation on auth routes
- **Helmet** for secure HTTP headers
- **CORS** locked to `FRONTEND_URL`
- **express-rate-limit**: general API limiter + a stricter limiter on `/api/auth`
- **express-mongo-sanitize** to strip NoSQL-injection operators from input
- **Environment variables** for all secrets (`.env`, never committed —
  see `.gitignore`); `.env.example` provided for both apps
- **Centralized error handler** that never leaks stack traces in production
- Private RSA key and AES key **never** sent to the frontend or included
  in any API response
- QR codes never contain personal data — only the verification URL

---

## 8. End-to-End Testing Steps

1. **Start MongoDB**, then run backend (`npm run dev`) and frontend
   (`npm run dev`).
2. `npm run seed` in `backend/` to populate demo data.
3. **Login as organizer** (`organizer@demo.com` / `Organizer@1234`) →
   Events → open "State Athletics Championship 2026" → confirm you can
   see Arjun Rao's approved registration and recorded result.
4. **Issue a new certificate**: fill in the achievement field and click
   "Issue Certificate (SHA-256 + RSA Sign)". Observe the cryptographic
   trace box showing each step (canonical data → hash → signature → QR →
   PDF).
5. **Login as athlete** (`athlete@demo.com` / `Athlete@1234`) → My
   Certificates → confirm the new certificate appears, download the PDF,
   and click "Verify".
6. **Verify without logging in**: open `/verify` in a private/incognito
   window, paste the Certificate ID → should show **✅ AUTHENTIC / VALID**
   with the full crypto verification trace (hash match: YES, signature
   valid: YES).

### Tamper Detection Test (important for your demo/viva)

To prove tamper detection works, directly edit the stored certificate in
MongoDB (e.g. via `mongosh` or MongoDB Compass) and change a field that
is part of the canonical data — for example the `achievement` or
`position` field on a `Certificate` document:

```js
// in mongosh
use sports_cred_db
db.certificates.updateOne(
  { certificateId: "CERT-2026-DEMO001" },
  { $set: { achievement: "Silver Medal - 100m Sprint" } } // was "Gold Medal..."
)
```

Now re-run verification for that certificate ID (`/verify/CERT-2026-DEMO001`).
Because the stored `achievement` field changed but the stored
`canonicalDataHash`/`signature` did not, the server will recompute a
**different** SHA-256 hash from the (now-altered) data, it won't match
the stored hash, and the UI will show:

> ⚠️ **TAMPERED — DATA ALTERED**
> The certificate data does not match its original cryptographic hash.

Revert the field back to `"Gold Medal - 100m Sprint"` and re-verify — it
returns to ✅ **VALID**.

You can similarly test an **INVALID signature** scenario by regenerating
the RSA keypair (`npm run generate-keys` after deleting `backend/keys/*.pem`)
without re-issuing certificates — old certificates will now fail signature
verification against the new public key (result: `INVALID`).

### AES tamper-detection test (backend console)

```bash
cd backend
node -e "
require('dotenv').config();
const { encrypt, decrypt } = require('./src/utils/crypto/aes');
const enc = encrypt('2002-05-14');
console.log('Encrypted:', enc);
console.log('Decrypted:', decrypt(enc));
try {
  decrypt(enc.slice(0, -2) + 'xx'); // corrupt the ciphertext
} catch (e) {
  console.log('Tamper correctly detected:', e.message);
}
"
```

---

## 9. Notes & Limitations

- This is a final-year academic project reference implementation. For a
  production deployment you would additionally want: HTTPS termination,
  refresh-token rotation, audit logging, automated tests (Jest/Supertest),
  a proper file/object store (S3) instead of local disk for uploads/PDFs,
  and secret management (e.g. AWS Secrets Manager / Vault) instead of a
  plain `.env` file.
- The `verifier` role exists as a formal account type per the spec, but
  the verification endpoint itself is intentionally public/unauthenticated
  so that any recruiter can check a certificate without creating an
  account — this matches the requirement "verify... without accessing
  private system data."
