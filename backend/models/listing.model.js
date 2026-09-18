const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
    {
        landlord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Landlord',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 120,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 20,
            maxlength: 3000,
        },
        propertyType: {
            type: String,
            required: true,
            enum: ['apartment', 'house', 'studio', 'villa', 'room'],
        },
        roomType: {
            type: String,
            required: true,
            enum: ['entire-place', 'private-room', 'shared-room'],
        },
        location: {
            address: {
                type: String,
                required: true,
                trim: true,
                maxlength: 250,
            },
            city: {
                type: String,
                required: true,
                trim: true,
                maxlength: 80,
            },
            state: {
                type: String,
                required: true,
                trim: true,
                maxlength: 80,
            },
            postalCode: {
                type: String,
                required: true,
                trim: true,
                maxlength: 20,
            },
        },
        bedrooms: {
            type: Number,
            required: true,
            min: 0,
            max: 50,
        },
        bathrooms: {
            type: Number,
            required: true,
            min: 0,
            max: 50,
        },
        areaSqFt: {
            type: Number,
            required: true,
            min: 1,
        },
        furnished: {
            type: Boolean,
            default: false,
        },
        rent: {
            coldRent: {
                type: Number,
                required: true,
                min: 0,
            },
            utilities: {
                type: Number,
                default: 0,
                min: 0,
            },
            otherMonthlyCharges: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
        securityDeposit: {
            type: Number,
            default: 0,
            min: 0,
        },
        brokerageFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        photos: {
            type: [String],
            default: [],
        },
        floorPlanUrl: {
            type: String,
            trim: true,
        },
        virtualTourUrl: {
            type: String,
            trim: true,
        },
        // Google Drive share link to a .glb file; served to tenants through /listings/:id/model.
        modelUrl: {
            type: String,
            trim: true,
        },
        amenities: {
            type: [String],
            default: [],
        },
        availableFrom: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['published', 'rented', 'archived'],
            default: 'published',
            index: true,
        },
        verificationStatus: {
            type: String,
            enum: ['unverified', 'pending', 'verified', 'rejected'],
            default: 'unverified',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

listingSchema.virtual('totalMonthlyRent').get(function getTotalMonthlyRent() {
    return this.rent.coldRent + this.rent.utilities + this.rent.otherMonthlyCharges;
});

listingSchema.index({ status: 1, 'location.city': 1, 'rent.coldRent': 1, availableFrom: 1 });
listingSchema.index({ status: 1, landlord: 1 });
listingSchema.index({ landlord: 1, createdAt: -1 });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
