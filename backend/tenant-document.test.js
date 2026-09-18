const test = require('node:test');
const assert = require('node:assert');
const { missingDocumentsFor, hasCompleteDocuments } = require('./controllers/rental.controller');

const ASHA = '68c1a0000000000000000001';
const RAVI = '68c1a0000000000000000002';
const AADHAAR = '68c1a0000000000000000011';
const VISA = '68c1a0000000000000000012';

function rentalWithDocuments(submissions = []) {
    return {
        user: ASHA,
        buddy: RAVI,
        documentRequirements: [
            { requirementId: AADHAAR, name: 'Aadhaar card' },
            { requirementId: VISA, name: 'Visa' },
        ],
        documentSubmissions: submissions,
    };
}

test('each tenant must share every document requested by the landlord', () => {
    const rental = rentalWithDocuments([
        { tenant: ASHA, requirementId: AADHAAR, document: 'file-aadhaar' },
        { tenant: ASHA, requirementId: VISA, document: 'file-visa' },
        { tenant: RAVI, requirementId: AADHAAR, document: 'file-ravi-aadhaar' },
    ]);

    assert.deepStrictEqual(missingDocumentsFor(rental, ASHA), []);
    assert.deepStrictEqual(missingDocumentsFor(rental, RAVI).map((requirement) => requirement.name), ['Visa']);
    assert.strictEqual(hasCompleteDocuments(rental), false);
});

test('a complete application includes every requested document for every tenant', () => {
    const rental = rentalWithDocuments([
        { tenant: ASHA, requirementId: AADHAAR, document: 'file-aadhaar' },
        { tenant: ASHA, requirementId: VISA, document: 'file-visa' },
        { tenant: RAVI, requirementId: AADHAAR, document: 'file-ravi-aadhaar' },
        { tenant: RAVI, requirementId: VISA, document: 'file-ravi-visa' },
    ]);

    assert.strictEqual(hasCompleteDocuments(rental), true);
});
