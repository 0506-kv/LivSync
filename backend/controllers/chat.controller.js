const axios = require('axios');
const Listing = require('../models/listing.model');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_MESSAGE = 500;
// The listing is resent every turn, so only the recent back and forth is worth carrying.
const MAX_HISTORY = 12;

const RULES = `You are the assistant for one rental listing on LivSync, a rental marketplace.
Answer only questions about the listing below: its price and charges, size, rooms, amenities, furnishing,
location, availability, landlord, status, and what renting it would cost or involve.
Use only the listing data given. Never invent a fact that is not there; if the data does not cover it, say the
listing does not mention it and suggest messaging the landlord.
For anything else (other listings, general chat, advice unrelated to this property, coding, news, anything off topic)
reply with exactly: I can only answer questions about this listing.
Be brief: two or three sentences, amounts in rupees, no markdown.`;

// Everything the assistant is allowed to know. Anything outside this block it has to refuse.
function listingFacts(listing) {
    const { location: place, rent } = listing;

    return [
        `Title: ${listing.title}`,
        `Description: ${listing.description}`,
        `Property type: ${listing.propertyType}, room type: ${listing.roomType}`,
        `Address: ${place.address}, ${place.city}, ${place.state} ${place.postalCode}`,
        `Bedrooms: ${listing.bedrooms}, bathrooms: ${listing.bathrooms}, area: ${listing.areaSqFt} sq ft`,
        `Furnished: ${listing.furnished ? 'yes' : 'no'}`,
        `Base rent: ${rent.coldRent}/month, utilities: ${rent.utilities}/month, other charges: ${rent.otherMonthlyCharges}/month`,
        `Total monthly rent: ${listing.totalMonthlyRent}`,
        `Security deposit: ${listing.securityDeposit}, brokerage fee: ${listing.brokerageFee}`,
        `Move-in cost (first month plus deposit and brokerage): ${listing.totalMonthlyRent + listing.securityDeposit + listing.brokerageFee}`,
        `Amenities: ${listing.amenities.length ? listing.amenities.join(', ') : 'none listed'}`,
        `Available from: ${new Date(listing.availableFrom).toDateString()}`,
        `Status: ${listing.status}${listing.status === 'rented' ? ' (already rented, not taking requests)' : ''}`,
        `Verification: ${listing.verificationStatus}`,
        `Landlord: ${listing.landlord?.companyName || listing.landlord?.name || 'not shared'}`,
        `Floor plan available: ${listing.floorPlanUrl ? 'yes' : 'no'}, virtual tour available: ${listing.virtualTourUrl ? 'yes' : 'no'}`,
        `Photos on the page: ${listing.photos.length}`,
    ].join('\n');
}

function toTurn(turn) {
    if (!turn || !['user', 'model'].includes(turn.role) || typeof turn.text !== 'string') return null;

    return { role: turn.role, parts: [{ text: turn.text.slice(0, MAX_MESSAGE) }] };
}

async function chatAboutListing(req, res) {
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (!message || message.length > MAX_MESSAGE) {
        return res.status(422).json({
            success: false,
            message: `Ask a question about this listing (1 to ${MAX_MESSAGE} characters)`,
            data: {},
        });
    }

    try {
        const listing = await Listing.findById(req.params.listingId).populate('landlord', 'name companyName');

        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found', data: {} });
        }

        const history = Array.isArray(req.body.history) ? req.body.history.slice(-MAX_HISTORY) : [];
        const response = await axios.post(
            ENDPOINT,
            {
                systemInstruction: { parts: [{ text: `${RULES}\n\nLISTING DATA:\n${listingFacts(listing)}` }] },
                contents: [
                    ...history.map(toTurn).filter(Boolean),
                    { role: 'user', parts: [{ text: message }] },
                ],
                // Thinking is off: these are lookups over a page of facts, and the budget would eat the reply.
                generationConfig: { temperature: 0.2, maxOutputTokens: 400, thinkingConfig: { thinkingBudget: 0 } },
            },
            { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY }, timeout: 20000 },
        );

        const reply = (response.data?.candidates?.[0]?.content?.parts || [])
            .map((part) => part.text)
            .filter(Boolean)
            .join('')
            .trim();

        if (!reply) throw new Error('The model returned no text');

        return res.json({ success: true, message: 'Reply generated', data: { reply } });
    } catch (error) {
        console.error('Listing chat failed:', error.response?.data || error.message);

        return res.status(502).json({
            success: false,
            message: 'The assistant is unavailable right now',
            data: {},
        });
    }
}

module.exports = { chatAboutListing };
