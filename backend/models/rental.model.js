const mongoose = require('mongoose');

// One share of the total due. A solo request has a single entry; a BuddyUp request has one
// per tenant, and the agreement is only issued once every entry is settled.
const paymentSchema = new mongoose.Schema(
    {
        payer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        share: { type: Number, min: 1, max: 100, required: true },
        amount: { type: Number, min: 0, required: true },
        mode: { type: String, enum: ['online', 'in-person'] },
        orderId: { type: String },
        paymentId: { type: String },
        receiptNo: { type: String },
        paidAt: { type: Date },
    },
    { _id: false }
);

const rentalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // The co-tenant on a BuddyUp request. Absent on a solo request.
        buddy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // How the requesting tenant's share is worked out: a percentage of the total, or a flat
        // amount they name. Either way the buddy covers whatever is left of the frozen total.
        split: {
            mode: {
                type: String,
                enum: ['percent', 'amount'],
                default: 'percent',
            },
            value: {
                type: Number,
                min: 1,
                default: 50,
            },
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
        payments: {
            type: [paymentSchema],
            default: [],
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
rentalSchema.index({ buddy: 1, createdAt: -1 });
rentalSchema.index({ 'payments.orderId': 1 }, { sparse: true });

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
