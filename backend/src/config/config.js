
const config = {
    mongoURL: process.env.MONGO_URL,
    port: process.env.PORT,
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    frontendURL: process.env.FRONTEND_URL,
}

module.exports = config;