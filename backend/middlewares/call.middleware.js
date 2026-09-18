const { body, param, validationResult } = require('express-validator');

const validateCallRequest = [
    body('listingId').isMongoId().withMessage('Invalid listing id'),
    body('mode').isIn(['video', 'voice']).withMessage('Choose a video or a voice call'),
    body('note').optional().trim().isLength({ max: 300 }).withMessage('Note cannot exceed 300 characters'),
    handleValidationErrors,
];

const validateSchedule = [
    param('callId').isMongoId().withMessage('Invalid call id'),
    body('startAt').isISO8601().withMessage('Enter a valid start time').toDate(),
    body('durationMinutes').isInt({ min: 1, max: 30 }).withMessage('A call can be at most 30 minutes long').toInt(),
    handleValidationErrors,
];

const validateCallId = [
    param('callId').isMongoId().withMessage('Invalid call id'),
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
    validateCallRequest,
    validateSchedule,
    validateCallId,
};
