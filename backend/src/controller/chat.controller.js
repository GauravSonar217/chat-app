const Chat = require("../model/chat.model");
const Message = require("../model/message.model");
const User = require("../model/user.model");
const { asyncHandler, ApiResponse } = require("../utils");

exports.getChatList = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const chats = await Chat.find({ members: userId })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("members", "username email avatar")
        .populate({
            path: "lastMessage",
            model: "Message",
            populate: {
                path: "sender",
                model: "User",
                select: "username email",
            },
        });


    const formattedChats = chats.map((chat) => {
        const otherMember = !chat.isGroup ? chat.members.find(member => member._id.toString() !== userId.toString()) : null;
        return {
            _id: chat._id,
            name: chat.isGroup ? chat.name : otherMember.username,
            avatar: chat.isGroup ? chat.groupAvatar : otherMember.avatar,
            lastMessage: chat.lastMessage ? {
                _id: chat.lastMessage._id,
                content: chat.lastMessage.content,
                sender: chat.lastMessage.sender,
                createdAt: chat.lastMessage.createdAt,
            } : null,
            isGroup: chat.isGroup,
            updatedAt: chat.updatedAt,
        }
    })

    res.status(200).json(new ApiResponse({
        message: 'Chat list fetched successfully',
        data: {
            chats: formattedChats
        }
    }));
})


exports.searchUsers = async (req, res) => {
    const userId = req.user.id;
    const { query = "", page = 1 } = req.query;

    const limit = 15;
    const skip = (page - 1) * limit;

    const users = await User.find({
        _id: { $ne: userId },
        username: { $regex: query, $options: "i" },
    })
        .select("username avatar email")
        .limit(limit)
        .skip(skip);

    res.json(users);
};
