const express = require('express');
const {
    createRental,
    getRentals,
    decideRental,
    createPaymentOrder,
    verifyPayment,
    chooseOfflinePayment,
    confirmOfflinePayment,
    handleWebhook,
    getAgreement,
    getReceipt,
} = require('../controllers/rental.controller');
const { requireParticipant, requireRole } = require('../middlewares/auth.middleware');
const {
    validateRentalRequest,
    validateRentalDecision,
    validateRentalId,
    validatePaymentVerification,
    validateOfflineConfirmation,
} = require('../middlewares/rental.middleware');

const requireTenant = requireRole('user', 'Only tenants can perform this action');
const requireLandlord = requireRole('landlord', 'Only landlords can perform this action');

const router = express.Router();

// Razorpay calls this server to server, so it sits before the session check.
router.post('/webhook', handleWebhook);

router.use(requireParticipant);

router.get('/', getRentals);
router.post('/', requireTenant, validateRentalRequest, createRental);
router.patch('/:rentalId/decision', requireLandlord, validateRentalDecision, decideRental);
router.post('/:rentalId/payment/order', requireTenant, validateRentalId, createPaymentOrder);
router.post('/:rentalId/payment/verify', requireTenant, validatePaymentVerification, verifyPayment);
router.post('/:rentalId/payment/in-person', requireTenant, validateRentalId, chooseOfflinePayment);
router.post('/:rentalId/payment/confirm', requireLandlord, validateOfflineConfirmation, confirmOfflinePayment);
router.get('/:rentalId/agreement', validateRentalId, getAgreement);
router.get('/:rentalId/receipt', validateRentalId, getReceipt);

module.exports = router;
