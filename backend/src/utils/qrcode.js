/**
 * QR Code Generator
 * ---------------------------------------------------------------
 * The QR code embedded on a certificate encodes ONLY the public
 * verification URL containing the certificate ID:
 *
 *    https://<frontend-host>/verify/<certificateId>
 *
 * It NEVER encodes athlete personal data, scores, hashes, signatures,
 * or any private system data. Scanning it simply takes the verifier
 * (recruiter/employer) to the public verification page, which itself
 * performs the cryptographic verification server-side.
 */

const QRCode = require('qrcode');

/**
 * @param {string} certificateId
 * @returns {Promise<string>} data URL (base64 PNG) of the QR code
 */
async function generateVerificationQR(certificateId) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${encodeURIComponent(certificateId)}`;
  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 300,
  });
  return { dataUrl, verificationUrl };
}

module.exports = { generateVerificationQR };
