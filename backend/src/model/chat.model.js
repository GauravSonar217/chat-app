const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    isGroup: {
        type: Boolean,
        default: false,
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    groupName: String,
    groupAvatar: String,
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
    },
    lastMessageAt: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema)