const { RtcTokenBuilder, RtcRole } = require('agora-token');
const Call = require('../models/call.model');
const Listing = require('../models/listing.model');

const MINUTE = 60 * 1000;
const MAX_CALL_MINUTES = 30;
const HISTORY_WINDOW = 24 * 60 * MINUTE;
const ACTIVE = ['requested', 'scheduled'];
const POPULATE = [
    { path: 'user', select: 'name' },
    { path: 'landlord', select: 'name companyName' },
    { path: 'listing', select: 'title location.city' },
];
// Agora needs a numeric uid per participant; a call only ever has these two.
const UID = { landlord: 1, user: 2 };

// Turns the landlord's chosen start and length into the window the call lives in, refusing
// anything in the past or longer than half an hour.
function buildSchedule(startAt, durationMinutes, now = new Date()) {
    const start = new Date(startAt);
    const minutes = Number(durationMinutes);

    if (Number.isNaN(start.getTime()) || start <= now) return { error: 'Pick a start time in the future' };
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_CALL_MINUTES) {
        return { error: `A call can be at most ${MAX_CALL_MINUTES} minutes long` };
    }

    return { startAt: start, endAt: new Date(start.getTime() + minutes * MINUTE) };
}

// The room is open for exactly the window the landlord set, and is dead once it passes.
function canJoin(call, now = new Date()) {
    if (call.status !== 'scheduled') return false;

    return now >= new Date(call.startAt) && now < new Date(call.endAt);
}

// The token dies with the call, so a leaked one cannot be replayed afterwards.
function tokenSeconds(call, now = new Date()) {
    return Math.max(60, Math.ceil((new Date(call.endAt) - now) / 1000));
}

function serializeCall(call, role) {
    const counterpart = role === 'landlord' ? call.user : call.landlord;

    return {
        id: call._id,
        status: call.status,
        mode: call.mode,
        note: call.note || '',
        startAt: call.startAt || null,
        endAt: call.endAt || null,
        cancelledBy: call.cancelledBy || null,
        counterpart: counterpart && {
            name: counterpart.companyName || counterpart.name,
            role: role === 'landlord' ? 'user' : 'landlord',
        },
        listing: call.listing && {
            id: call.listing._id,
            title: call.listing.title,
            city: call.listing.location?.city,
        },
        joinable: canJoin(call),
    };
}

async function requestCall(req, res) {
    try {
        const { listingId, mode, note = '' } = req.body;
        const listing = await Listing.findOne({ _id: listingId, status: { $in: ['published', 'rented'] } }).select('landlord');

        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found', data: {} });
        }

        // One live call per tenant and listing; the old one has to be seen through or dropped first.
        const existing = await Call.exists({ user: req.participant.id, listing: listing._id, status: { $in: ACTIVE } });

        if (existing) {
            return res.status(409).json({ success: false, message: 'You already have a call open for this listing', data: {} });
        }

        const call = await Call.create({
            user: req.participant.id,
            landlord: listing.landlord,
            listing: listing._id,
            mode,
            note,
        });

        await call.populate(POPULATE);

        return res.status(201).json({
            success: true,
            message: 'Call requested successfully',
            data: { call: serializeCall(call, 'user') },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to request the call', data: {} });
    }
}

async function scheduleCall(req, res) {
    try {
        const schedule = buildSchedule(req.body.startAt, req.body.durationMinutes);

        if (schedule.error) {
            return res.status(422).json({ success: false, message: schedule.error, data: {} });
        }

        const call = await Call.findOne({
            _id: req.params.callId,
            landlord: req.participant.id,
            status: { $in: ACTIVE },
        });

        if (!call) {
            return res.status(404).json({ success: false, message: 'Call request not found', data: {} });
        }

        // A call that starts before another ends would leave the landlord on two at once.
        const clash = await Call.exists({
            _id: { $ne: call._id },
            landlord: req.participant.id,
            status: 'scheduled',
            startAt: { $lt: schedule.endAt },
            endAt: { $gt: schedule.startAt },
        });

        if (clash) {
            return res.status(409).json({ success: false, message: 'That overlaps another call you have scheduled', data: {} });
        }

        Object.assign(call, schedule, { status: 'scheduled', scheduledAt: new Date() });
        await call.save();
        await call.populate(POPULATE);

        return res.json({
            success: true,
            message: 'Call scheduled successfully',
            data: { call: serializeCall(call, 'landlord') },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to schedule the call', data: {} });
    }
}

async function cancelCall(req, res) {
    try {
        const { id, role } = req.participant;
        const call = await Call.findOne({ _id: req.params.callId, [role]: id, status: { $in: ACTIVE } });

        if (!call) {
            return res.status(404).json({ success: false, message: 'Call not found', data: {} });
        }

        call.status = 'cancelled';
        call.cancelledBy = role;
        await call.save();
        await call.populate(POPULATE);

        return res.json({
            success: true,
            message: 'Call cancelled successfully',
            data: { call: serializeCall(call, role) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to cancel the call', data: {} });
    }
}

async function getCalls(req, res) {
    try {
        const { id, role } = req.participant;
        // Requests awaiting a time have no start yet and sort first; finished calls drop off after a day.
        const calls = await Call.find({
            [role]: id,
            $or: [{ startAt: null }, { startAt: { $gte: new Date(Date.now() - HISTORY_WINDOW) } }],
        })
            .populate(POPULATE)
            .sort({ startAt: 1, createdAt: 1 });

        return res.json({
            success: true,
            message: 'Calls retrieved successfully',
            data: { calls: calls.map((call) => serializeCall(call, role)) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to retrieve calls', data: {} });
    }
}

async function getCallToken(req, res) {
    try {
        const { id, role } = req.participant;
        const { AGORA_APP_ID, AGORA_APP_PRIMARY_CERTIFICATE } = process.env;

        if (!AGORA_APP_ID || !AGORA_APP_PRIMARY_CERTIFICATE) {
            return res.status(500).json({ success: false, message: 'Calling is not configured', data: {} });
        }

        const call = await Call.findOne({ _id: req.params.callId, [role]: id }).populate(POPULATE);

        if (!call) {
            return res.status(404).json({ success: false, message: 'Call not found', data: {} });
        }

        if (!canJoin(call)) {
            const message = call.status === 'scheduled'
                ? 'This room is only open between the start and end of the scheduled call'
                : 'This call has not been scheduled';

            return res.status(403).json({ success: false, message, data: {} });
        }

        const channel = `call-${call._id}`;
        const seconds = tokenSeconds(call);
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_PRIMARY_CERTIFICATE,
            channel,
            UID[role],
            RtcRole.PUBLISHER,
            seconds,
            seconds
        );

        return res.json({
            success: true,
            message: 'Call token issued successfully',
            data: { appId: AGORA_APP_ID, channel, token, uid: UID[role], expiresAt: call.endAt, call: serializeCall(call, role) },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to join the call', data: {} });
    }
}

module.exports = {
    requestCall,
    scheduleCall,
    cancelCall,
    getCalls,
    getCallToken,
    buildSchedule,
    canJoin,
    tokenSeconds,
};
