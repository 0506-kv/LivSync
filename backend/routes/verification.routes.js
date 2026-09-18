const express = require('express');
const { sendVerificationCode, confirmVerificationCode } = require('../controllers/verification.controller');
const { requireParticipant } = require('../middlewares/auth.middleware');
const { validateVerificationCode } = require('../middlewares/verification.middleware');

// One pair of routes for both account types: the session cookie says which one is asking.
const router = express.Router();

router.post('/send', requireParticipant, sendVerificationCode);
router.post('/confirm', requireParticipant, validateVerificationCode, confirmVerificationCode);

module.exports = router;
