const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/otp.model');
const User = require('../models/user.model');
const Landlord = require('../models/landlord.model');
const { sendOtpEmail } = require('../utils/mailer');

const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

const MODELS = { user: User, landlord: Landlord };

function newCode() {
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Seconds still to wait before another code may be sent; 0 once the cooldown has passed.
function resendWaitSeconds(sentAt, now = new Date()) {
    if (!sentAt) return 0;

    const elapsed = (now.getTime() - new Date(sentAt).getTime()) / 1000;

    return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

// Everything about a stored code that can be judged without hashing it.
function otpState(record, now = new Date()) {
    if (!record) return 'missing';
    if (new Date(record.expiresAt).getTime() <= now.getTime()) return 'expired';
    if (record.attempts >= MAX_ATTEMPTS) return 'locked';

    return 'ok';
}

// Replaces any live code, mails the new one, and reports the send so callers can surface failures.
async function issueOtp(account, ownerType) {
    const code = newCode();
    const now = new Date();

    await Otp.findOneAndUpdate(
        { owner: account._id, ownerType },
        {
            owner: account._id,
            ownerType,
            email: account.email,
            codeHash: await bcrypt.hash(code, 10),
            attempts: 0,
            sentAt: now,
            expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60000),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail(account.email, account.name, code, CODE_TTL_MINUTES);
}

// Registration should not fail because Gmail did; the account can always ask for another code.
function issueOtpQuietly(account, ownerType) {
    issueOtp(account, ownerType).catch((error) => {
        console.error(`Unable to email a verification code to ${account.email}:`, error.message);
    });
}

function ownerTypeOf(req) {
    return req.participant.role === 'landlord' ? 'landlord' : 'user';
}

async function sendVerificationCode(req, res) {
    try {
        const ownerType = ownerTypeOf(req);
        const account = await MODELS[ownerType].findById(req.participant.id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found', data: {} });
        }

        if (account.emailVerified) {
            return res.json({
                success: true,
                message: 'Your email is already verified',
                data: { email: account.email, emailVerified: true, retryAfter: 0 },
            });
        }

        const existing = await Otp.findOne({ owner: account._id, ownerType });
        const retryAfter = resendWaitSeconds(existing?.sentAt);

        if (retryAfter > 0) {
            return res.status(429).json({
                success: false,
                message: `Please wait ${retryAfter} seconds before asking for another code`,
                data: { email: account.email, emailVerified: false, retryAfter },
            });
        }

        await issueOtp(account, ownerType);

        return res.json({
            success: true,
            message: `Verification code sent to ${account.email}`,
            data: {
                email: account.email,
                emailVerified: false,
                retryAfter: RESEND_COOLDOWN_SECONDS,
                expiresInMinutes: CODE_TTL_MINUTES,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to send a verification code right now',
            data: {},
        });
    }
}

async function confirmVerificationCode(req, res) {
    try {
        const ownerType = ownerTypeOf(req);
        const account = await MODELS[ownerType].findById(req.participant.id);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found', data: {} });
        }

        if (account.emailVerified) {
            return res.json({
                success: true,
                message: 'Your email is already verified',
                data: { email: account.email, emailVerified: true },
            });
        }

        const record = await Otp.findOne({ owner: account._id, ownerType });
        const state = otpState(record);

        if (state !== 'ok') {
            const messages = {
                missing: 'Ask for a verification code first',
                expired: 'That code has expired. Ask for a new one',
                locked: 'Too many wrong attempts. Ask for a new code',
            };

            if (state !== 'missing') await Otp.deleteOne({ _id: record._id });

            return res.status(400).json({ success: false, message: messages[state], data: {} });
        }

        if (!(await record.compareCode(req.body.code))) {
            record.attempts += 1;
            await record.save();

            const left = MAX_ATTEMPTS - record.attempts;

            return res.status(400).json({
                success: false,
                message: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left` : 'Too many wrong attempts. Ask for a new code',
                data: { attemptsLeft: Math.max(0, left) },
            });
        }

        account.emailVerified = true;
        account.emailVerifiedAt = new Date();
        await account.save();
        await Otp.deleteOne({ _id: record._id });

        return res.json({
            success: true,
            message: 'Email verified successfully',
            data: { email: account.email, emailVerified: true, emailVerifiedAt: account.emailVerifiedAt },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to verify your email right now',
            data: {},
        });
    }
}

module.exports = {
    sendVerificationCode,
    confirmVerificationCode,
    issueOtp,
    issueOtpQuietly,
    resendWaitSeconds,
    otpState,
    newCode,
    CODE_TTL_MINUTES,
    RESEND_COOLDOWN_SECONDS,
    MAX_ATTEMPTS,
};
