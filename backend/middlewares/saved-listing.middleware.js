const { param, validationResult } = require('express-validator');

const validateSavedListingId = [
    param('listingId').isMongoId().withMessage('Invalid listing id'),
    handleValidationErrors,
];

function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, message: errors.array()[0].msg, data: {} });
    }

    return next();
}

module.exports = { validateSavedListingId };
