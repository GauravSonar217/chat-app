require("dotenv").config();

const config = {
    mongoURL: process.env.MONGO_URL,
    port: process.env.PORT,
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET

}

module.exports = config;