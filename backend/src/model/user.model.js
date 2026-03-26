const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: 3,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false,
        minLength: 8,
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    avatar: {
        type: String,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    passwordResetVerified: {
        type: Boolean,
        default: false
    },
    passwordResetVerifiedAt: {
        type: Date
    },
    refreshToken: {
        type: String
    },
    emailVerificationOTP: String,
    emailVerificationOTPExpires: Date,
    passwordResetOTP: String,
    passwordResetOTPExpires: Date,

}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
