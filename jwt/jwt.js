const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({status: 401, message: 'Unauthorized - Missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'RMSIDVERFY');
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({status: 401, message: 'Token has Expired!' });
        } else {
            return res.status(401).json({status: 401, message: 'Unauthorized - Invalid token' });
        }

    }
}

module.exports = {
    verifyToken
}
