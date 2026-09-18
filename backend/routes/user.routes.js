const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserPreferences,
} = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const {
    validateUserRegistration,
    validateUserLogin,
    validateUserPreferences,
} = require('../middlewares/user.middleware');

const router = express.Router();

router.post('/register', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);
router.post('/logout', requireAuth, logoutUser);
router.get('/profile', requireAuth, getUserProfile);
router.patch('/preferences', requireAuth, validateUserPreferences, updateUserPreferences);

module.exports = router;
