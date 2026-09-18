const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { buildTerms, isValidPaymentSignature } = require('./controllers/rental.controller');

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('terms charge one month of rent plus deposit and brokerage', () => {
    const terms = buildTerms({
        rent: { coldRent: 12000, utilities: 2000, otherMonthlyCharges: 500 },
        securityDeposit: 30000,
        brokerageFee: 7000,
    });

    assert.deepStrictEqual(terms, {
        monthlyRent: 14500,
        securityDeposit: 30000,
        brokerageFee: 7000,
        totalDue: 51500,
    });
});

test('terms treat missing optional charges as zero', () => {
    const terms = buildTerms({ rent: { coldRent: 9000 } });

    assert.strictEqual(terms.monthlyRent, 9000);
    assert.strictEqual(terms.totalDue, 9000);
});

test('payment signature is accepted only when it matches the secret', () => {
    const secret = 'test_secret';
    const orderId = 'order_ABC123';
    const paymentId = 'pay_XYZ789';
    const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    assert.strictEqual(isValidPaymentSignature({ orderId, paymentId, signature, secret }), true);
    assert.strictEqual(isValidPaymentSignature({ orderId, paymentId, signature, secret: 'other_secret' }), false);
    assert.strictEqual(isValidPaymentSignature({ orderId, paymentId: 'pay_TAMPERED', signature, secret }), false);
    assert.strictEqual(isValidPaymentSignature({ orderId, paymentId, signature: 'short', secret }), false);
    assert.strictEqual(isValidPaymentSignature({ orderId, paymentId, signature: undefined, secret }), false);
});

const { drawAgreement, drawReceipt } = require('./controllers/rental.controller');

const paidRental = {
    message: 'I am relocating for work and would like this flat for a year.',
    status: 'paid',
    preferences: { moveInDate: new Date('2026-10-01'), durationMonths: 11, occupants: 2, note: 'Non-smoker' },
    terms: { monthlyRent: 14500, securityDeposit: 30000, brokerageFee: 7000, totalDue: 51500 },
    payment: { mode: 'online', amount: 51500, orderId: 'order_ABC123', paymentId: 'pay_XYZ789', receiptNo: 'LS-R-2026-ABC123', paidAt: new Date('2026-09-18') },
    agreement: { number: 'LS-A-2026-ABC123', signedAt: new Date('2026-09-18') },
    user: { name: 'Asha Rao', email: 'asha@example.com', phone: '+919812345678' },
    landlord: { name: 'Vikram Shah', companyName: '', email: 'vikram@example.com', phone: '+919876543210', address: '12 Hill Road', city: 'Pune' },
    listing: {
        title: 'Sunlit 2BHK near the metro',
        location: { address: '4 Park Lane', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
        propertyType: 'apartment',
        roomType: 'entire-place',
        areaSqFt: 850,
    },
};

async function render(draw) {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    draw(doc);
    doc.end();
    await new Promise((resolve) => doc.on('end', resolve));

    return Buffer.concat(chunks);
}

test('the agreement renders with the landlord signature stamped on it', async () => {
    const pdf = await render((doc) => drawAgreement(doc, paidRental, PNG_1PX));

    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(pdf.length > 1000);
});

test('the agreement still renders for a landlord whose signature is missing', async () => {
    const pdf = await render((doc) => drawAgreement(doc, paidRental, undefined));

    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
});

test('the receipt renders for an online payment', async () => {
    const pdf = await render((doc) => drawReceipt(doc, paidRental));

    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
});
