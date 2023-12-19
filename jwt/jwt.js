const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized - Missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'RMSIDVERFY');
        req.waiterId = decoded.waiter_id; // Attach waiter ID to the request object
        next();
    } catch (error) {
        console.error(`Error verifying token! Error: ${error}`);
        return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
}

module.exports = { 
    verifyToken 
}
