const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const {
    getListingAlerts,
    createListingAlert,
    updateListingAlert,
    deleteListingAlert,
    getNotifications,
    markNotificationRead,
} = require('../controllers/listing-alert.controller');
const {
    validateListingAlert,
    validateListingAlertUpdate,
    validateAlertId,
    validateNotificationId,
} = require('../middlewares/listing-alert.middleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', getListingAlerts);
router.post('/', validateListingAlert, createListingAlert);
router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', validateNotificationId, markNotificationRead);
router.patch('/:alertId', validateListingAlertUpdate, updateListingAlert);
router.delete('/:alertId', validateAlertId, deleteListingAlert);

module.exports = router;
