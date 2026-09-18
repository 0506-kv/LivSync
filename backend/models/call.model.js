const mongoose = require('mongoose');

// A tenant asks for a call, the landlord picks the time. The window the landlord sets is the
// only time the room exists: once it ends the call is over for good.
const callSchema = new mongoose.Schema(
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
        mode: {
            type: String,
            enum: ['video', 'voice'],
            required: true,
        },
        note: {
            type: String,
            trim: true,
            maxlength: 300,
            default: '',
        },
        status: {
            type: String,
            enum: ['requested', 'scheduled', 'cancelled'],
            default: 'requested',
            index: true,
        },
        // Both are written when the landlord schedules, and rewritten if they move the call.
        startAt: {
            type: Date,
        },
        endAt: {
            type: Date,
        },
        scheduledAt: {
            type: Date,
        },
        cancelledBy: {
            type: String,
            enum: ['user', 'landlord'],
        },
    },
    { timestamps: true }
);

callSchema.index({ landlord: 1, startAt: 1 });
callSchema.index({ user: 1, startAt: 1 });

const Call = mongoose.model('Call', callSchema);

module.exports = Call;
