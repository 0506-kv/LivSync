const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: true,
        },
        alert: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ListingAlert',
        },
        type: {
            type: String,
            enum: ['listing-match'],
            required: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 160 },
        message: { type: String, required: true, trim: true, maxlength: 500 },
        readAt: { type: Date },
    },
    { timestamps: true }
);

// One in-app alert per tenant and newly published listing, even if several saved searches match.
notificationSchema.index({ user: 1, listing: 1, type: 1 }, { unique: true });
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
