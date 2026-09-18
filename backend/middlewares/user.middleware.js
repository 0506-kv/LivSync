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

const validateUserPreferences = [
    body('preferences').isObject().withMessage('Preferences are required'),
    body('preferences.lookingForBuddy').optional().isBoolean().withMessage('Invalid BuddyUp setting').toBoolean(),
    body('preferences.budget.min').optional().isInt({ min: 0, max: 10000000 }).withMessage('Enter a valid minimum budget').toInt(),
    body('preferences.budget.max').optional().isInt({ min: 0, max: 10000000 }).withMessage('Enter a valid maximum budget').toInt()
        .custom((value, { req }) => {
            if (value < Number(req.body.preferences?.budget?.min || 0)) {
                throw new Error('Maximum budget cannot be below the minimum');
            }

            return true;
        }),
    body('preferences.city').optional().trim().isLength({ max: 80 }).withMessage('City cannot exceed 80 characters'),
    body('preferences.moveInDate').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid move-in date').toDate(),
    body('preferences.sleepSchedule').optional().isIn(['early-bird', 'night-owl', 'flexible']).withMessage('Invalid sleep schedule'),
    body('preferences.workSchedule').optional().isIn(['day-shift', 'night-shift', 'remote', 'student', 'flexible']).withMessage('Invalid work schedule'),
    body('preferences.cleanliness').optional().isInt({ min: 1, max: 5 }).withMessage('Cleanliness must be 1 to 5').toInt(),
    body('preferences.noiseTolerance').optional().isInt({ min: 1, max: 5 }).withMessage('Noise tolerance must be 1 to 5').toInt(),
    body('preferences.foodHabits').optional().isIn(['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian', 'no-preference']).withMessage('Invalid food habits'),
    body('preferences.smoking').optional().isIn(['non-smoker', 'occasional', 'smoker']).withMessage('Invalid smoking preference'),
    body('preferences.drinking').optional().isIn(['never', 'socially', 'regularly']).withMessage('Invalid drinking preference'),
    body('preferences.pets').optional().isIn(['no-pets', 'has-pets', 'fine-with-pets']).withMessage('Invalid pet preference'),
    body('preferences.guests').optional().isIn(['rarely', 'sometimes', 'often']).withMessage('Invalid guest preference'),
    body('preferences.roommateGender').optional().isIn(['any', 'male', 'female', 'non-binary']).withMessage('Invalid roommate gender preference'),
    body('preferences.occupation').optional().trim().isLength({ max: 80 }).withMessage('Occupation cannot exceed 80 characters'),
    body('preferences.interests').optional().isArray({ max: 15 }).withMessage('Add up to 15 interests'),
    body('preferences.interests.*').trim().isLength({ min: 1, max: 30 }).withMessage('Each interest must be 1 to 30 characters'),
    body('preferences.bio').optional().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
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

module.exports = { validateUserRegistration, validateUserLogin, validateUserPreferences };
