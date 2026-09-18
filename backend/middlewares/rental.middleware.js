const { body, param, validationResult } = require('express-validator');

const validateRentalRequest = [
    body('listingId').isMongoId().withMessage('Invalid listing id'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10 to 1000 characters'),
    body('preferences.moveInDate').isISO8601().toDate().withMessage('Enter a valid move-in date'),
    body('preferences.durationMonths').isInt({ min: 1, max: 120 }).withMessage('Duration must be 1 to 120 months').toInt(),
    body('preferences.occupants').isInt({ min: 1, max: 20 }).withMessage('Occupants must be 1 to 20').toInt(),
    body('preferences.note').optional().trim().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
    handleValidationErrors,
];

const validateRentalDecision = [
    param('rentalId').isMongoId().withMessage('Invalid rental id'),
    body('decision').isIn(['accept', 'reject']).withMessage('Decision must be accept or reject'),
    handleValidationErrors,
];

const validateRentalId = [
    param('rentalId').isMongoId().withMessage('Invalid rental id'),
    handleValidationErrors,
];

const validatePaymentVerification = [
    param('rentalId').isMongoId().withMessage('Invalid rental id'),
    body('razorpay_order_id').trim().notEmpty().withMessage('Order id is required'),
    body('razorpay_payment_id').trim().notEmpty().withMessage('Payment id is required'),
    body('razorpay_signature').trim().notEmpty().withMessage('Payment signature is required'),
    handleValidationErrors,
];

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: errors.array()[0].msg,
            data: {},
        });
    }

    return next();
}

module.exports = {
    validateRentalRequest,
    validateRentalDecision,
    validateRentalId,
    validatePaymentVerification,
};
