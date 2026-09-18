const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
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
        lastMessage: {
            text: {
                type: String,
                trim: true,
                maxlength: 2000,
                default: '',
            },
            senderRole: {
                type: String,
                enum: ['user', 'landlord'],
            },
            sentAt: {
                type: Date,
            },
        },
        unread: {
            user: {
                type: Number,
                default: 0,
                min: 0,
            },
            landlord: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
    },
    { timestamps: true }
);

// One thread per tenant + listing pair, so an enquiry always reopens the same conversation.
conversationSchema.index({ user: 1, landlord: 1, listing: 1 }, { unique: true });
conversationSchema.index({ user: 1, updatedAt: -1 });
conversationSchema.index({ landlord: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
