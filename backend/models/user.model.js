const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const preferenceSchema = new mongoose.Schema(
    {
        // Opt-in: only these users are dealt into anyone's BuddyUp deck.
        lookingForBuddy: { type: Boolean, default: false },
        budget: {
            min: { type: Number, default: 0, min: 0 },
            max: { type: Number, default: 0, min: 0 },
        },
        city: { type: String, trim: true, maxlength: 80, default: '' },
        moveInDate: { type: Date },
        sleepSchedule: { type: String, enum: ['early-bird', 'night-owl', 'flexible'], default: 'flexible' },
        workSchedule: { type: String, enum: ['day-shift', 'night-shift', 'remote', 'student', 'flexible'], default: 'flexible' },
        cleanliness: { type: Number, min: 1, max: 5, default: 3 },
        noiseTolerance: { type: Number, min: 1, max: 5, default: 3 },
        foodHabits: { type: String, enum: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian', 'no-preference'], default: 'no-preference' },
        smoking: { type: String, enum: ['non-smoker', 'occasional', 'smoker'], default: 'non-smoker' },
        drinking: { type: String, enum: ['never', 'socially', 'regularly'], default: 'never' },
        pets: { type: String, enum: ['no-pets', 'has-pets', 'fine-with-pets'], default: 'no-pets' },
        guests: { type: String, enum: ['rarely', 'sometimes', 'often'], default: 'sometimes' },
        roommateGender: { type: String, enum: ['any', 'male', 'female', 'non-binary'], default: 'any' },
        occupation: { type: String, trim: true, maxlength: 80, default: '' },
        interests: { type: [String], default: [] },
        bio: { type: String, trim: true, maxlength: 500, default: '' },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
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
        dob: {
            type: Date,
            required: true,
        },
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-to-say'],
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: ['tenant', 'landlord'],
            default: 'tenant',
        },
        // Lifestyle profile used for BuddyUp matching and shown to a landlord on a request.
        preferences: {
            type: preferenceSchema,
            default: () => ({}),
        },
    },
    { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(password) {
    return bcrypt.compare(password, this.password);
};

userSchema.index({ 'preferences.lookingForBuddy': 1, role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
