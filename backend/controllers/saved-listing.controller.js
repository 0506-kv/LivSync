const SavedListing = require('../models/saved-listing.model');
const Listing = require('../models/listing.model');

const LANDLORD_FIELDS = 'name companyName businessType verificationStatus emailVerified';

async function getSavedListings(req, res) {
    try {
        const savedListings = await SavedListing.find({ user: req.userId })
            .populate({ path: 'listing', populate: { path: 'landlord', select: LANDLORD_FIELDS } })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            message: 'Saved listings retrieved successfully',
            data: {
                savedListings: savedListings
                    .filter((savedListing) => savedListing.listing)
                    .map((savedListing) => ({ id: savedListing._id, listing: savedListing.listing, savedAt: savedListing.createdAt })),
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to retrieve saved listings', data: {} });
    }
}

async function saveListing(req, res) {
    try {
        const listing = await Listing.findOne({ _id: req.params.listingId, status: { $in: ['published', 'rented'] } });

        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found', data: {} });
        }

        const existing = await SavedListing.findOne({ user: req.userId, listing: listing._id });

        if (existing) {
            return res.json({ success: true, message: 'Listing is already saved', data: { savedListing: { id: existing._id, listing: listing._id, savedAt: existing.createdAt } } });
        }

        const savedListing = await SavedListing.create({ user: req.userId, listing: listing._id });

        return res.status(201).json({
            success: true,
            message: 'Listing saved successfully',
            data: { savedListing: { id: savedListing._id, listing: listing._id, savedAt: savedListing.createdAt } },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.json({ success: true, message: 'Listing is already saved', data: {} });
        }

        return res.status(500).json({ success: false, message: 'Unable to save listing', data: {} });
    }
}

async function removeSavedListing(req, res) {
    try {
        await SavedListing.deleteOne({ user: req.userId, listing: req.params.listingId });

        return res.json({ success: true, message: 'Listing removed from saved homes', data: {} });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to remove saved listing', data: {} });
    }
}

module.exports = { getSavedListings, saveListing, removeSavedListing };
