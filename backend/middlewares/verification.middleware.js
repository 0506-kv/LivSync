const { body, validationResult } = require('express-validator');

const validateVerificationCode = [
    body('code').trim().matches(/^\d{6}$/).withMessage('Enter the 6-digit code from your email'),
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

module.exports = { validateVerificationCode };
