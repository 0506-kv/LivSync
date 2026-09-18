const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
} = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const {
    validateUserRegistration,
    validateUserLogin,
} = require('../middlewares/user.middleware');

const router = express.Router();

router.post('/register', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);
router.post('/logout', requireAuth, logoutUser);
router.get('/profile', requireAuth, getUserProfile);

module.exports = router;
