const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const landlordSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /^\+?[1-9]\d{7,14}$/,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: /^\S+@\S+\.\S+$/,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerifiedAt: {
            type: Date,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false,
        },
        businessType: {
            type: String,
            required: true,
            enum: ['individual', 'company'],
        },
        companyName: {
            type: String,
            trim: true,
            maxlength: 120,
            required() {
                return this.businessType === 'company';
            },
        },
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
        propertyTypes: {
            type: [{
                type: String,
                enum: ['apartment', 'house', 'room', 'commercial'],
            }],
            default: [],
        },
        profileDescription: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
        },
        // Drawn once and reused on every rental agreement; heavy, so it is never loaded by default.
        signature: {
            dataUrl: {
                type: String,
                select: false,
            },
            signedAt: {
                type: Date,
            },
        },
    },
    { timestamps: true }
);

landlordSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
});

landlordSchema.index({ emailVerified: 1 });

landlordSchema.methods.comparePassword = async function comparePassword(password) {
    return bcrypt.compare(password, this.password);
};

const Landlord = mongoose.model('Landlord', landlordSchema);

module.exports = Landlord;
