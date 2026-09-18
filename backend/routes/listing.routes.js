const express = require('express');
const {
    createListing,
    getListings,
    getListingById,
    getOwnListings,
    updateListing,
    deleteListing,
} = require('../controllers/listing.controller');
const { requireLandlordAuth } = require('../middlewares/landlord.middleware');
const {
    validateListingCreation,
    validateListingUpdate,
    validateListingId,
    validateListingQuery,
} = require('../middlewares/listing.middleware');

const router = express.Router();

router.get('/', validateListingQuery, getListings);
router.get('/mine', requireLandlordAuth, getOwnListings);
router.get('/:listingId', validateListingId, getListingById);
router.post('/', requireLandlordAuth, validateListingCreation, createListing);
router.patch('/:listingId', requireLandlordAuth, validateListingId, validateListingUpdate, updateListing);
router.delete('/:listingId', requireLandlordAuth, validateListingId, deleteListing);

module.exports = router;
