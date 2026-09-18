const jwt = require('jsonwebtoken');
const Landlord = require('../models/landlord.model');

const COOKIE_NAME = 'token';
const TOKEN_DURATION = '7d';
const COOKIE_DURATION = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions(includeMaxAge = true) {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    };

    if (includeMaxAge) options.maxAge = COOKIE_DURATION;

    return options;
}

function createToken(landlordId) {
    return jwt.sign({ landlordId }, process.env.JWT_SECRET, { expiresIn: TOKEN_DURATION });
}

function serializeLandlord(landlord) {
    return {
        id: landlord._id,
        name: landlord.name,
        phone: landlord.phone,
        email: landlord.email,
        businessType: landlord.businessType,
        companyName: landlord.companyName,
        address: landlord.address,
        city: landlord.city,
        propertyTypes: landlord.propertyTypes,
        profileDescription: landlord.profileDescription,
        verificationStatus: landlord.verificationStatus,
        createdAt: landlord.createdAt,
        updatedAt: landlord.updatedAt,
    };
}

async function registerLandlord(req, res) {
    try {
        const {
            name,
            phone,
            email,
            password,
            businessType,
            companyName,
            address,
            city,
            propertyTypes,
            profileDescription,
        } = req.body;
        const existingLandlord = await Landlord.findOne({ $or: [{ email }, { phone }] });

        if (existingLandlord) {
            const message = existingLandlord.email === email ? 'Email is already registered' : 'Phone is already registered';
            return res.status(409).json({ success: false, message, data: {} });
        }

        const landlord = await Landlord.create({
            name,
            phone,
            email,
            password,
            businessType,
            companyName,
            address,
            city,
            propertyTypes,
            profileDescription,
        });
        const token = createToken(landlord.id);

        return res.status(201).cookie(COOKIE_NAME, token, getCookieOptions()).json({
            success: true,
            message: 'Landlord registered successfully',
            data: { landlord: serializeLandlord(landlord) },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email or phone is already registered',
                data: {},
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Unable to register landlord',
            data: {},
        });
    }
}

async function loginLandlord(req, res) {
    try {
        const { email, password } = req.body;
        const landlord = await Landlord.findOne({ email }).select('+password');

        if (!landlord || !(await landlord.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                data: {},
            });
        }

        const token = createToken(landlord.id);

        return res.cookie(COOKIE_NAME, token, getCookieOptions()).json({
            success: true,
            message: 'Landlord login successful',
            data: { landlord: serializeLandlord(landlord) },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to log in landlord',
            data: {},
        });
    }
}

async function logoutLandlord(req, res) {
    try {
        return res.clearCookie(COOKIE_NAME, getCookieOptions(false)).json({
            success: true,
            message: 'Landlord logout successful',
            data: {},
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to log out landlord',
            data: {},
        });
    }
}

async function getLandlordProfile(req, res) {
    try {
        const landlord = await Landlord.findById(req.landlordId);

        if (!landlord) {
            return res.status(404).json({
                success: false,
                message: 'Landlord not found',
                data: {},
            });
        }

        return res.json({
            success: true,
            message: 'Landlord profile retrieved successfully',
            data: { landlord: serializeLandlord(landlord) },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve landlord profile',
            data: {},
        });
    }
}

module.exports = {
    registerLandlord,
    loginLandlord,
    logoutLandlord,
    getLandlordProfile,
};
