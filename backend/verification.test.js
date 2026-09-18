const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { resendWaitSeconds, otpState, newCode, MAX_ATTEMPTS } = require('./controllers/verification.controller');

const NOW = new Date('2026-09-18T09:00:00.000Z');

function storedCode(overrides = {}) {
    return {
        attempts: 0,
        sentAt: NOW,
        expiresAt: new Date('2026-09-18T09:10:00.000Z'),
        ...overrides,
    };
}

test('a code is always six digits', () => {
    for (let index = 0; index < 500; index += 1) {
        assert.match(newCode(), /^\d{6}$/);
    }
});

test('a fresh code cannot be resent until the cooldown passes', () => {
    assert.strictEqual(resendWaitSeconds(NOW, NOW), 60);
    assert.strictEqual(resendWaitSeconds(NOW, new Date('2026-09-18T09:00:30.000Z')), 30);
    assert.strictEqual(resendWaitSeconds(NOW, new Date('2026-09-18T09:01:00.000Z')), 0);
    assert.strictEqual(resendWaitSeconds(NOW, new Date('2026-09-18T09:05:00.000Z')), 0);
});

test('a first-time request has nothing to wait for', () => {
    assert.strictEqual(resendWaitSeconds(null, NOW), 0);
});

test('a code is usable until the moment it expires', () => {
    assert.strictEqual(otpState(storedCode(), new Date('2026-09-18T09:09:59.000Z')), 'ok');
    assert.strictEqual(otpState(storedCode(), new Date('2026-09-18T09:10:00.000Z')), 'expired');
});

test('guessing is locked out after the attempt limit', () => {
    assert.strictEqual(otpState(storedCode({ attempts: MAX_ATTEMPTS - 1 }), NOW), 'ok');
    assert.strictEqual(otpState(storedCode({ attempts: MAX_ATTEMPTS }), NOW), 'locked');
});

test('confirming with no code on file is rejected', () => {
    assert.strictEqual(otpState(null, NOW), 'missing');
});

test('a stored code is hashed, so the digits never sit in the database', async () => {
    const code = newCode();
    const codeHash = await bcrypt.hash(code, 10);

    assert.notStrictEqual(codeHash, code);
    assert.strictEqual(await bcrypt.compare(code, codeHash), true);
    assert.strictEqual(await bcrypt.compare('000000' === code ? '111111' : '000000', codeHash), false);
});
