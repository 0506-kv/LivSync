const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// One live code per account. Mongo's TTL monitor clears expired rows, so nothing is swept by hand.
const otpSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        ownerType: {
            type: String,
            required: true,
            enum: ['user', 'landlord'],
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        codeHash: {
            type: String,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

otpSchema.index({ owner: 1, ownerType: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

otpSchema.methods.compareCode = async function compareCode(code) {
    return bcrypt.compare(String(code), this.codeHash);
};

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
