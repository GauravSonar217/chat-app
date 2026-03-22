const { Server } = require("socket.io");
const socketAuth = require("./socketAuth");
const Message = require("../model/message.model");
const config = require("../config/config");
const Chat = require("../model/chat.model");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: config.frontendURL,
            credentials: true,
        },
    });

    io.use(socketAuth);

    io.on("connection", (socket) => {
        console.log("🟢 Connected:", socket.user.id);

        socket.join(socket.user.id);

        socket.on("join_chat", (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.user.id} joined chat ${chatId}`);
        });

        socket.on("send_message", async (data) => {
            try {
                const { chatId, content } = data;

                const newMessage = await Message.create({
                    chatId: chatId,
                    sender: socket.user.id,
                    text: content,
                    seenBy: [socket.user.id]
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

                const chat = await Chat.findById(chatId);

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
            console.log("🔴 Disconnected:", socket.user.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};

module.exports = { initSocket, getIO };
