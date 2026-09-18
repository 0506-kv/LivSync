const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const Listing = require('../models/listing.model');

const DEFAULT_MESSAGE_LIMIT = 50;
const POPULATE = [
    { path: 'user', select: 'name emailVerified' },
    { path: 'landlord', select: 'name companyName businessType verificationStatus emailVerified' },
    { path: 'listing', select: 'title location.city photos' },
];

function otherRole(role) {
    return role === 'user' ? 'landlord' : 'user';
}

function serializeConversation(conversation, role) {
    const counterpart = role === 'user' ? conversation.landlord : conversation.user;

    return {
        id: conversation._id,
        listing: conversation.listing && {
            id: conversation.listing._id,
            title: conversation.listing.title,
            city: conversation.listing.location?.city,
            photo: conversation.listing.photos?.[0] || '',
        },
        counterpart: counterpart && {
            id: counterpart._id,
            name: counterpart.companyName || counterpart.name,
            emailVerified: counterpart.emailVerified,
            role: otherRole(role),
        },
        lastMessage: conversation.lastMessage?.sentAt ? conversation.lastMessage : null,
        unreadCount: conversation.unread?.[role] || 0,
        updatedAt: conversation.updatedAt,
    };
}

function serializeMessage(message, role) {
    return {
        id: message._id,
        text: message.text,
        senderRole: message.senderRole,
        mine: message.senderRole === role,
        createdAt: message.createdAt,
    };
}

// Writes the message and keeps the conversation's inbox preview and unread badge in step.
async function appendMessage(conversationId, senderRole, text) {
    const message = await Message.create({ conversation: conversationId, senderRole, text });

    await Conversation.updateOne(
        { _id: conversationId },
        {
            $set: {
                lastMessage: { text: message.text, senderRole, sentAt: message.createdAt },
            },
            $inc: { [`unread.${otherRole(senderRole)}`]: 1 },
        }
    );

    return message;
}

async function startConversation(req, res) {
    try {
        const { listingId, text } = req.body;
        const listing = await Listing.findOne({ _id: listingId, status: 'published' }).select('landlord');

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                data: {},
            });
        }

        const conversation = await Conversation.findOneAndUpdate(
            { user: req.participant.id, landlord: listing.landlord, listing: listing._id },
            { $setOnInsert: { user: req.participant.id, landlord: listing.landlord, listing: listing._id } },
            { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
        ).populate(POPULATE);

        if (text) {
            const message = await appendMessage(conversation._id, 'user', text);
            conversation.lastMessage = { text: message.text, senderRole: 'user', sentAt: message.createdAt };
        }

        return res.status(201).json({
            success: true,
            message: 'Conversation ready',
            data: { conversation: serializeConversation(conversation, 'user') },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to start conversation',
            data: {},
        });
    }
}

async function getConversations(req, res) {
    try {
        const { id, role } = req.participant;
        const conversations = await Conversation.find({ [role]: id })
            .populate(POPULATE)
            .sort({ updatedAt: -1 });

        return res.json({
            success: true,
            message: 'Conversations retrieved successfully',
            data: {
                conversations: conversations.map((conversation) => serializeConversation(conversation, role)),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve conversations',
            data: {},
        });
    }
}

async function getMessages(req, res) {
    try {
        const { id, role } = req.participant;
        const { after, limit = DEFAULT_MESSAGE_LIMIT } = req.query;
        const conversation = await Conversation.findOne({ _id: req.params.conversationId, [role]: id }).populate(POPULATE);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied',
                data: {},
            });
        }

        // Polling passes the newest message id it already holds, so a refresh only ships new messages.
        const messages = after
            ? await Message.find({ conversation: conversation._id, _id: { $gt: after } }).sort({ _id: 1 }).limit(limit)
            : (await Message.find({ conversation: conversation._id }).sort({ _id: -1 }).limit(limit)).reverse();

        if (conversation.unread[role] > 0) {
            conversation.unread[role] = 0;
            // timestamps stay untouched so reading a thread does not reshuffle the inbox.
            await Conversation.updateOne({ _id: conversation._id }, { $set: { [`unread.${role}`]: 0 } }, { timestamps: false });
        }

        return res.json({
            success: true,
            message: 'Messages retrieved successfully',
            data: {
                conversation: serializeConversation(conversation, role),
                messages: messages.map((message) => serializeMessage(message, role)),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve messages',
            data: {},
        });
    }
}

async function sendMessage(req, res) {
    try {
        const { id, role } = req.participant;
        const conversation = await Conversation.findOne({ _id: req.params.conversationId, [role]: id }).select('_id');

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found or access denied',
                data: {},
            });
        }

        const message = await appendMessage(conversation._id, role, req.body.text);

        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: serializeMessage(message, role) },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to send message',
            data: {},
        });
    }
}

module.exports = {
    startConversation,
    getConversations,
    getMessages,
    sendMessage,
};
