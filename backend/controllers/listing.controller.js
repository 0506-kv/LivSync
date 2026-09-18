const Listing = require('../models/listing.model');
const Landlord = require('../models/landlord.model');

const LANDLORD_FIELDS = 'name companyName businessType verificationStatus';
// A rented listing stays readable so tenants see it marked sold out; an archived one is gone.
const TENANT_VISIBLE = ['published', 'rented'];
const EDITABLE_FIELDS = [
    'title',
    'description',
    'propertyType',
    'roomType',
    'bedrooms',
    'bathrooms',
    'areaSqFt',
    'furnished',
    'securityDeposit',
    'brokerageFee',
    'photos',
    'floorPlanUrl',
    'virtualTourUrl',
    'amenities',
    'availableFrom',
    'status',
];
const LOCATION_FIELDS = ['address', 'city', 'state', 'postalCode'];
const RENT_FIELDS = ['coldRent', 'utilities', 'otherMonthlyCharges'];

function hasOwnProperty(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function getSortOption(sort) {
    if (sort === 'rent_asc') return { 'rent.coldRent': 1 };
    if (sort === 'rent_desc') return { 'rent.coldRent': -1 };

    return { createdAt: -1 };
}

function applyListingUpdates(listing, changes) {
    EDITABLE_FIELDS.forEach((field) => {
        if (hasOwnProperty(changes, field)) {
            listing[field] = changes[field];
        }
    });

    if (changes.location) {
        LOCATION_FIELDS.forEach((field) => {
            if (hasOwnProperty(changes.location, field)) {
                listing.location[field] = changes.location[field];
            }
        });
    }

    if (changes.rent) {
        RENT_FIELDS.forEach((field) => {
            if (hasOwnProperty(changes.rent, field)) {
                listing.rent[field] = changes.rent[field];
            }
        });
    }
}

async function createListing(req, res) {
    try {
        const landlordExists = await Landlord.exists({ _id: req.landlordId });

        if (!landlordExists) {
            return res.status(404).json({
                success: false,
                message: 'Landlord not found',
                data: {},
            });
        }

        const listing = await Listing.create({
            ...getListingData(req.body),
            landlord: req.landlordId,
        });
        await listing.populate('landlord', LANDLORD_FIELDS);

        return res.status(201).json({
            success: true,
            message: 'Listing created successfully',
            data: { listing },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to create listing',
            data: {},
        });
    }
}

async function getListings(req, res) {
    try {
        const { city, propertyType, roomType, minRent, maxRent, availableFrom, page = 1, limit = 12, sort } = req.query;
        const filters = { status: { $in: TENANT_VISIBLE } };

        if (city) filters['location.city'] = new RegExp(`^${escapeRegExp(city)}$`, 'i');
        if (propertyType) filters.propertyType = propertyType;
        if (roomType) filters.roomType = roomType;
        if (minRent !== undefined || maxRent !== undefined) {
            filters['rent.coldRent'] = {};
            if (minRent !== undefined) filters['rent.coldRent'].$gte = minRent;
            if (maxRent !== undefined) filters['rent.coldRent'].$lte = maxRent;
        }
        if (availableFrom) filters.availableFrom = { $lte: availableFrom };

        const [listings, total] = await Promise.all([
            Listing.find(filters)
                .populate('landlord', LANDLORD_FIELDS)
                .sort(getSortOption(sort))
                .skip((page - 1) * limit)
                .limit(limit),
            Listing.countDocuments(filters),
        ]);

        return res.json({
            success: true,
            message: 'Listings retrieved successfully',
            data: {
                listings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve listings',
            data: {},
        });
    }
}

async function getListingById(req, res) {
    try {
        const listing = await Listing.findOne({
            _id: req.params.listingId,
            status: { $in: TENANT_VISIBLE },
        }).populate('landlord', LANDLORD_FIELDS);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                data: {},
            });
        }

        return res.json({
            success: true,
            message: 'Listing retrieved successfully',
            data: { listing },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve listing',
            data: {},
        });
    }
}

async function getOwnListings(req, res) {
    try {
        const listings = await Listing.find({ landlord: req.landlordId })
            .populate('landlord', LANDLORD_FIELDS)
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            message: 'Landlord listings retrieved successfully',
            data: { listings },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve landlord listings',
            data: {},
        });
    }
}

async function updateListing(req, res) {
    try {
        const listing = await Listing.findOne({
            _id: req.params.listingId,
            landlord: req.landlordId,
        });

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found or access denied',
                data: {},
            });
        }

        if (!hasEditableChanges(req.body)) {
            return res.status(400).json({
                success: false,
                message: 'Provide at least one editable listing field',
                data: {},
            });
        }

        applyListingUpdates(listing, req.body);
        await listing.save();
        await listing.populate('landlord', LANDLORD_FIELDS);

        return res.json({
            success: true,
            message: 'Listing updated successfully',
            data: { listing },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to update listing',
            data: {},
        });
    }
}

async function deleteListing(req, res) {
    try {
        const listing = await Listing.findOneAndDelete({
            _id: req.params.listingId,
            landlord: req.landlordId,
        });

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found or access denied',
                data: {},
            });
        }

        return res.json({
            success: true,
            message: 'Listing deleted successfully',
            data: {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to delete listing',
            data: {},
        });
    }
}

function hasEditableChanges(changes) {
    return EDITABLE_FIELDS.some((field) => hasOwnProperty(changes, field))
        || (changes.location && LOCATION_FIELDS.some((field) => hasOwnProperty(changes.location, field)))
        || (changes.rent && RENT_FIELDS.some((field) => hasOwnProperty(changes.rent, field)));
}

function getListingData(data) {
    return {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        roomType: data.roomType,
        location: {
            address: data.location.address,
            city: data.location.city,
            state: data.location.state,
            postalCode: data.location.postalCode,
        },
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        areaSqFt: data.areaSqFt,
        furnished: data.furnished,
        rent: {
            coldRent: data.rent.coldRent,
            utilities: data.rent.utilities,
            otherMonthlyCharges: data.rent.otherMonthlyCharges,
        },
        securityDeposit: data.securityDeposit,
        brokerageFee: data.brokerageFee,
        photos: data.photos,
        floorPlanUrl: data.floorPlanUrl,
        virtualTourUrl: data.virtualTourUrl,
        amenities: data.amenities,
        availableFrom: data.availableFrom,
        status: data.status,
    };
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    createListing,
    getListings,
    getListingById,
    getOwnListings,
    updateListing,
    deleteListing,
};
