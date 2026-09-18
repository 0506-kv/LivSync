const express = require('express');
const {
    registerLandlord,
    loginLandlord,
    logoutLandlord,
    getLandlordProfile,
    saveLandlordSignature,
} = require('../controllers/landlord.controller');
const {
    validateLandlordRegistration,
    validateLandlordLogin,
    validateSignature,
    requireLandlordAuth,
} = require('../middlewares/landlord.middleware');

const router = express.Router();

router.post('/register', validateLandlordRegistration, registerLandlord);
router.post('/login', validateLandlordLogin, loginLandlord);
router.post('/logout', requireLandlordAuth, logoutLandlord);
router.get('/profile', requireLandlordAuth, getLandlordProfile);
router.post('/signature', requireLandlordAuth, validateSignature, saveLandlordSignature);

module.exports = router;
