/**
 * PDF Certificate Generator
 * ---------------------------------------------------------------
 * Renders a downloadable PDF certificate containing:
 * certificate ID, athlete name, event, sport, achievement/position,
 * date, issuing authority, and the QR verification code.
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * @param {object} cert - certificate fields to render
 * @param {string} qrDataUrl - base64 PNG data URL of the QR code
 * @returns {Promise<string>} absolute path of the generated PDF file
 */
function generateCertificatePDF(cert, qrDataUrl) {
  return new Promise((resolve, reject) => {
    try {
      const outDir = path.join(__dirname, '..', '..', 'uploads', 'certificates');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const filePath = path.join(outDir, `${cert.certificateId}.pdf`);

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Outer decorative border
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(3).stroke('#1e3a8a');
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(1).stroke('#93c5fd');

      doc
        .fontSize(12)
        .fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .text(cert.issuingAuthority.toUpperCase(), 0, 60, { align: 'center' });

      doc
        .fontSize(30)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text('Certificate of Achievement', 0, 90, { align: 'center' });

      doc
        .fontSize(13)
        .font('Helvetica')
        .fillColor('#334155')
        .text('This certifies that', 0, 150, { align: 'center' });

      doc
        .fontSize(26)
        .font('Helvetica-Bold')
        .fillColor('#1d4ed8')
        .text(cert.athleteName, 0, 175, { align: 'center' });

      doc
        .fontSize(13)
        .font('Helvetica')
        .fillColor('#334155')
        .text(
          `has achieved "${cert.achievement}"${cert.position ? ` (${cert.position})` : ''} in`,
          80,
          220,
          { align: 'center', width: pageWidth - 160 }
        );

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(`${cert.eventName} — ${cert.sportName}`, 0, 245, { align: 'center' });

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#334155')
        .text(`Date: ${cert.eventDate}`, 0, 280, { align: 'center' });

      // Footer info block: left = cert details, right = QR
      const footerY = pageHeight - 140;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Certificate ID: ${cert.certificateId}`, 70, footerY)
        .text(`Issuing Authority: ${cert.issuingAuthority}`, 70, footerY + 14)
        .text(`SHA-256 Hash: ${cert.canonicalDataHash.slice(0, 32)}...`, 70, footerY + 28)
        .text('Digitally signed with RSA-2048/SHA-256', 70, footerY + 42)
        .text('Scan the QR code or visit the verification URL to confirm authenticity.', 70, footerY + 56);

      if (qrDataUrl) {
        const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, pageWidth - 190, footerY - 10, { width: 100, height: 100 });
      }

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePDF };
