require("dotenv").config();

const config = {
    mongoURL: process.env.MONGO_URL,
    port: process.env.PORT,
    jwtSecretKey: process.env.JWT_SECRET_KEY,
}

module.exports = config;