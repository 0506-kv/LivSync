const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        // The thread this belongs to: a Conversation (tenant to landlord) or a Buddy pair.
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        // The slot of the thread the sender holds, not a global role: a buddy thread has a
        // "user" side and a "buddy" side, both of them tenants.
        senderRole: {
            type: String,
            required: true,
            enum: ['user', 'landlord', 'buddy'],
        },
        text: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 2000,
        },
    },
    { timestamps: true }
);

// Messages are paged and polled by _id, which is a total order matching send order.
messageSchema.index({ conversation: 1, _id: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
