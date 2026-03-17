const jwt = require("jsonwebtoken");
const config = require("../config/config");
const { TokenService } = require("../utils");

const socketAuth = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("UNAUTHORIZED: No token"));
        }

        // const decoded = jwt.verify(token, config.jwtSecretKey);
         const decoded = TokenService.verifyAccessToken(token);

        // attach user to socket
        socket.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (err) {
        return next(new Error("UNAUTHORIZED: Invalid token"));
    }
};

module.exports = socketAuth;
