const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized - Missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'RMSIDVERFY');
        req.waiter_id = decoded.waiter_id;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has Expired!' });
        } else {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }

    }
}

module.exports = {
    verifyToken
}
