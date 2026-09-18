const express = require('express');
const {
    requestCall,
    scheduleCall,
    cancelCall,
    getCalls,
    getCallToken,
} = require('../controllers/call.controller');
const { requireParticipant, requireRole } = require('../middlewares/auth.middleware');
const {
    validateCallRequest,
    validateSchedule,
    validateCallId,
} = require('../middlewares/call.middleware');

const requireTenant = requireRole('user', 'Only tenants can perform this action');
const requireLandlord = requireRole('landlord', 'Only landlords can perform this action');

const router = express.Router();

router.use(requireParticipant);

router.get('/', getCalls);
router.post('/', requireTenant, validateCallRequest, requestCall);
router.patch('/:callId/schedule', requireLandlord, validateSchedule, scheduleCall);
router.post('/:callId/cancel', validateCallId, cancelCall);
router.post('/:callId/token', validateCallId, getCallToken);

module.exports = router;
