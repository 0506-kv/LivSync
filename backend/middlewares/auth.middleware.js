const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                data: {},
            });
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        if (!payload.userId) {
            throw new Error('Invalid user session');
        }

        req.userId = payload.userId;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session',
            data: {},
        });
    }
}

module.exports = requireAuth;
