const express = require('express');
const {
    getDeck,
    swipe,
    getBuddies,
    getBuddyMessages,
    sendBuddyMessage,
} = require('../controllers/buddy.controller');
const { requireParticipant, requireRole } = require('../middlewares/auth.middleware');
const {
    validateSwipe,
    validateBuddyMessageQuery,
    validateBuddyMessage,
} = require('../middlewares/buddy.middleware');

const requireTenant = requireRole('user', 'Only tenants can use BuddyUp');

const router = express.Router();

router.use(requireParticipant, requireTenant);

router.get('/deck', getDeck);
router.post('/swipe', validateSwipe, swipe);
router.get('/', getBuddies);
router.get('/:buddyId/messages', validateBuddyMessageQuery, getBuddyMessages);
router.post('/:buddyId/messages', validateBuddyMessage, sendBuddyMessage);

module.exports = router;
