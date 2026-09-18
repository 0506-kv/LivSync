const ListingAlert = require('../models/listing-alert.model');
const Notification = require('../models/notification.model');
const { sendListingAlertEmail } = require('../utils/mailer');

function idOf(value) {
    return value?._id || value;
}

function serializeAlert(alert) {
    return {
        id: alert._id,
        criteria: alert.criteria,
        emailEnabled: alert.emailEnabled,
        inAppEnabled: alert.inAppEnabled,
        active: alert.active,
        createdAt: alert.createdAt,
    };
}

function serializeNotification(notification) {
    return {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        readAt: notification.readAt || null,
        createdAt: notification.createdAt,
        listing: notification.listing && {
            id: notification.listing._id,
            title: notification.listing.title,
            city: notification.listing.location?.city,
            photo: notification.listing.photos?.[0] || '',
        },
    };
}

function listingMatchesAlert(listing, criteria) {
    const rent = Number(listing.rent?.coldRent || 0);

    if (criteria.city && listing.location?.city?.toLowerCase() !== criteria.city.toLowerCase()) return false;
    if (criteria.propertyType && listing.propertyType !== criteria.propertyType) return false;
    if (criteria.roomType && listing.roomType !== criteria.roomType) return false;
    if (criteria.minRent !== undefined && rent < criteria.minRent) return false;
    if (criteria.maxRent !== undefined && rent > criteria.maxRent) return false;
    if (criteria.minBedrooms !== undefined && listing.bedrooms < criteria.minBedrooms) return false;
    if (criteria.furnished !== undefined && listing.furnished !== criteria.furnished) return false;
    if (criteria.availableFrom && new Date(listing.availableFrom) > new Date(criteria.availableFrom)) return false;
    if (criteria.verifiedLandlord && !listing.landlord?.emailVerified) return false;

    return true;
}

async function notifyMatchingListing(listing) {
    if (listing.status !== 'published') return;

    const alerts = await ListingAlert.find({ active: true }).populate('user', 'name email emailVerified');
    const matchesByUser = new Map();

    alerts.forEach((alert) => {
        if (!alert.user || !listingMatchesAlert(listing, alert.criteria)) return;

        const userId = String(idOf(alert.user));
        const matches = matchesByUser.get(userId) || { user: alert.user, alerts: [] };

        matches.alerts.push(alert);
        matchesByUser.set(userId, matches);
    });

    await Promise.all([...matchesByUser.values()].map(async ({ user, alerts }) => {
        const inAppEnabled = alerts.some((alert) => alert.inAppEnabled);
        const emailEnabled = alerts.some((alert) => alert.emailEnabled);

        if (inAppEnabled) {
            await Notification.updateOne(
                { user: user._id, listing: listing._id, type: 'listing-match' },
                {
                    $setOnInsert: {
                        user: user._id,
                        listing: listing._id,
                        alert: alerts[0]._id,
                        type: 'listing-match',
                        title: 'A new home matches your alert',
                        message: `${listing.title} in ${listing.location.city} matches one of your saved searches.`,
                    },
                },
                { upsert: true }
            );
        }

        if (emailEnabled && user.emailVerified) {
            sendListingAlertEmail(user.email, user.name, listing).catch((error) => {
                console.error(`Unable to email a listing alert to ${user.email}:`, error.message);
            });
        }
    }));
}

async function getListingAlerts(req, res) {
    try {
        const alerts = await ListingAlert.find({ user: req.userId }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            message: 'Listing alerts retrieved successfully',
            data: { alerts: alerts.map(serializeAlert) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to retrieve listing alerts', data: {} });
    }
}

async function createListingAlert(req, res) {
    try {
        const alert = await ListingAlert.create({
            user: req.userId,
            criteria: req.body.criteria,
            emailEnabled: req.body.emailEnabled,
            inAppEnabled: req.body.inAppEnabled,
            active: req.body.active,
        });

        return res.status(201).json({
            success: true,
            message: 'Listing alert created successfully',
            data: { alert: serializeAlert(alert) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to create listing alert', data: {} });
    }
}

async function updateListingAlert(req, res) {
    try {
        const changes = {};

        ['emailEnabled', 'inAppEnabled', 'active'].forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) changes[field] = req.body[field];
        });
        const alert = await ListingAlert.findOneAndUpdate(
            { _id: req.params.alertId, user: req.userId },
            { $set: changes },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ success: false, message: 'Listing alert not found', data: {} });
        }

        return res.json({ success: true, message: 'Listing alert updated successfully', data: { alert: serializeAlert(alert) } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to update listing alert', data: {} });
    }
}

async function deleteListingAlert(req, res) {
    try {
        const alert = await ListingAlert.findOneAndDelete({ _id: req.params.alertId, user: req.userId });

        if (!alert) {
            return res.status(404).json({ success: false, message: 'Listing alert not found', data: {} });
        }

        return res.json({ success: true, message: 'Listing alert deleted successfully', data: {} });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to delete listing alert', data: {} });
    }
}

async function getNotifications(req, res) {
    try {
        const notifications = await Notification.find({ user: req.userId })
            .populate('listing', 'title location.city photos')
            .sort({ createdAt: -1 })
            .limit(50);

        return res.json({
            success: true,
            message: 'Listing notifications retrieved successfully',
            data: { notifications: notifications.map(serializeNotification) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to retrieve listing notifications', data: {} });
    }
}

async function markNotificationRead(req, res) {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.notificationId, user: req.userId },
            { $set: { readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found', data: {} });
        }

        return res.json({ success: true, message: 'Notification marked as read', data: {} });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to update notification', data: {} });
    }
}

module.exports = {
    getListingAlerts,
    createListingAlert,
    updateListingAlert,
    deleteListingAlert,
    getNotifications,
    markNotificationRead,
    notifyMatchingListing,
    listingMatchesAlert,
};
