const { body, param, query, validationResult } = require('express-validator');

const validateSwipe = [
    body('userId').isMongoId().withMessage('Invalid user id'),
    body('direction').isIn(['like', 'pass']).withMessage('Direction must be like or pass'),
    handleValidationErrors,
];

const validateBuddyMessageQuery = [
    param('buddyId').isMongoId().withMessage('Invalid buddy id'),
    query('after').optional().isMongoId().withMessage('Invalid message cursor'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    handleValidationErrors,
];

const validateBuddyMessage = [
    param('buddyId').isMongoId().withMessage('Invalid buddy id'),
    body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1 to 2000 characters'),
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

module.exports = { validateSwipe, validateBuddyMessageQuery, validateBuddyMessage };
