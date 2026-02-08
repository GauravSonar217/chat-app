
const jwt = require('jsonwebtoken');
const { ApiError } = require("../utils");
const config = require("../config/config");

exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError({
            statusCode: 401,
            message: "No token provided",
            code: "NO_TOKEN"
        }))
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecretKey);
        req.user = decoded;
        next();

    } catch (error) {
        if (err.name === "TokenExpiredError") {
            return next(new ApiError({
                statusCode: 401,
                message: "Access token expired",
                code: "ACCESS_TOKEN_EXPIRED"
            }))
        }

        return next(new ApiError({
            statusCode: 401,
            message: "Invalid access token",
            code: "INVALID_ACCESS_TOKEN"
        }))
    }
}