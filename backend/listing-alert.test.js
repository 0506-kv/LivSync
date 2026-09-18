const test = require('node:test');
const assert = require('node:assert');
const { listingMatchesAlert } = require('./controllers/listing-alert.controller');

const listing = {
    propertyType: 'apartment',
    roomType: 'entire-place',
    location: { city: 'Pune' },
    bedrooms: 2,
    furnished: true,
    availableFrom: new Date('2026-10-01'),
    rent: { coldRent: 18000 },
    landlord: { emailVerified: true },
};

test('a listing alert matches the same criteria used by listing search', () => {
    assert.strictEqual(listingMatchesAlert(listing, {
        city: 'pune',
        propertyType: 'apartment',
        roomType: 'entire-place',
        minRent: 15000,
        maxRent: 20000,
        minBedrooms: 2,
        furnished: true,
        availableFrom: new Date('2026-10-15'),
        verifiedLandlord: true,
    }), true);
});

test('a listing alert rejects a home outside its budget or availability', () => {
    assert.strictEqual(listingMatchesAlert(listing, { maxRent: 17000 }), false);
    assert.strictEqual(listingMatchesAlert(listing, { availableFrom: new Date('2026-09-20') }), false);
});
