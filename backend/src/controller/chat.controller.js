const Chat = require("../model/chat.model");
const Message = require("../model/message.model");
const User = require("../model/user.model");
const { asyncHandler, ApiResponse, convertToObjectId, ApiError } = require("../utils");

exports.getChatList = asyncHandler(async (req, res) => {

    const userIdObj = convertToObjectId(req.user.id);

    let { search = "", page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $match: {
                members: userIdObj,
            }
        },
        {
            $sort: { lastMessageAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "members",
                foreignField: "_id",
                as: "members"
            }
        },
        {
            $addFields: {
                otherMember: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$members",
                                as: "member",
                                cond: { $ne: ["$$member._id", userIdObj] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        ...(search
            ? [
                {
                    $match: {
                        $or: [
                            { "otherMember.fullName": { $regex: search, $options: "i" } },
                            { "otherMember.username": { $regex: search, $options: "i" } }
                        ]
                    }
                }
            ]
            : []),
        {
            $sort: { lastMessageAt: -1 }
        },
        {
            $lookup: {
                from: "messages",
                let: { chatId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$chatId", "$$chatId"] },
                            seenBy: { $ne: userIdObj },
                            sender: { $ne: userIdObj }
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                as: "unreadData"
            }
        },
        {
            $addFields: {
                unreadCount: {
                    $ifNull: [{ $arrayElemAt: ["$unreadData.count", 0] }, 0]
                }
            }
        },
        {
            $lookup: {
                from: "messages",
                localField: "lastMessage",
                foreignField: "_id",
                as: "lastMessage"
            }
        },
        {
            $unwind: {
                path: "$lastMessage",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "lastMessage.sender",
                foreignField: "_id",
                as: "lastMessage.sender"
            }
        },
        {
            $unwind: {
                path: "$lastMessage.sender",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                isGroup: 1,
                createdAt: 1,
                updatedAt: 1,
                unreadCount: 1,
                user: {
                    _id: "$otherMember._id",
                    username: "$otherMember.username",
                    fullName: "$otherMember.fullName",
                    avatar: "$otherMember.avatar",
                    email: "$otherMember.email"
                },
                lastMessage: {
                    _id: "$lastMessage._id",
                    text: "$lastMessage.text",
                    createdAt: "$lastMessage.createdAt",
                    sender: {
                        _id: "$lastMessage.sender._id",
                        username: "$lastMessage.sender.username",
                        fullName: "$lastMessage.sender.fullName",
                        avatar: "$lastMessage.sender.avatar",
                        email: "$lastMessage.sender.email"
                    }
                }
            }
        },
        {
            $facet: {
                chats: [
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ];

    const result = await Chat.aggregate(pipeline);

    const chats = result[0].chats;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json(new ApiResponse({
        message: "Chat list fetched successfully",
        data: {
            chats,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }));
});

exports.accessChat = asyncHandler(async (req, res) => {

    const currentUserId = convertToObjectId(req.user.id);
    const { userId, createIfNotExists = false } = req.body;

    if (!userId) {
        throw new ApiError({
            statusCode: 400,
            message: 'User ID is required.',
            code: 'USER_ID_REQUIRED'
        });
    }

    const targetUserId = convertToObjectId(userId);

    const existingChat = await Chat.aggregate([
        {
            $match: {
                isGroup: false,
                members: { $all: [currentUserId, targetUserId] }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "members",
                foreignField: "_id",
                as: "members"
            }
        },
        {
            $project: {
                _id: 1,
                isGroup: 1,
                members: {
                    $map: {
                        input: "$members",
                        as: "member",
                        in: {
                            _id: "$$member._id",
                            username: "$$member.username",
                            fullName: "$$member.fullName",
                            avatar: "$$member.avatar",
                            email: "$$member.email"
                        }
                    }
                },
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $limit: 1
        }
    ]);

    if (existingChat.length > 0) {
        return res.status(200).json(new ApiResponse({
            message: "Chat fetched successfully",
            data: existingChat[0]
        }));
    }

    const newChat = await Chat.create({
        members: [currentUserId, targetUserId],
        isGroup: false
    });

    const createdChat = await Chat.aggregate([
        {
            $match: { _id: newChat._id }
        },
        {
            $lookup: {
                from: "users",
                localField: "members",
                foreignField: "_id",
                as: "members"
            }
        },
        {
            $project: {
                _id: 1,
                isGroup: 1,
                members: {
                    $map: {
                        input: "$members",
                        as: "member",
                        in: {
                            _id: "$$member._id",
                            username: "$$member.username",
                            fullName: "$$member.fullName",
                            avatar: "$$member.avatar",
                            email: "$$member.email"
                        }
                    }
                },
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    res.status(201).json(new ApiResponse({
        message: "Chat created successfully",
        data: createdChat[0]
    }));
});

exports.getChatMessages = asyncHandler(async (req, res) => {

    const { chatId } = req.params;

    let { page = 1, limit = 20 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $match: {
                chatId: convertToObjectId(chatId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "sender"
            }
        },
        {
            $unwind: "$sender"
        },
        {
            $project: {
                text: "$text",
                createdAt: 1,
                sender: {
                    _id: "$sender._id",
                    username: "$sender.username",
                    email: "$sender.email",
                    avatar: "$sender.avatar"
                }
            }
        },
        {
            $facet: {
                messages: [
                    { $skip: skip },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ];

    const result = await Message.aggregate(pipeline);

    const messages = result[0].messages;
    const total = result[0].totalCount[0]?.count || 0;

    res.status(200).json(new ApiResponse({
        message: "Messages fetched successfully",
        data: {
            messages,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    }));
});

exports.markAsRead = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = convertToObjectId(req.user.id);

    await Message.updateMany(
        {
            chatId: convertToObjectId(chatId),
            seenBy: { $ne: userId }
        },
        {
            $addToSet: { seenBy: userId }
        }
    );

    res.status(200).json(new ApiResponse({
        message: "Messages marked as read"
    }));
});

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
