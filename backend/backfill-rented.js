const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Rental = require('./models/rental.model');
const Listing = require('./models/listing.model');

dotenv.config();

// One-off: listings let before an acceptance started closing them are still on the market.
// Safe to re-run — it only touches listings that are still published.
(async () => {
    await mongoose.connect(process.env.DB_CONNECT);

    const taken = await Rental.distinct('listing', { status: { $in: ['accepted', 'paid'] } });
    const { modifiedCount } = await Listing.updateMany(
        { _id: { $in: taken }, status: 'published' },
        { $set: { status: 'rented' } }
    );

    console.log(`${modifiedCount} listing(s) taken off the market`);
    await mongoose.disconnect();
})();
