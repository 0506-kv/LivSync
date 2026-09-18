const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        landlord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Landlord',
            required: true,
        },
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Listing',
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000,
        },
        // What the tenant wants out of the deal; the rest of the profile is read off the User document.
        preferences: {
            moveInDate: {
                type: Date,
                required: true,
            },
            durationMonths: {
                type: Number,
                required: true,
                min: 1,
                max: 120,
            },
            occupants: {
                type: Number,
                required: true,
                min: 1,
                max: 20,
            },
            note: {
                type: String,
                trim: true,
                maxlength: 500,
                default: '',
            },
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'paid'],
            default: 'pending',
            index: true,
        },
        decidedAt: {
            type: Date,
        },
        // Frozen when the landlord accepts: the listing may be edited later, the agreed deal may not.
        terms: {
            monthlyRent: { type: Number, min: 0 },
            securityDeposit: { type: Number, min: 0 },
            brokerageFee: { type: Number, min: 0 },
            totalDue: { type: Number, min: 0 },
        },
        payment: {
            mode: {
                type: String,
                enum: ['online', 'in-person'],
            },
            amount: {
                type: Number,
                min: 0,
            },
            orderId: {
                type: String,
                index: true,
                sparse: true,
            },
            paymentId: {
                type: String,
            },
            receiptNo: {
                type: String,
            },
            paidAt: {
                type: Date,
            },
        },
        agreement: {
            number: {
                type: String,
            },
            signedAt: {
                type: Date,
            },
        },
    },
    { timestamps: true }
);

// One live request per tenant and listing; a rejected one is reopened in place.
rentalSchema.index({ user: 1, listing: 1 }, { unique: true });
rentalSchema.index({ landlord: 1, createdAt: -1 });
rentalSchema.index({ user: 1, createdAt: -1 });

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
