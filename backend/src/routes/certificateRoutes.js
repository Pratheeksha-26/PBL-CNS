const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  issueCertificate,
  downloadCertificatePDF,
  getMyCertificates,
  listCertificates,
  revokeCertificate,
} = require('../controllers/certificateController');

const router = express.Router();

router.post('/', protect, authorize('organizer', 'admin'), issueCertificate);
router.get('/mine', protect, authorize('athlete'), getMyCertificates);
router.get('/', protect, authorize('organizer', 'admin'), listCertificates);
router.get('/:certificateId/download', protect, downloadCertificatePDF);
router.put('/:certificateId/revoke', protect, authorize('admin'), revokeCertificate);

module.exports = router;
