const mongoose = require('mongoose');

// One document per unordered pair of users. It carries the swipes, the match, and — once
// matched — the chat thread metadata, so a match never needs a second lookup to be useful.
// users[0] is the "user" slot and users[1] the "buddy" slot; the pair is always stored sorted
// by id string, which makes the pair itself the key and keeps A→B and B→A the same document.
const buddySchema = new mongoose.Schema(
    {
        users: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            required: true,
            validate: [(value) => value.length === 2, 'A buddy pair needs exactly two users'],
        },
        likedBy: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            default: [],
        },
        passedBy: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            default: [],
        },
        status: {
            type: String,
            enum: ['pending', 'matched', 'passed'],
            default: 'pending',
        },
        matchedAt: {
            type: Date,
        },
        lastMessage: {
            text: { type: String, trim: true, maxlength: 2000, default: '' },
            senderSlot: { type: String, enum: ['user', 'buddy'] },
            sentAt: { type: Date },
        },
        unread: {
            user: { type: Number, default: 0, min: 0 },
            buddy: { type: Number, default: 0, min: 0 },
        },
    },
    { timestamps: true }
);

// Multikey lookup for "every pair I am in"; the positional index keeps a pair unique.
buddySchema.index({ users: 1, status: 1 });
buddySchema.index({ 'users.0': 1, 'users.1': 1 }, { unique: true });

// The stored order of the pair, so both sides agree on who holds which slot.
buddySchema.statics.pairOf = function pairOf(a, b) {
    return [String(a), String(b)].sort();
};

const Buddy = mongoose.model('Buddy', buddySchema);

module.exports = Buddy;
