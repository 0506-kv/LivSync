const { body, param, validationResult } = require('express-validator');

const validateRentalRequest = [
    body('listingId').isMongoId().withMessage('Invalid listing id'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10 to 1000 characters'),
    body('preferences.moveInDate').isISO8601().toDate().withMessage('Enter a valid move-in date'),
    body('preferences.durationMonths').isInt({ min: 1, max: 120 }).withMessage('Duration must be 1 to 120 months').toInt(),
    body('preferences.occupants').isInt({ min: 1, max: 20 }).withMessage('Occupants must be 1 to 20').toInt(),
    body('preferences.note').optional().trim().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
    body('buddyId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid buddy id'),
    body('split').optional().custom((split) => {
        const mode = split?.mode || 'percent';
        const value = Number(split?.value);

        if (!['percent', 'amount'].includes(mode)) throw new Error('Split the cost by percentage or by amount');
        if (!Number.isInteger(value) || value < 1) throw new Error('Enter the share you are paying');
        if (mode === 'percent' && (value < 10 || value > 90)) throw new Error('Your share must be between 10% and 90%');
        if (mode === 'amount' && value > 10000000) throw new Error('Enter a valid share');

        return true;
    }),
    validateDocumentSelections(false),
    handleValidationErrors,
];

const validateRentalDocuments = [
    param('rentalId').isMongoId().withMessage('Invalid rental id'),
    validateDocumentSelections(true),
    handleValidationErrors,
];

const validateOfflineConfirmation = [
    param('rentalId').isMongoId().withMessage('Invalid rental id'),
    body('payerId').isMongoId().withMessage('Invalid tenant id'),
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

function validateDocumentSelections(required) {
    const chain = body('documents');

    if (!required) chain.optional();

    return chain
        .isArray({ max: 12 }).withMessage('Documents must be a list of up to 12 selections')
        .bail()
        .custom((documents) => {
            const requirements = new Set();
            const selectedDocuments = new Set();

            for (const selection of documents) {
                if (!selection || !/^[a-f\d]{24}$/i.test(String(selection.requirementId || ''))) {
                    throw new Error('Each document selection needs a valid requirement');
                }
                if (!/^[a-f\d]{24}$/i.test(String(selection.documentId || ''))) {
                    throw new Error('Each document selection needs a valid vault document');
                }
                if (requirements.has(String(selection.requirementId))) {
                    throw new Error('Select one document for each requirement');
                }
                if (selectedDocuments.has(String(selection.documentId))) {
                    throw new Error('Use a separate file for each requested document');
                }

                requirements.add(String(selection.requirementId));
                selectedDocuments.add(String(selection.documentId));
            }

            return true;
        });
}

module.exports = {
    validateRentalRequest,
    validateOfflineConfirmation,
    validateRentalDecision,
    validateRentalId,
    validateRentalDocuments,
    validatePaymentVerification,
};
