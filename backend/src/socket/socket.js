const { Server } = require("socket.io");
const socketAuth = require("./socketAuth");
const config = require("../config/config");

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
