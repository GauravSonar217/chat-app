const Chat = require("../model/chat.model");
const Message = require("../model/message.model");
const User = require("../model/user.model");
const { asyncHandler, ApiResponse, convertToObjectId } = require("../utils");

exports.getChatList = asyncHandler(async (req, res) => {

    const userIdObj = convertToObjectId(req.user.id);

    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $match: {
                members: userIdObj
            }
        },
        {
            $sort: { updatedAt: -1 }
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
        {
            $project: {
                _id: 1,
                isGroup: 1,
                updatedAt: 1,
                name: {
                    $cond: {
                        if: "$isGroup",
                        then: "$name",
                        else: "$otherMember.username"
                    }
                },
                avatar: {
                    $cond: {
                        if: "$isGroup",
                        then: "$groupAvatar",
                        else: "$otherMember.avatar"
                    }
                },
                lastMessage: {
                    _id: "$lastMessage._id",
                    content: "$lastMessage.content",
                    createdAt: "$lastMessage.createdAt",
                    sender: {
                        _id: "$lastMessage.sender._id",
                        username: "$lastMessage.sender.username",
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

const mongoose = require("mongoose");

exports.accessChat = asyncHandler(async (req, res) => {

    const currentUserId = new mongoose.Types.ObjectId(req.user._id);
    const { userId } = req.body;

    if (!userId) {
        throw new Error("UserId is required");
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);

    // 1️⃣ check existing chat
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
            $limit: 1
        }
    ]);

    // 2️⃣ if exists → return
    if (existingChat.length > 0) {
        return res.status(200).json(new ApiResponse({
            message: "Chat fetched successfully",
            data: existingChat[0]
        }));
    }

    // 3️⃣ else create new chat
    const newChat = await Chat.create({
        members: [currentUserId, targetUserId],
        isGroup: false
    });

    // 4️⃣ populate manually using aggregation
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
        }
    ]);

    res.status(201).json(new ApiResponse({
        message: "Chat created successfully",
        data: createdChat[0]
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
