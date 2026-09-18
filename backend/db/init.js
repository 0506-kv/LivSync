const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Landlord = require('../models/landlord.model');
const Listing = require('../models/listing.model');

// True initialization: wipes the whole database, then seeds one landlord with six listings.
// Run from this folder: node init.js
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MODEL_URLS = [
    'https://drive.google.com/file/d/16_qPSl42Jfw-o4MS5GpMncByPXTzCdtR/view?usp=sharing',
    'https://drive.google.com/file/d/1LyxOVF5_y4BycF26_TBYGNz_exm9vpR0/view?usp=sharing',
    'https://drive.google.com/file/d/1_RrogdfVe8zp_lJ9SPMDs-UDPqXprHuH/view?usp=sharing',
    'https://drive.google.com/file/d/13EM_Ajl6Pjv465xB5wDIc6wLQHPr8j2Z/view?usp=sharing',
    'https://drive.google.com/file/d/10cvNzwL58ea5cxhDzd8WPII-1XtF1dr7/view?usp=sharing',
    'https://drive.google.com/file/d/1__a3IFBQsJ4zs3SOLtKTC2PUfCF1iT2x/view?usp=sharing',
];

const days = (n) => new Date(Date.now() + n * 86400000);

const LISTINGS = [
    {
        title: 'Sunlit 1BHK near Koregaon Park',
        description: 'A bright one-bedroom flat on the third floor with a balcony facing the park. Freshly painted, modular kitchen, and a covered parking slot included.',
        propertyType: 'apartment',
        roomType: 'entire-place',
        location: { address: '12 Lane 5, Koregaon Park', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
        bedrooms: 1, bathrooms: 1, areaSqFt: 620, furnished: true,
        rent: { coldRent: 55, utilities: 8, otherMonthlyCharges: 4 },
        securityDeposit: 110, brokerageFee: 25,
        amenities: ['Balcony', 'Modular kitchen', 'Covered parking', 'Power backup', 'Lift'],
        availableFrom: days(7),
    },
    {
        title: 'Quiet private room in Indiranagar',
        description: 'Furnished private room in a shared three-bedroom house with two working professionals. Attached bathroom, study desk, and high speed fibre internet throughout.',
        propertyType: 'room',
        roomType: 'private-room',
        location: { address: '48 100 Feet Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038' },
        bedrooms: 1, bathrooms: 1, areaSqFt: 210, furnished: true,
        rent: { coldRent: 38, utilities: 6, otherMonthlyCharges: 2 },
        securityDeposit: 76, brokerageFee: 0,
        amenities: ['Attached bathroom', 'Wi-Fi', 'Study desk', 'Washing machine', 'Housekeeping'],
        availableFrom: days(3),
    },
    {
        title: 'Compact studio steps from Bandra station',
        description: 'Self-contained studio with a kitchenette and a full length window. Ideal for a single tenant who wants a five minute walk to the station and the promenade.',
        propertyType: 'studio',
        roomType: 'entire-place',
        location: { address: '7 Hill Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050' },
        bedrooms: 0, bathrooms: 1, areaSqFt: 340, furnished: true,
        rent: { coldRent: 68, utilities: 10, otherMonthlyCharges: 5 },
        securityDeposit: 140, brokerageFee: 34,
        amenities: ['Kitchenette', 'Air conditioning', 'Security', 'Water purifier'],
        availableFrom: days(14),
    },
    {
        title: 'Spacious 3BHK independent house in Jubilee Hills',
        description: 'Independent two storey house with a private garden and space for two cars. Semi furnished with wardrobes and light fittings, ready for a family to move in.',
        propertyType: 'house',
        roomType: 'entire-place',
        location: { address: '221 Road No. 36, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', postalCode: '500033' },
        bedrooms: 3, bathrooms: 3, areaSqFt: 1850, furnished: false,
        rent: { coldRent: 92, utilities: 5, otherMonthlyCharges: 0 },
        securityDeposit: 184, brokerageFee: 46,
        amenities: ['Private garden', 'Two car parking', 'Borewell', 'Solar water heater', 'Pet friendly'],
        availableFrom: days(21),
    },
    {
        title: 'Shared twin room for students in Kothrud',
        description: 'Bed in a clean twin sharing room five minutes from the university gate. Rent covers electricity, drinking water and weekly cleaning, with a common study area downstairs.',
        propertyType: 'room',
        roomType: 'shared-room',
        location: { address: '9 Paud Road, Kothrud', city: 'Pune', state: 'Maharashtra', postalCode: '411038' },
        bedrooms: 1, bathrooms: 1, areaSqFt: 180, furnished: true,
        rent: { coldRent: 22, utilities: 4, otherMonthlyCharges: 1 },
        securityDeposit: 44, brokerageFee: 0,
        amenities: ['Study area', 'Wi-Fi', 'Weekly cleaning', 'Mess nearby', 'Bicycle stand'],
        availableFrom: days(1),
    },
    {
        title: 'Garden villa with pool access in Candolim',
        description: 'Two bedroom villa in a gated lane a short ride from the beach. Shared pool, outdoor seating, and a fully equipped kitchen, let on a long stay basis only.',
        propertyType: 'villa',
        roomType: 'entire-place',
        location: { address: '3 Sequeira Vaddo, Candolim', city: 'Panaji', state: 'Goa', postalCode: '403515' },
        bedrooms: 2, bathrooms: 2, areaSqFt: 1400, furnished: true,
        rent: { coldRent: 79, utilities: 9, otherMonthlyCharges: 6 },
        securityDeposit: 158, brokerageFee: 40,
        amenities: ['Shared pool', 'Outdoor seating', 'Air conditioning', 'Parking', 'Caretaker'],
        availableFrom: days(30),
    },
];

(async () => {
    await mongoose.connect(process.env.DB_CONNECT);
    await mongoose.connection.dropDatabase();

    // create(), not insertMany(), so the pre-save hook hashes the password.
    const landlord = await Landlord.create({
        name: 'test',
        phone: '1234567890',
        email: 'krishcollegestuff@gmail.com',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        password: 'jaimataji',
        businessType: 'individual',
        address: '14 Model Colony, Shivajinagar',
        city: 'Pune',
        propertyTypes: ['apartment', 'house', 'room'],
        profileDescription: 'Independent landlord letting a handful of well kept places across India. Quick to reply and happy to arrange a video walkthrough.',
        verificationStatus: 'verified',
    });

    const listings = await Listing.insertMany(LISTINGS.map((listing, index) => ({
        ...listing,
        landlord: landlord._id,
        modelUrl: MODEL_URLS[index],
        verificationStatus: 'verified',
    })));

    console.log(`database wiped — seeded landlord ${landlord.email} with ${listings.length} listings`);
    await mongoose.disconnect();
})();
