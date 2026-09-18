const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectToDb = require('./db/db');
const userRoutes = require('./routes/user.routes');
const landlordRoutes = require('./routes/landlord.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectToDb();

app.get('/', (req, res) => {
    res.json({ success: true, message: 'LivSync API is running', data: {} });
});

app.use('/auth', userRoutes);
app.use('/landlord', landlordRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
