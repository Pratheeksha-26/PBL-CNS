const express = require('express');
const { verifyCertificate } = require('../controllers/verifyController');

const router = express.Router();

// PUBLIC — intentionally no `protect` middleware. Verifiers/recruiters
// must be able to check a certificate without any account or access
// to private system data.
router.get('/:certificateId', verifyCertificate);

module.exports = router;
