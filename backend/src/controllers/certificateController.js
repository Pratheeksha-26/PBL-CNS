const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Certificate = require('../models/Certificate');
const Athlete = require('../models/Athlete');
const Event = require('../models/Event');
const Result = require('../models/Result');

const { buildCanonicalCertificateData } = require('../utils/canonicalCertificate');
const { sha256OfCanonicalData } = require('../utils/crypto/hash');
const { signData, getPublicKeyFingerprint } = require('../utils/crypto/rsa');
const { generateVerificationQR } = require('../utils/qrcode');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

/**
 * POST /api/certificates - organizer/admin issues a certificate.
 *
 * CRYPTOGRAPHIC ISSUANCE FLOW (mirrors the assignment spec exactly):
 *   1. Build canonical certificate data (deterministic field set/order)
 *   2. SHA-256 hash of that canonical data
 *   3. RSA-SHA256 sign the hash using the issuing authority's PRIVATE key
 *   4. Store certificate + hash + signature + public key fingerprint
 *   5. Generate QR code containing ONLY the verification URL (cert ID)
 *   6. Generate a downloadable PDF certificate embedding the QR
 */
async function issueCertificate(req, res, next) {
  try {
    const { athleteId, eventId, resultId, achievement, position } = req.body;

    const athlete = await Athlete.findById(athleteId).populate('user', 'name email');
    if (!athlete) return res.status(404).json({ success: false, message: 'Athlete not found' });

    const event = await Event.findById(eventId).populate('sport', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (resultId) {
      const result = await Result.findById(resultId);
      if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    }

    const issuingAuthority = process.env.ISSUING_AUTHORITY || 'National Sports Verification Authority';
    const certificateId = `CERT-${new Date().getFullYear()}-${uuidv4().split('-')[0].toUpperCase()}`;

    // STEP 1: Canonical data
    const canonicalData = buildCanonicalCertificateData({
      certificateId,
      athleteName: athlete.user.name,
      athleteEmail: athlete.user.email,
      eventName: event.name,
      sportName: event.sport.name,
      achievement,
      position,
      eventDate: event.eventDate,
      issuingAuthority,
    });

    // STEP 2: SHA-256 hash of canonical data
    const canonicalDataHash = sha256OfCanonicalData(canonicalData);

    // STEP 3: RSA-SHA256 digital signature of the hash, using the private key
    const signature = signData(canonicalDataHash);
    const publicKeyFingerprint = getPublicKeyFingerprint();

    // STEP 5: QR code — verification URL only, no personal data
    const { dataUrl: qrCodeDataUrl, verificationUrl } = await generateVerificationQR(certificateId);

    // STEP 4: Persist certificate record with all crypto artifacts
    const certificate = await Certificate.create({
      certificateId,
      athlete: athlete._id,
      event: event._id,
      result: resultId || null,
      athleteName: canonicalData.athleteName,
      athleteEmail: canonicalData.athleteEmail,
      eventName: canonicalData.eventName,
      sportName: canonicalData.sportName,
      achievement: canonicalData.achievement,
      position: canonicalData.position,
      eventDate: canonicalData.eventDate,
      issuingAuthority: canonicalData.issuingAuthority,
      organizerName: req.user?.name || 'Sports Authority',
      canonicalDataHash,
      signature,
      publicKeyFingerprint,
      qrCodeDataUrl,
      verificationUrl,
      issuedBy: req.user._id,
    });

    // STEP 6: Generate downloadable PDF
    const pdfPath = await generateCertificatePDF(certificate, qrCodeDataUrl);
    certificate.pdfPath = pdfPath;
    await certificate.save();

    res.status(201).json({
      success: true,
      certificate,
      cryptoSteps: [
        '1. Canonical certificate data built (deterministic field order)',
        `2. SHA-256 hash computed: ${canonicalDataHash}`,
        `3. RSA-SHA256 signature generated with issuing-authority private key`,
        '4. Certificate + hash + signature stored in database',
        `5. QR code generated encoding verification URL only: ${verificationUrl}`,
        '6. PDF certificate generated and stored',
      ],
    });
  } catch (err) { next(err); }
}

/** GET /api/certificates/:certificateId/download - download the PDF */
async function downloadCertificatePDF(req, res, next) {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!certificate || !certificate.pdfPath) {
      return res.status(404).json({ success: false, message: 'Certificate PDF not found' });
    }
    res.download(certificate.pdfPath, `${certificate.certificateId}.pdf`);
  } catch (err) { next(err); }
}

/** GET /api/certificates/mine - athlete: own certificates */
async function getMyCertificates(req, res, next) {
  try {
    const athlete = await Athlete.findOne({ user: req.user._id });
    const certificates = await Certificate.find({ athlete: athlete._id }).sort({ createdAt: -1 }).select('-signature');
    res.json({ success: true, certificates });
  } catch (err) { next(err); }
}

/** GET /api/certificates - organizer/admin: list all issued certificates */
async function listCertificates(req, res, next) {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 }).select('-signature');
    res.json({ success: true, certificates });
  } catch (err) { next(err); }
}

/** PUT /api/certificates/:certificateId/revoke - admin only */
async function revokeCertificate(req, res, next) {
  try {
    const certificate = await Certificate.findOneAndUpdate(
      { certificateId: req.params.certificateId },
      { status: 'revoked' },
      { new: true }
    );
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({ success: true, certificate });
  } catch (err) { next(err); }
}

module.exports = {
  issueCertificate,
  downloadCertificatePDF,
  getMyCertificates,
  listCertificates,
  revokeCertificate,
};
