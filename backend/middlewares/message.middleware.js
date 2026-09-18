const { body, param, query, validationResult } = require('express-validator');

const validateConversationStart = [
    body('listingId').isMongoId().withMessage('Invalid listing id'),
    body('text').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1 to 2000 characters'),
    handleValidationErrors,
];

const validateMessageCreation = [
    param('conversationId').isMongoId().withMessage('Invalid conversation id'),
    body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1 to 2000 characters'),
    handleValidationErrors,
];

const validateMessageQuery = [
    param('conversationId').isMongoId().withMessage('Invalid conversation id'),
    query('after').optional().isMongoId().withMessage('Invalid message cursor'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
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
    validateConversationStart,
    validateMessageCreation,
    validateMessageQuery,
};
