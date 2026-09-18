const { body, param, validationResult } = require('express-validator');

const PROPERTY_TYPES = ['apartment', 'house', 'studio', 'villa', 'room'];
const ROOM_TYPES = ['entire-place', 'private-room', 'shared-room'];

const validateListingAlert = [
    body('criteria').isObject().withMessage('Alert criteria are required'),
    body('criteria.city').optional().trim().isLength({ max: 80 }).withMessage('City cannot exceed 80 characters'),
    body('criteria.propertyType').optional().isIn(PROPERTY_TYPES).withMessage('Enter a valid property type'),
    body('criteria.roomType').optional().isIn(ROOM_TYPES).withMessage('Enter a valid room type'),
    body('criteria.minRent').optional().isInt({ min: 0, max: 10000000 }).withMessage('Enter a valid minimum rent').toInt(),
    body('criteria.maxRent').optional().isInt({ min: 0, max: 10000000 }).withMessage('Enter a valid maximum rent').toInt()
        .custom((value, { req }) => {
            if (req.body.criteria?.minRent !== undefined && value < req.body.criteria.minRent) {
                throw new Error('Maximum rent cannot be below the minimum');
            }

            return true;
        }),
    body('criteria.minBedrooms').optional().isInt({ min: 0, max: 50 }).withMessage('Enter valid bedrooms').toInt(),
    body('criteria.furnished').optional().isBoolean().withMessage('Furnished must be true or false').toBoolean(),
    body('criteria.availableFrom').optional().isISO8601().withMessage('Enter a valid availability date').toDate(),
    body('criteria.verifiedLandlord').optional().isBoolean().withMessage('Invalid verified-landlord setting').toBoolean(),
    body('emailEnabled').optional().isBoolean().withMessage('Invalid email-alert setting').toBoolean(),
    body('inAppEnabled').optional().isBoolean().withMessage('Invalid in-app-alert setting').toBoolean(),
    body('active').optional().isBoolean().withMessage('Invalid alert status').toBoolean(),
    handleValidationErrors,
];

const validateListingAlertUpdate = [
    param('alertId').isMongoId().withMessage('Invalid listing alert id'),
    body().custom((value) => {
        if (!['emailEnabled', 'inAppEnabled', 'active'].some((field) => Object.prototype.hasOwnProperty.call(value, field))) {
            throw new Error('Provide an alert setting to update');
        }

        return true;
    }),
    body('emailEnabled').optional().isBoolean().withMessage('Invalid email-alert setting').toBoolean(),
    body('inAppEnabled').optional().isBoolean().withMessage('Invalid in-app-alert setting').toBoolean(),
    body('active').optional().isBoolean().withMessage('Invalid alert status').toBoolean(),
    handleValidationErrors,
];

const validateAlertId = [
    param('alertId').isMongoId().withMessage('Invalid listing alert id'),
    handleValidationErrors,
];

const validateNotificationId = [
    param('notificationId').isMongoId().withMessage('Invalid notification id'),
    handleValidationErrors,
];

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, message: errors.array()[0].msg, data: {} });
    }

    return next();
}

module.exports = { validateListingAlert, validateListingAlertUpdate, validateAlertId, validateNotificationId };
