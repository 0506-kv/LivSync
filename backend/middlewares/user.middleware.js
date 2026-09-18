const { body, validationResult } = require('express-validator');

const validateUserRegistration = [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
    body('phone').trim().matches(/^\+?[1-9]\d{7,14}$/).withMessage('Enter a valid phone number'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('dob').isISO8601().toDate().withMessage('Enter a valid date of birth'),
    body('gender').isIn(['male', 'female', 'non-binary', 'other', 'prefer-not-to-say']).withMessage('Enter a valid gender'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['tenant', 'landlord']).withMessage('Role must be tenant or landlord'),
    handleValidationErrors,
];

const validateUserLogin = [
    body('identifier')
        .trim()
        .notEmpty().withMessage('Email or phone number is required')
        .bail()
        .custom((value) => {
            const isEmail = /^\S+@\S+\.\S+$/.test(value);
            const isPhone = /^\+?[1-9]\d{7,14}$/.test(value);

            if (!isEmail && !isPhone) {
                throw new Error('Enter a valid email or phone number');
            }

            return true;
        }),
    body('password').notEmpty().withMessage('Password is required'),
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

module.exports = { validateUserRegistration, validateUserLogin };
