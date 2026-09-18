const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        senderRole: {
            type: String,
            required: true,
            enum: ['user', 'landlord'],
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
