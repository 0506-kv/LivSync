const express = require('express');
const {
    registerLandlord,
    loginLandlord,
    logoutLandlord,
    getLandlordProfile,
} = require('../controllers/landlord.controller');
const {
    validateLandlordRegistration,
    validateLandlordLogin,
    requireLandlordAuth,
} = require('../middlewares/landlord.middleware');

const router = express.Router();

router.post('/register', validateLandlordRegistration, registerLandlord);
router.post('/login', validateLandlordLogin, loginLandlord);
router.post('/logout', requireLandlordAuth, logoutLandlord);
router.get('/profile', requireLandlordAuth, getLandlordProfile);

module.exports = router;
