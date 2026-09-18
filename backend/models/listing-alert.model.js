const mongoose = require('mongoose');

const alertCriteriaSchema = new mongoose.Schema(
    {
        city: { type: String, trim: true, maxlength: 80, default: '' },
        propertyType: { type: String, enum: ['apartment', 'house', 'studio', 'villa', 'room'] },
        roomType: { type: String, enum: ['entire-place', 'private-room', 'shared-room'] },
        minRent: { type: Number, min: 0 },
        maxRent: { type: Number, min: 0 },
        minBedrooms: { type: Number, min: 0, max: 50 },
        furnished: { type: Boolean },
        availableFrom: { type: Date },
        verifiedLandlord: { type: Boolean, default: false },
    },
    { _id: false }
);

const listingAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        criteria: {
            type: alertCriteriaSchema,
            required: true,
        },
        emailEnabled: { type: Boolean, default: true },
        inAppEnabled: { type: Boolean, default: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

listingAlertSchema.index({ user: 1, createdAt: -1 });

const ListingAlert = mongoose.model('ListingAlert', listingAlertSchema);

module.exports = ListingAlert;
