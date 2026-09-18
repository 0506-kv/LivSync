const test = require('node:test');
const assert = require('node:assert');
const { compatibilityScore } = require('./controllers/buddy.controller');

function tenant(gender, preferences) {
    return {
        gender,
        preferences: {
            budget: { min: 10000, max: 20000 },
            city: 'Pune',
            sleepSchedule: 'early-bird',
            workSchedule: 'day-shift',
            cleanliness: 4,
            noiseTolerance: 2,
            foodHabits: 'vegetarian',
            smoking: 'non-smoker',
            pets: 'no-pets',
            guests: 'rarely',
            roommateGender: 'any',
            ...preferences,
        },
    };
}

test('two identical profiles are a perfect match', () => {
    assert.strictEqual(compatibilityScore(tenant('female'), tenant('male')), 100);
});

test('opposites score low but not zero', () => {
    const score = compatibilityScore(
        tenant('female'),
        tenant('male', {
            budget: { min: 60000, max: 80000 },
            city: 'Delhi',
            sleepSchedule: 'night-owl',
            workSchedule: 'night-shift',
            cleanliness: 1,
            noiseTolerance: 5,
            foodHabits: 'non-vegetarian',
            smoking: 'smoker',
            pets: 'has-pets',
            guests: 'often',
        })
    );

    assert.ok(score > 0 && score < 25, `expected a low score, got ${score}`);
});

test('the score does not depend on which side is asking', () => {
    const a = tenant('female', { cleanliness: 5, city: 'Pune', guests: 'often' });
    const b = tenant('male', { cleanliness: 2, city: 'Mumbai', smoking: 'occasional' });

    assert.strictEqual(compatibilityScore(a, b), compatibilityScore(b, a));
});

test('a stated roommate gender rules the other person out entirely', () => {
    const wantsFemale = tenant('female', { roommateGender: 'female' });

    assert.strictEqual(compatibilityScore(wantsFemale, tenant('male')), 0);
    assert.strictEqual(compatibilityScore(wantsFemale, tenant('female')), 100);
});

test('flexible answers are worth more than a clash', () => {
    const owl = tenant('male', { sleepSchedule: 'night-owl' });

    assert.ok(compatibilityScore(tenant('female', { sleepSchedule: 'flexible' }), owl)
        > compatibilityScore(tenant('female', { sleepSchedule: 'early-bird' }), owl));
});

test('a missing preferences document never throws', () => {
    assert.strictEqual(typeof compatibilityScore({ gender: 'male' }, { gender: 'female' }), 'number');
});
