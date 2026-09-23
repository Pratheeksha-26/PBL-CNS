/**
 * Seed script — populates the database with demo data covering
 * every role so the app can be explored/demoed immediately.
 * Run with: npm run seed
 */
require('dotenv').config();
const connectDB = require('./config/db');

const User = require('./models/User');
const Athlete = require('./models/Athlete');
const Sport = require('./models/Sport');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Result = require('./models/Result');
const Achievement = require('./models/Achievement');
const Certificate = require('./models/Certificate');

const { buildCanonicalCertificateData } = require('./utils/canonicalCertificate');
const { sha256OfCanonicalData } = require('./utils/crypto/hash');
const { signData, getPublicKeyFingerprint } = require('./utils/crypto/rsa');
const { generateVerificationQR } = require('./utils/qrcode');
const { generateCertificatePDF } = require('./utils/pdfGenerator');

async function seed({ skipConnection = false } = {}) {
  if (!skipConnection) {
    await connectDB();
  }

  console.log('[SEED] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Athlete.deleteMany({}),
    Sport.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    Result.deleteMany({}),
    Achievement.deleteMany({}),
    Certificate.deleteMany({}),
  ]);

  console.log('[SEED] Creating users...');
  const createDemoUser = async ({ name, email, password, role }) => {
    try {
      return await User.create({ name, email: email.toLowerCase(), password, role, isActive: true });
    } catch (err) {
      if (err.code === 11000) {
        return await User.findOne({ email: email.toLowerCase() });
      }
      throw err;
    }
  };

  const admin = await createDemoUser({ name: 'System Admin', email: 'admin@demo.com', password: 'Admin@1234', role: 'admin' });
  const organizer = await createDemoUser({ name: 'Priya Sharma', email: 'organizer@demo.com', password: 'Organizer@1234', role: 'organizer' });
  const verifier = await createDemoUser({ name: 'Recruiter Corp HR', email: 'verifier@demo.com', password: 'Verifier@1234', role: 'verifier' });
  const athleteUser1 = await createDemoUser({ name: 'Arjun Rao', email: 'athlete@demo.com', password: 'Athlete@1234', role: 'athlete' });
  const athleteUser2 = await createDemoUser({ name: 'Sneha Kulkarni', email: 'athlete2@demo.com', password: 'Athlete@1234', role: 'athlete' });

  const athlete1 = await Athlete.create({ user: athleteUser1._id, bio: 'State-level sprinter.' });
  athlete1.setSensitiveFields({ dateOfBirth: '2002-05-14', phone: '+91-9876543210', address: 'Mangaluru, Karnataka', governmentId: 'GOVID-1234-5678' });
  await athlete1.save();

  const athlete2 = await Athlete.create({ user: athleteUser2._id, bio: 'District chess champion.' });
  athlete2.setSensitiveFields({ dateOfBirth: '2003-11-02', phone: '+91-9123456780', address: 'Mysuru, Karnataka', governmentId: 'GOVID-8765-4321' });
  await athlete2.save();

  console.log('[SEED] Creating sports...');
  const athletics = await Sport.create({ name: 'Athletics', category: 'Track & Field', description: '100m, 200m, relay events' });
  const chess = await Sport.create({ name: 'Chess', category: 'Mind Sport', description: 'Classical and rapid chess' });

  console.log('[SEED] Creating events...');
  const event1 = await Event.create({
    name: 'State Athletics Championship 2026',
    sport: athletics._id,
    description: 'Annual state-level track and field championship.',
    venue: 'Mangaluru Sports Complex',
    eventDate: new Date('2026-03-15'),
    registrationDeadline: new Date('2026-03-01'),
    organizer: organizer._id,
    status: 'completed',
  });

  const event2 = await Event.create({
    name: 'Karnataka Open Chess Tournament',
    sport: chess._id,
    description: 'Open rapid chess tournament.',
    venue: 'Mysuru Convention Centre',
    eventDate: new Date('2026-05-20'),
    registrationDeadline: new Date('2026-05-05'),
    organizer: organizer._id,
    status: 'upcoming',
  });

  console.log('[SEED] Creating registrations & results...');
  const reg1 = await Registration.create({ athlete: athlete1._id, event: event1._id, status: 'approved', approvedBy: organizer._id });
  await Registration.create({ athlete: athlete2._id, event: event2._id, status: 'pending' });

  const result1 = await Result.create({
    registration: reg1._id,
    athlete: athlete1._id,
    event: event1._id,
    position: '1st Place',
    scoreOrTime: '10.42s',
    remarks: 'New state record in 100m sprint.',
    recordedBy: organizer._id,
  });

  await Achievement.create({
    athlete: athlete1._id,
    result: result1._id,
    title: 'Gold Medal - 100m Sprint',
    description: 'Won gold with a new state record time.',
    level: 'state',
    date: new Date('2026-03-15'),
  });

  console.log('[SEED] Issuing a demo certificate (full crypto flow)...');
  const issuingAuthority = process.env.ISSUING_AUTHORITY || 'National Sports Verification Authority';
  const certificateId = 'CERT-2026-DEMO001';

  const canonicalData = buildCanonicalCertificateData({
    certificateId,
    athleteName: athleteUser1.name,
    athleteEmail: athleteUser1.email,
    eventName: event1.name,
    sportName: athletics.name,
    achievement: 'Gold Medal - 100m Sprint',
    position: '1st Place',
    eventDate: event1.eventDate,
    issuingAuthority,
  });
  const canonicalDataHash = sha256OfCanonicalData(canonicalData);
  const signature = signData(canonicalDataHash);
  const publicKeyFingerprint = getPublicKeyFingerprint();
  const { dataUrl: qrCodeDataUrl, verificationUrl } = await generateVerificationQR(certificateId);

  const certificate = await Certificate.create({
    certificateId,
    athlete: athlete1._id,
    event: event1._id,
    result: result1._id,
    athleteName: canonicalData.athleteName,
    athleteEmail: canonicalData.athleteEmail,
    eventName: canonicalData.eventName,
    sportName: canonicalData.sportName,
    achievement: canonicalData.achievement,
    position: canonicalData.position,
    eventDate: canonicalData.eventDate,
    issuingAuthority: canonicalData.issuingAuthority,
    canonicalDataHash,
    signature,
    publicKeyFingerprint,
    qrCodeDataUrl,
    verificationUrl,
    issuedBy: organizer._id,
  });

  try {
    const pdfPath = await generateCertificatePDF(certificate, qrCodeDataUrl);
    certificate.pdfPath = pdfPath;
    await certificate.save();
  } catch (e) {
    console.warn('[SEED] PDF generation skipped:', e.message);
  }

  console.log('\n========================================================');
  console.log(' SEED COMPLETE — Demo accounts (password shown for demo only):');
  console.log('========================================================');
  console.log(' Admin:      admin@demo.com      / Admin@1234');
  console.log(' Organizer:  organizer@demo.com  / Organizer@1234');
  console.log(' Verifier:   verifier@demo.com   / Verifier@1234  (verification page needs no login)');
  console.log(' Athlete 1:  athlete@demo.com    / Athlete@1234');
  console.log(' Athlete 2:  athlete2@demo.com   / Athlete@1234');
  console.log('--------------------------------------------------------');
  console.log(` Demo Certificate ID: ${certificateId}`);
  console.log(` Verify at: ${verificationUrl}`);
  console.log('========================================================\n');

  process.exit(0);
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[SEED] Failed:', err);
    process.exit(1);
  });
}

module.exports = { seed };
