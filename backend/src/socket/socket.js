const { Server } = require("socket.io");
const socketAuth = require("./socketAuth");
const Message = require("../model/message.model");
const config = require("../config/config");
const Chat = require("../model/chat.model");

let io;
const onlineUsers = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "https://chatify-gauravsonar.netlify.app"
            ],
            credentials: true,
        },
    });

    io.use(socketAuth);

    io.on("connection", (socket) => {
        const userId = socket.user.id;
        console.log("🟢 Connected:", socket.user.id);

        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }

        onlineUsers.get(userId).add(socket.id);

        // join personal room
        socket.join(userId);

        // broadcast online
        io.emit("user_online", { userId });

        socket.on("join_chat", (chatId) => {
            socket.join(chatId);
        });

        socket.on("get_online_users", () => {
            socket.emit("online_users_list", Array.from(onlineUsers.keys()));
        });

        socket.on("send_message", async (data) => {
            try {
                const { chatId, content } = data;

                const chat = await Chat.findById(chatId);

                if (!chat) {
                    console.log("❌ Chat not found:", chatId);
                    return;
                }

                const socketsInRoom = await io.in(chatId).fetchSockets();
                const activeUserIds = socketsInRoom.map(s => s.user.id.toString());

                let seenBy = [socket.user.id];

                chat.members.forEach(memberId => {
                    if (activeUserIds.includes(memberId.toString())) {
                        seenBy.push(memberId.toString());
                    }
                });

                const newMessage = await Message.create({
                    chatId,
                    sender: socket.user.id,
                    text: content,
                    seenBy
                });

                await Chat.findByIdAndUpdate(chatId, {
                    lastMessage: newMessage._id,
                    lastMessageAt: new Date(),
                });

                const messageData = await Message.aggregate([
                    {
                        $match: {
                            _id: newMessage._id,
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "sender",
                            foreignField: "_id",
                            as: "sender",
                        },
                    },
                    {
                        $unwind: "$sender",
                    },
                    {
                        $project: {
                            _id: 1,
                            chatId: 1,
                            text: 1,
                            type: 1,
                            mediaUrl: 1,
                            seenBy: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            sender: {
                                _id: "$sender._id",
                                username: "$sender.username",
                                fullName: "$sender.fullName",
                                email: "$sender.email",
                                avatar: "$sender.avatar",
                            },
                        },
                    },
                ]);

                const finalMessage = messageData[0];

                io.to(chatId).emit("receive_message", finalMessage);

                chat.members.forEach((memberId) => {
                    io.to(memberId.toString()).emit("chat_updated", {
                        chatId,
                        lastMessage: finalMessage,
                        senderId: socket.user.id
                    });
                });

            } catch (err) {
                console.error(err);
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 Disconnected:", userId);

            if (onlineUsers.has(userId)) {
                const userSockets = onlineUsers.get(userId);

                userSockets.delete(socket.id);

                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit("user_offline", { userId });
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};

module.exports = { initSocket, getIO };
