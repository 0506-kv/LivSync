const Buddy = require('../models/buddy.model');
const User = require('../models/user.model');
const Message = require('../models/message.model');

const DECK_LIMIT = 20;
const CANDIDATE_LIMIT = 200;
const DEFAULT_MESSAGE_LIMIT = 50;
const PROFILE_FIELDS = 'name gender dob preferences emailVerified';

// Weights add up to 100, so the score is already a percentage.
const WEIGHTS = {
    budget: 20,
    city: 15,
    cleanliness: 15,
    noiseTolerance: 10,
    sleepSchedule: 10,
    smoking: 8,
    foodHabits: 7,
    workSchedule: 5,
    pets: 5,
    guests: 5,
};

const GUEST_ORDER = ['rarely', 'sometimes', 'often'];

function clamp(value) {
    return Math.min(1, Math.max(0, value));
}

// Two 1-to-5 sliders: identical is a full point, opposite ends score nothing.
function sliderScore(a, b) {
    return clamp(1 - Math.abs((a ?? 3) - (b ?? 3)) / 4);
}

// An exact match is ideal, a declared "either way" answer is workable, a clash is not.
function choiceScore(a, b, flexible) {
    if (a === b) return 1;
    if (a === flexible || b === flexible) return 0.6;

    return 0;
}

function budgetScore(a = {}, b = {}) {
    const midA = ((a.min || 0) + (a.max || 0)) / 2;
    const midB = ((b.min || 0) + (b.max || 0)) / 2;

    if (!midA || !midB) return 0.5;

    return clamp(1 - Math.abs(midA - midB) / Math.max(midA, midB));
}

function petScore(a, b) {
    if (a === 'fine-with-pets' || b === 'fine-with-pets' || a === b) return 1;

    // One keeps pets and the other does not want any.
    return 0;
}

function smokingScore(a, b) {
    if (a === b) return 1;
    if (a === 'occasional' || b === 'occasional') return 0.6;

    return 0;
}

function guestScore(a, b) {
    return clamp(1 - Math.abs(GUEST_ORDER.indexOf(a) - GUEST_ORDER.indexOf(b)) / 2);
}

// A stated roommate gender is a filter, not a preference to trade off against the rest.
function genderAccepted(preference, gender) {
    return !preference || preference === 'any' || preference === gender;
}

// Pure and symmetric: compatibilityScore(a, b) === compatibilityScore(b, a).
function compatibilityScore(a, b) {
    const left = a.preferences || {};
    const right = b.preferences || {};

    if (!genderAccepted(left.roommateGender, b.gender) || !genderAccepted(right.roommateGender, a.gender)) {
        return 0;
    }

    const parts = {
        budget: budgetScore(left.budget, right.budget),
        city: left.city && right.city ? Number(left.city.trim().toLowerCase() === right.city.trim().toLowerCase()) : 0.5,
        cleanliness: sliderScore(left.cleanliness, right.cleanliness),
        noiseTolerance: sliderScore(left.noiseTolerance, right.noiseTolerance),
        sleepSchedule: choiceScore(left.sleepSchedule, right.sleepSchedule, 'flexible'),
        smoking: smokingScore(left.smoking, right.smoking),
        foodHabits: choiceScore(left.foodHabits, right.foodHabits, 'no-preference'),
        workSchedule: choiceScore(left.workSchedule, right.workSchedule, 'flexible'),
        pets: petScore(left.pets, right.pets),
        guests: guestScore(left.guests, right.guests),
    };

    const total = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + parts[key] * weight, 0);

    return Math.round(total);
}

function ageOf(dob) {
    if (!dob) return null;

    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function serializeProfile(user) {
    return {
        id: user._id,
        name: user.name,
        gender: user.gender,
        emailVerified: user.emailVerified,
        age: ageOf(user.dob),
        preferences: user.preferences,
    };
}

// users[0] holds the "user" slot. The pair may or may not be populated, so read the id either way.
function slotOf(buddy, userId) {
    return String(buddy.users[0]?._id || buddy.users[0]) === String(userId) ? 'user' : 'buddy';
}

function otherSlot(slot) {
    return slot === 'user' ? 'buddy' : 'user';
}

function serializeBuddy(buddy, userId) {
    const slot = slotOf(buddy, userId);
    const peer = buddy.users[slot === 'user' ? 1 : 0];

    return {
        id: buddy._id,
        peer: peer?.name ? serializeProfile(peer) : { id: peer },
        matchedAt: buddy.matchedAt,
        lastMessage: buddy.lastMessage?.sentAt ? buddy.lastMessage : null,
        unreadCount: buddy.unread?.[slot] || 0,
        updatedAt: buddy.updatedAt,
    };
}

function serializeMessage(message, slot) {
    return {
        id: message._id,
        text: message.text,
        senderRole: message.senderRole,
        mine: message.senderRole === slot,
        createdAt: message.createdAt,
    };
}

async function findMatch(buddyId, userId) {
    return Buddy.findOne({ _id: buddyId, users: userId, status: 'matched' }).populate('users', PROFILE_FIELDS);
}

// The deck: everyone who opted in, minus the people this user has already ruled on.
async function getDeck(req, res) {
    try {
        const me = await User.findById(req.participant.id).select(PROFILE_FIELDS);

        if (!me?.preferences?.lookingForBuddy) {
            return res.status(409).json({
                success: false,
                message: 'Turn on BuddyUp in your preferences to see matches',
                data: {},
            });
        }

        // ponytail: loads this user's pairs and filters in memory; move to an aggregation if
        // anyone ever swipes through thousands of people.
        const pairs = await Buddy.find({ users: me._id }).select('users likedBy passedBy');
        const decided = new Set(
            pairs
                .filter((pair) => [...pair.likedBy, ...pair.passedBy].some((id) => String(id) === String(me._id)))
                .map((pair) => String(pair.users.find((id) => String(id) !== String(me._id))))
        );

        const candidates = await User.find({
            _id: { $ne: me._id, $nin: [...decided] },
            role: 'tenant',
            'preferences.lookingForBuddy': true,
        })
            .select(PROFILE_FIELDS)
            .limit(CANDIDATE_LIMIT);

        const deck = candidates
            .map((candidate) => ({ ...serializeProfile(candidate), score: compatibilityScore(me, candidate) }))
            .filter((candidate) => candidate.score > 0)
            .sort((first, second) => second.score - first.score)
            .slice(0, DECK_LIMIT);

        return res.json({
            success: true,
            message: 'Deck retrieved successfully',
            data: { deck },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to load your buddy deck',
            data: {},
        });
    }
}

// A swipe either way lands in the one document for the pair, so the second swipe sees the first.
async function swipe(req, res) {
    try {
        const { userId, direction } = req.body;

        if (String(userId) === String(req.participant.id)) {
            return res.status(422).json({
                success: false,
                message: 'You cannot swipe on yourself',
                data: {},
            });
        }

        const peer = await User.findOne({ _id: userId, role: 'tenant', 'preferences.lookingForBuddy': true }).select('_id');

        if (!peer) {
            return res.status(404).json({
                success: false,
                message: 'This user is not looking for a buddy',
                data: {},
            });
        }

        const users = Buddy.pairOf(req.participant.id, userId);
        const buddy = await Buddy.findOneAndUpdate(
            { users },
            {
                $setOnInsert: { users },
                $addToSet: { [direction === 'like' ? 'likedBy' : 'passedBy']: req.participant.id },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const isMatched = buddy.likedBy.length === 2 && !buddy.passedBy.length;
        const status = buddy.passedBy.length ? 'passed' : (isMatched ? 'matched' : 'pending');

        if (status !== buddy.status) {
            buddy.status = status;
            if (isMatched) buddy.matchedAt = new Date();
            await buddy.save();
        }

        await buddy.populate('users', PROFILE_FIELDS);

        return res.json({
            success: true,
            message: isMatched ? 'It is a match' : 'Swipe recorded',
            data: { matched: isMatched, buddy: isMatched ? serializeBuddy(buddy, req.participant.id) : null },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to record your swipe',
            data: {},
        });
    }
}

async function getBuddies(req, res) {
    try {
        const buddies = await Buddy.find({ users: req.participant.id, status: 'matched' })
            .populate('users', PROFILE_FIELDS)
            .sort({ updatedAt: -1 });

        return res.json({
            success: true,
            message: 'Buddies retrieved successfully',
            data: { buddies: buddies.map((buddy) => serializeBuddy(buddy, req.participant.id)) },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to load your buddies',
            data: {},
        });
    }
}

async function getBuddyMessages(req, res) {
    try {
        const { after, limit = DEFAULT_MESSAGE_LIMIT } = req.query;
        const buddy = await findMatch(req.params.buddyId, req.participant.id);

        if (!buddy) {
            return res.status(404).json({
                success: false,
                message: 'Buddy not found or access denied',
                data: {},
            });
        }

        const slot = slotOf(buddy, req.participant.id);
        const messages = after
            ? await Message.find({ conversation: buddy._id, _id: { $gt: after } }).sort({ _id: 1 }).limit(limit)
            : (await Message.find({ conversation: buddy._id }).sort({ _id: -1 }).limit(limit)).reverse();

        if (buddy.unread[slot] > 0) {
            buddy.unread[slot] = 0;
            await Buddy.updateOne({ _id: buddy._id }, { $set: { [`unread.${slot}`]: 0 } }, { timestamps: false });
        }

        return res.json({
            success: true,
            message: 'Messages retrieved successfully',
            data: {
                buddy: serializeBuddy(buddy, req.participant.id),
                messages: messages.map((message) => serializeMessage(message, slot)),
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

async function sendBuddyMessage(req, res) {
    try {
        const buddy = await findMatch(req.params.buddyId, req.participant.id);

        if (!buddy) {
            return res.status(404).json({
                success: false,
                message: 'Buddy not found or access denied',
                data: {},
            });
        }

        const slot = slotOf(buddy, req.participant.id);
        const message = await Message.create({ conversation: buddy._id, senderRole: slot, text: req.body.text });

        await Buddy.updateOne(
            { _id: buddy._id },
            {
                $set: { lastMessage: { text: message.text, senderSlot: slot, sentAt: message.createdAt } },
                $inc: { [`unread.${otherSlot(slot)}`]: 1 },
            }
        );

        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: serializeMessage(message, slot) },
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
    getDeck,
    swipe,
    getBuddies,
    getBuddyMessages,
    sendBuddyMessage,
    compatibilityScore,
};
