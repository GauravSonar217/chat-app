const config = require("../config/config");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.cloudApiKey,
    api_secret: config.cloudApiSecret,
});

module.exports = cloudinary;