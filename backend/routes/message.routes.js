const express = require('express');
const {
    startConversation,
    getConversations,
    getMessages,
    sendMessage,
} = require('../controllers/message.controller');
const {
    requireParticipant,
    requireTenant,
    validateConversationStart,
    validateMessageCreation,
    validateMessageQuery,
} = require('../middlewares/message.middleware');

const router = express.Router();

router.use(requireParticipant);

router.get('/conversations', getConversations);
router.post('/conversations', requireTenant, validateConversationStart, startConversation);
router.get('/conversations/:conversationId/messages', validateMessageQuery, getMessages);
router.post('/conversations/:conversationId/messages', validateMessageCreation, sendMessage);

module.exports = router;
