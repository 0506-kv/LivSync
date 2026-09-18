const jwt = require('jsonwebtoken');
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

// Tenants and landlords are separate collections with separate tokens, so messaging
// accepts either session and reduces it to { id, role }.
function requireParticipant(req, res, next) {
    try {
        const payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

        if (payload.userId) {
            req.participant = { id: payload.userId, role: 'user' };
            return next();
        }

        if (payload.landlordId) {
            req.participant = { id: payload.landlordId, role: 'landlord' };
            return next();
        }

        throw new Error('Invalid session');
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session',
            data: {},
        });
    }
}

function requireTenant(req, res, next) {
    if (req.participant.role !== 'user') {
        return res.status(403).json({
            success: false,
            message: 'Only tenants can start a conversation',
            data: {},
        });
    }

    return next();
}

module.exports = {
    requireParticipant,
    requireTenant,
    validateConversationStart,
    validateMessageCreation,
    validateMessageQuery,
};
