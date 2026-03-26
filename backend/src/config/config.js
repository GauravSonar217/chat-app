
const config = {
    mongoURL: process.env.MONGO_URL,
    port: process.env.PORT,
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    frontendURL: process.env.FRONTEND_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    cloudName: process.env.CLOUD_NAME,
    cloudApiKey: process.env.CLOUD_API_KEY,
    cloudApiSecret: process.env.CLOUD_API_SECRET,
}

module.exports = config;