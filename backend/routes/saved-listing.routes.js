const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const { getSavedListings, saveListing, removeSavedListing } = require('../controllers/saved-listing.controller');
const { validateSavedListingId } = require('../middlewares/saved-listing.middleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', getSavedListings);
router.post('/:listingId', validateSavedListingId, saveListing);
router.delete('/:listingId', validateSavedListingId, removeSavedListing);

module.exports = router;
