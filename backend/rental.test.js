const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { buildTerms, buildPayments, isValidPaymentSignature, drawAgreement, drawReceipt } = require('./controllers/rental.controller');

const PNG_1PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const ASHA = '68c1a0000000000000000001';
const RAVI = '68c1a0000000000000000002';

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

test('a solo request is payable in one share', () => {
    const payments = buildPayments({ user: ASHA, terms: { totalDue: 51500 } });

    assert.deepStrictEqual(payments, [{ payer: ASHA, share: 100, amount: 51500 }]);
});

test('a buddy request splits the total in the agreed ratio', () => {
    const payments = buildPayments({ user: ASHA, buddy: RAVI, split: { mode: 'percent', value: 60 }, terms: { totalDue: 51500 } });

    assert.deepStrictEqual(payments, [
        { payer: ASHA, share: 60, amount: 30900 },
        { payer: RAVI, share: 40, amount: 20600 },
    ]);
});

test('a share named in rupees leaves the rest of the total to the buddy', () => {
    const payments = buildPayments({ user: ASHA, buddy: RAVI, split: { mode: 'amount', value: 20000 }, terms: { totalDue: 51500 } });

    assert.deepStrictEqual(payments, [
        { payer: ASHA, share: 39, amount: 20000 },
        { payer: RAVI, share: 61, amount: 31500 },
    ]);
});

test('a named amount is clamped so both tenants still owe something', () => {
    const tooMuch = buildPayments({ user: ASHA, buddy: RAVI, split: { mode: 'amount', value: 90000 }, terms: { totalDue: 51500 } });
    const nothing = buildPayments({ user: ASHA, buddy: RAVI, split: { mode: 'amount', value: 0 }, terms: { totalDue: 51500 } });

    assert.deepStrictEqual([tooMuch[0].amount, tooMuch[1].amount], [51499, 1]);
    assert.deepStrictEqual([nothing[0].amount, nothing[1].amount], [1, 51499]);
});

test('an uneven split still adds back up to the exact total', () => {
    const splits = [
        [{ mode: 'percent', value: 50 }, 51501],
        [{ mode: 'percent', value: 60 }, 10001],
        [{ mode: 'percent', value: 70 }, 33333],
        [{ mode: 'percent', value: 35 }, 999],
        [{ mode: 'amount', value: 12345 }, 51500],
        [{ mode: 'amount', value: 1 }, 3],
    ];

    for (const [split, total] of splits) {
        const payments = buildPayments({ user: ASHA, buddy: RAVI, split, terms: { totalDue: total } });

        assert.strictEqual(payments[0].amount + payments[1].amount, total);
        assert.strictEqual(payments[0].share + payments[1].share, 100);
        assert.ok(payments.every((payment) => payment.amount > 0));
    }
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

const soloRental = {
    message: 'I am relocating for work and would like this flat for a year.',
    status: 'paid',
    preferences: { moveInDate: new Date('2026-10-01'), durationMonths: 11, occupants: 2, note: 'Non-smoker' },
    terms: { monthlyRent: 14500, securityDeposit: 30000, brokerageFee: 7000, totalDue: 51500 },
    payments: [{ payer: ASHA, share: 100, amount: 51500, mode: 'online', orderId: 'order_ABC123', paymentId: 'pay_XYZ789', receiptNo: 'LS-R-2026-ABC123-1', paidAt: new Date('2026-09-18') }],
    agreement: { number: 'LS-A-2026-ABC123', signedAt: new Date('2026-09-18') },
    user: { _id: ASHA, name: 'Asha Rao', email: 'asha@example.com', phone: '+919812345678' },
    landlord: { name: 'Vikram Shah', companyName: '', email: 'vikram@example.com', phone: '+919876543210', address: '12 Hill Road', city: 'Pune' },
    listing: {
        title: 'Sunlit 2BHK near the metro',
        location: { address: '4 Park Lane', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
        propertyType: 'apartment',
        roomType: 'entire-place',
        areaSqFt: 850,
    },
};

const buddyRental = {
    ...soloRental,
    split: { mode: 'percent', value: 60 },
    buddy: { _id: RAVI, name: 'Ravi Menon', email: 'ravi@example.com', phone: '+919811111111' },
    payments: [
        { payer: ASHA, share: 60, amount: 30900, mode: 'online', paymentId: 'pay_1', receiptNo: 'LS-R-2026-ABC123-1', paidAt: new Date('2026-09-18') },
        { payer: RAVI, share: 40, amount: 20600, mode: 'online', paymentId: 'pay_2', receiptNo: 'LS-R-2026-ABC123-2', paidAt: new Date('2026-09-19') },
    ],
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
    const pdf = await render((doc) => drawAgreement(doc, soloRental, PNG_1PX));

    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.ok(pdf.length > 1000);
});

test('the agreement still renders for a landlord whose signature is missing', async () => {
    const pdf = await render((doc) => drawAgreement(doc, soloRental, undefined));

    assert.strictEqual(pdf.subarray(0, 5).toString(), '%PDF-');
});

test('a buddy agreement renders jointly and as a single tenant copy', async () => {
    const joint = await render((doc) => drawAgreement(doc, buddyRental, PNG_1PX));
    const individual = await render((doc) => drawAgreement(doc, buddyRental, PNG_1PX, RAVI));

    assert.strictEqual(joint.subarray(0, 5).toString(), '%PDF-');
    assert.strictEqual(individual.subarray(0, 5).toString(), '%PDF-');
    // The tenant copy carries one tenant block, so it is the shorter document.
    assert.ok(individual.length < joint.length);
});

test('the receipt renders for an online payment and for a buddy share', async () => {
    const solo = await render((doc) => drawReceipt(doc, soloRental, soloRental.payments[0]));
    const share = await render((doc) => drawReceipt(doc, buddyRental, buddyRental.payments[1]));

    assert.strictEqual(solo.subarray(0, 5).toString(), '%PDF-');
    assert.strictEqual(share.subarray(0, 5).toString(), '%PDF-');
});
