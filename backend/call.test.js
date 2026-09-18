const test = require('node:test');
const assert = require('node:assert');
const { buildSchedule, canJoin, tokenSeconds } = require('./controllers/call.controller');

const NOW = new Date('2026-09-18T09:00:00.000Z');
const NINE_THIRTY = new Date('2026-09-18T09:30:00.000Z');

function scheduledCall(startAt, minutes = 30) {
    return { status: 'scheduled', startAt, endAt: new Date(startAt.getTime() + minutes * 60000) };
}

test('a scheduled call runs from the chosen time for the chosen minutes', () => {
    const schedule = buildSchedule(NINE_THIRTY.toISOString(), 30, NOW);

    assert.deepStrictEqual(schedule, { startAt: NINE_THIRTY, endAt: new Date('2026-09-18T10:00:00.000Z') });
});

test('a call cannot run longer than half an hour', () => {
    assert.match(buildSchedule(NINE_THIRTY.toISOString(), 45, NOW).error, /30 minutes/);
    assert.match(buildSchedule(NINE_THIRTY.toISOString(), 0, NOW).error, /30 minutes/);
});

test('a call cannot be scheduled in the past', () => {
    assert.match(buildSchedule('2026-09-18T08:59:00.000Z', 30, NOW).error, /future/);
    assert.match(buildSchedule('not a date', 30, NOW).error, /future/);
});

test('the room opens at the start and shuts at the end', () => {
    const call = scheduledCall(NINE_THIRTY);

    assert.strictEqual(canJoin(call, new Date('2026-09-18T09:29:59.000Z')), false);
    assert.strictEqual(canJoin(call, new Date('2026-09-18T09:30:00.000Z')), true);
    assert.strictEqual(canJoin(call, new Date('2026-09-18T09:59:59.000Z')), true);
    assert.strictEqual(canJoin(call, new Date('2026-09-18T10:00:00.000Z')), false);
});

test('a call with no time yet, or a cancelled one, cannot be joined', () => {
    const inside = new Date('2026-09-18T09:35:00.000Z');

    assert.strictEqual(canJoin({ status: 'requested' }, inside), false);
    assert.strictEqual(canJoin({ ...scheduledCall(NINE_THIRTY), status: 'cancelled' }, inside), false);
});

test('the token expires with the call, never instantly', () => {
    const call = scheduledCall(NINE_THIRTY);

    assert.strictEqual(tokenSeconds(call, new Date('2026-09-18T09:30:00.000Z')), 1800);
    assert.strictEqual(tokenSeconds(call, new Date('2026-09-18T09:59:59.000Z')), 60);
});
