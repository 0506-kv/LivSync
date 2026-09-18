const crypto = require('crypto');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const Rental = require('../models/rental.model');
const Listing = require('../models/listing.model');
const Landlord = require('../models/landlord.model');

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';
const POPULATE = [
    { path: 'user', select: 'name email phone dob gender' },
    { path: 'landlord', select: 'name companyName businessType email phone address city verificationStatus' },
    { path: 'listing', select: 'title location rent securityDeposit brokerageFee photos propertyType roomType areaSqFt bedrooms bathrooms furnished' },
];

function formatMoney(value) {
    return `INR ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
}

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

// The deal the landlord is agreeing to: one month up front, plus deposit and brokerage.
function buildTerms(listing) {
    const monthlyRent = (listing.rent.coldRent || 0) + (listing.rent.utilities || 0) + (listing.rent.otherMonthlyCharges || 0);
    const securityDeposit = listing.securityDeposit || 0;
    const brokerageFee = listing.brokerageFee || 0;

    return {
        monthlyRent,
        securityDeposit,
        brokerageFee,
        totalDue: monthlyRent + securityDeposit + brokerageFee,
    };
}

function timingSafeEqual(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));

    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isValidPaymentSignature({ orderId, paymentId, signature, secret }) {
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

    return timingSafeEqual(expected, signature);
}

function serializeRental(rental, role) {
    const isPaid = rental.status === 'paid';

    return {
        id: rental._id,
        status: rental.status,
        message: rental.message,
        preferences: rental.preferences,
        terms: rental.terms?.totalDue === undefined ? null : rental.terms,
        payment: {
            mode: rental.payment?.mode || null,
            amount: rental.payment?.amount ?? null,
            receiptNo: rental.payment?.receiptNo || null,
            paidAt: rental.payment?.paidAt || null,
        },
        agreement: rental.agreement?.number ? rental.agreement : null,
        documents: {
            // The receipt only exists for money that actually moved through LivSync.
            agreement: isPaid,
            receipt: isPaid && rental.payment?.mode === 'online',
        },
        listing: rental.listing && {
            id: rental.listing._id,
            title: rental.listing.title,
            city: rental.listing.location?.city,
            photo: rental.listing.photos?.[0] || '',
        },
        tenant: role === 'landlord' && rental.user ? {
            id: rental.user._id,
            name: rental.user.name,
            email: rental.user.email,
            phone: rental.user.phone,
            dob: rental.user.dob,
            gender: rental.user.gender,
        } : undefined,
        landlord: role === 'user' && rental.landlord ? {
            id: rental.landlord._id,
            name: rental.landlord.companyName || rental.landlord.name,
            verificationStatus: rental.landlord.verificationStatus,
        } : undefined,
        createdAt: rental.createdAt,
        decidedAt: rental.decidedAt,
    };
}

async function findRentalFor(rentalId, participant) {
    return Rental.findOne({ _id: rentalId, [participant.role]: participant.id }).populate(POPULATE);
}

// Claims the rental atomically so the checkout callback and the webhook cannot both issue documents.
async function markPaid(filter, paymentFields) {
    const claimed = await Rental.findOneAndUpdate(
        { ...filter, status: 'accepted' },
        { $set: { status: 'paid', 'payment.paidAt': new Date(), ...paymentFields } },
        { new: true }
    );

    if (!claimed) return null;

    const suffix = claimed.id.slice(-6).toUpperCase();
    const year = new Date().getFullYear();

    claimed.agreement = { number: `LS-A-${year}-${suffix}`, signedAt: new Date() };
    if (claimed.payment.mode === 'online') claimed.payment.receiptNo = `LS-R-${year}-${suffix}`;
    await claimed.save();

    return claimed.populate(POPULATE);
}

async function createRental(req, res) {
    try {
        const { listingId, message, preferences } = req.body;
        const listing = await Listing.findOne({ _id: listingId, status: 'published' }).select('landlord');

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found',
                data: {},
            });
        }

        const existing = await Rental.findOne({ user: req.participant.id, listing: listing._id });

        if (existing && existing.status !== 'rejected') {
            return res.status(409).json({
                success: false,
                message: 'You already have a request on this listing',
                data: {},
            });
        }

        // A rejected request is reopened in place, which keeps the one-request-per-listing rule intact.
        const rental = existing || new Rental({ user: req.participant.id, landlord: listing.landlord, listing: listing._id });

        rental.set({ message, preferences, status: 'pending', decidedAt: undefined });
        await rental.save();
        await rental.populate(POPULATE);

        return res.status(201).json({
            success: true,
            message: 'Rental request sent successfully',
            data: { rental: serializeRental(rental, 'user') },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to send rental request',
            data: {},
        });
    }
}

async function getRentals(req, res) {
    try {
        const { id, role } = req.participant;
        const rentals = await Rental.find({ [role]: id }).populate(POPULATE).sort({ createdAt: -1 });

        return res.json({
            success: true,
            message: 'Rental requests retrieved successfully',
            data: { rentals: rentals.map((rental) => serializeRental(rental, role)) },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve rental requests',
            data: {},
        });
    }
}

async function decideRental(req, res) {
    try {
        const rental = await findRentalFor(req.params.rentalId, req.participant);

        if (!rental) {
            return res.status(404).json({
                success: false,
                message: 'Rental request not found or access denied',
                data: {},
            });
        }

        if (rental.status !== 'pending') {
            return res.status(409).json({
                success: false,
                message: 'This request has already been decided',
                data: {},
            });
        }

        if (req.body.decision === 'accept') {
            const landlord = await Landlord.findById(req.participant.id).select('signature.signedAt');

            // No signature, no agreement to hand over once the tenant pays.
            if (!landlord?.signature?.signedAt) {
                return res.status(409).json({
                    success: false,
                    message: 'Add your e-signature before accepting a request',
                    data: {},
                });
            }

            rental.terms = buildTerms(rental.listing);
        }

        rental.status = req.body.decision === 'accept' ? 'accepted' : 'rejected';
        rental.decidedAt = new Date();
        await rental.save();

        return res.json({
            success: true,
            message: `Rental request ${rental.status}`,
            data: { rental: serializeRental(rental, 'landlord') },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to update rental request',
            data: {},
        });
    }
}

async function createPaymentOrder(req, res) {
    try {
        const rental = await findRentalFor(req.params.rentalId, req.participant);

        if (!rental) {
            return res.status(404).json({
                success: false,
                message: 'Rental request not found or access denied',
                data: {},
            });
        }

        if (rental.status !== 'accepted') {
            return res.status(409).json({
                success: false,
                message: 'Payment opens once the landlord accepts your request',
                data: {},
            });
        }

        // Amount always comes from the accepted terms, never from the client.
        const response = await axios.post(
            RAZORPAY_ORDERS_URL,
            {
                amount: Math.round(rental.terms.totalDue * 100),
                currency: 'INR',
                receipt: rental.id,
                notes: { rentalId: rental.id, listing: rental.listing.title },
            },
            { auth: { username: process.env.RAZORPAY_KEY_ID, password: process.env.RAZORPAY_KEY_SECRET } }
        );

        rental.payment.mode = 'online';
        rental.payment.amount = rental.terms.totalDue;
        rental.payment.orderId = response.data.id;
        await rental.save();

        return res.json({
            success: true,
            message: 'Payment order created successfully',
            data: {
                order: { id: response.data.id, amount: response.data.amount, currency: response.data.currency },
                keyId: process.env.RAZORPAY_KEY_ID,
                prefill: { name: rental.user.name, email: rental.user.email, contact: rental.user.phone },
            },
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            message: 'Unable to start the payment',
            data: {},
        });
    }
}

async function verifyPayment(req, res) {
    try {
        const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
        const isValid = isValidPaymentSignature({
            orderId,
            paymentId,
            signature,
            secret: process.env.RAZORPAY_KEY_SECRET,
        });

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Payment could not be verified',
                data: {},
            });
        }

        const rental = await markPaid(
            { _id: req.params.rentalId, user: req.participant.id, 'payment.orderId': orderId },
            { 'payment.paymentId': paymentId }
        );

        if (!rental) {
            // Already settled by the webhook, or never in a payable state.
            const settled = await findRentalFor(req.params.rentalId, req.participant);

            if (settled?.status === 'paid') {
                return res.json({
                    success: true,
                    message: 'Payment already recorded',
                    data: { rental: serializeRental(settled, 'user') },
                });
            }

            return res.status(409).json({
                success: false,
                message: 'This request is not awaiting payment',
                data: {},
            });
        }

        return res.json({
            success: true,
            message: 'Payment successful',
            data: { rental: serializeRental(rental, 'user') },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to confirm the payment',
            data: {},
        });
    }
}

async function chooseOfflinePayment(req, res) {
    try {
        const rental = await findRentalFor(req.params.rentalId, req.participant);

        if (!rental) {
            return res.status(404).json({
                success: false,
                message: 'Rental request not found or access denied',
                data: {},
            });
        }

        if (rental.status !== 'accepted') {
            return res.status(409).json({
                success: false,
                message: 'Payment opens once the landlord accepts your request',
                data: {},
            });
        }

        rental.payment.mode = 'in-person';
        rental.payment.amount = rental.terms.totalDue;
        rental.payment.orderId = undefined;
        await rental.save();

        return res.json({
            success: true,
            message: 'The landlord will confirm your in-person payment',
            data: { rental: serializeRental(rental, 'user') },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to select in-person payment',
            data: {},
        });
    }
}

// Money paid in person never reaches LivSync, so only the landlord can attest that it arrived.
async function confirmOfflinePayment(req, res) {
    try {
        const rental = await Rental.findOne({
            _id: req.params.rentalId,
            landlord: req.participant.id,
            'payment.mode': 'in-person',
        });

        if (!rental) {
            return res.status(404).json({
                success: false,
                message: 'No in-person payment is awaiting your confirmation',
                data: {},
            });
        }

        const paid = await markPaid({ _id: rental._id, landlord: req.participant.id }, {});

        if (!paid) {
            return res.status(409).json({
                success: false,
                message: 'This request is not awaiting payment',
                data: {},
            });
        }

        return res.json({
            success: true,
            message: 'Payment confirmed',
            data: { rental: serializeRental(paid, 'landlord') },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to confirm the payment',
            data: {},
        });
    }
}

// Razorpay retries this if the tenant closes the tab before the checkout callback lands.
async function handleWebhook(req, res) {
    try {
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(req.rawBody || Buffer.alloc(0))
            .digest('hex');

        if (!timingSafeEqual(expected, req.headers['x-razorpay-signature'])) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature', data: {} });
        }

        const entity = req.body?.payload?.payment?.entity;

        if (req.body?.event === 'payment.captured' && entity?.order_id) {
            await markPaid({ 'payment.orderId': entity.order_id }, { 'payment.paymentId': entity.id });
        }

        return res.json({ success: true, message: 'Webhook processed', data: {} });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to process webhook', data: {} });
    }
}

function streamPdf(res, filename, draw) {
    const doc = new PDFDocument({ size: 'A4', margin: 56 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    doc.pipe(res);
    draw(doc);
    doc.end();
}

function heading(doc, title, subtitle) {
    doc.font('Helvetica-Bold').fontSize(18).text('LivSync');
    doc.font('Helvetica').fontSize(9).fillColor('#666').text(subtitle);
    doc.moveDown(1.2);
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(14).text(title);
    doc.moveDown(0.8);
}

function row(doc, label, value) {
    doc.font('Helvetica').fontSize(10).fillColor('#666').text(label, { continued: true });
    doc.font('Helvetica-Bold').fillColor('#000').text(`  ${value}`);
    doc.moveDown(0.3);
}

function drawAgreement(doc, rental, signatureDataUrl) {
    const { listing, user, landlord, terms, preferences, agreement } = rental;
    const endDate = new Date(preferences.moveInDate);

    endDate.setMonth(endDate.getMonth() + preferences.durationMonths);

    heading(doc, 'Rental Agreement', `Agreement ${agreement.number} · generated ${formatDate(agreement.signedAt)}`);

    doc.font('Helvetica-Bold').fontSize(11).text('Landlord');
    row(doc, 'Name', landlord.companyName || landlord.name);
    row(doc, 'Contact', `${landlord.email} · ${landlord.phone}`);
    row(doc, 'Address', `${landlord.address}, ${landlord.city}`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).text('Tenant');
    row(doc, 'Name', user.name);
    row(doc, 'Contact', `${user.email} · ${user.phone}`);
    row(doc, 'Occupants', String(preferences.occupants));
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).text('Property');
    row(doc, 'Listing', listing.title);
    row(doc, 'Address', `${listing.location.address}, ${listing.location.city}, ${listing.location.state} ${listing.location.postalCode}`);
    row(doc, 'Type', `${listing.propertyType} · ${listing.roomType.replaceAll('-', ' ')} · ${listing.areaSqFt} sq ft`);
    doc.moveDown(0.6);

    doc.font('Helvetica-Bold').fontSize(11).text('Term and charges');
    row(doc, 'Start date', formatDate(preferences.moveInDate));
    row(doc, 'End date', `${formatDate(endDate)} (${preferences.durationMonths} months)`);
    row(doc, 'Monthly rent', formatMoney(terms.monthlyRent));
    row(doc, 'Security deposit', formatMoney(terms.securityDeposit));
    row(doc, 'Brokerage fee', formatMoney(terms.brokerageFee));
    row(doc, 'Amount settled', `${formatMoney(terms.totalDue)} (${rental.payment.mode === 'online' ? 'paid via LivSync' : 'paid in person'})`);
    doc.moveDown(0.8);

    doc.font('Helvetica').fontSize(9).fillColor('#444').text(
        'The landlord agrees to let the property described above to the tenant for the term stated, on the charges stated. '
        + 'The tenant accepted these terms electronically on LivSync by settling the amount due. '
        + 'This document is a simplified record of that agreement and does not replace statutory obligations of either party.',
        { align: 'justify' }
    );
    doc.moveDown(1.5);

    doc.fillColor('#000').font('Helvetica-Bold').fontSize(10).text('Signed by the landlord');
    if (signatureDataUrl) {
        doc.image(Buffer.from(signatureDataUrl.split(',')[1], 'base64'), doc.x, doc.y + 6, { fit: [170, 60] });
        doc.moveDown(4.5);
    }
    doc.font('Helvetica').fontSize(9).fillColor('#666').text(`${landlord.companyName || landlord.name} · e-signed on LivSync`);
    doc.text(`Tenant acceptance: ${user.name} · ${formatDate(rental.payment.paidAt)}`);
}

function drawReceipt(doc, rental) {
    const { user, listing, terms, payment } = rental;

    heading(doc, 'Payment Receipt', `Receipt ${payment.receiptNo} · ${formatDate(payment.paidAt)}`);

    row(doc, 'Received from', `${user.name} (${user.email})`);
    row(doc, 'Property', `${listing.title}, ${listing.location.city}`);
    row(doc, 'Payment id', payment.paymentId || '—');
    row(doc, 'Order id', payment.orderId || '—');
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(11).text('Breakdown');
    row(doc, 'First month rent', formatMoney(terms.monthlyRent));
    row(doc, 'Security deposit', formatMoney(terms.securityDeposit));
    row(doc, 'Brokerage fee', formatMoney(terms.brokerageFee));
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(12).text(`Total paid  ${formatMoney(payment.amount)}`);
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(9).fillColor('#666').text('Paid online through LivSync via Razorpay. This receipt is issued for payments processed on the platform.');
}

async function getAgreement(req, res) {
    try {
        const rental = await findRentalFor(req.params.rentalId, req.participant);

        if (!rental || rental.status !== 'paid') {
            return res.status(404).json({
                success: false,
                message: 'Agreement is available once the payment is settled',
                data: {},
            });
        }

        const landlord = await Landlord.findById(rental.landlord._id).select('+signature.dataUrl');

        return streamPdf(res, `livsync-agreement-${rental.agreement.number}.pdf`, (doc) => {
            drawAgreement(doc, rental, landlord?.signature?.dataUrl);
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to generate the agreement',
            data: {},
        });
    }
}

async function getReceipt(req, res) {
    try {
        const rental = await findRentalFor(req.params.rentalId, req.participant);

        if (!rental || rental.status !== 'paid' || rental.payment.mode !== 'online') {
            return res.status(404).json({
                success: false,
                message: 'A receipt is only issued for payments made through LivSync',
                data: {},
            });
        }

        return streamPdf(res, `livsync-receipt-${rental.payment.receiptNo}.pdf`, (doc) => drawReceipt(doc, rental));
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to generate the receipt',
            data: {},
        });
    }
}

module.exports = {
    createRental,
    getRentals,
    decideRental,
    createPaymentOrder,
    verifyPayment,
    chooseOfflinePayment,
    confirmOfflinePayment,
    handleWebhook,
    getAgreement,
    getReceipt,
    buildTerms,
    isValidPaymentSignature,
    drawAgreement,
    drawReceipt,
};
