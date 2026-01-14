require("dotenv").config();
const app = require("./src/app");
const config = require("./src/config/config");
const PORT = config.port;

let server;

server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const handleShutdown = (error) => {
    if (error) {
        console.error('Error occured:', error);
    }
    if (server) {
        server.close(() => {
            console.log('Shutting down server gracefully.');
            process.exit(error instanceof Error ? 1 : 0);
        });
    } else {
        process.exit(error instanceof Error ? 1 : 0);
    }
};

process.on('uncaughtException', handleShutdown);
process.on('unhandledRejection', handleShutdown);
process.on('SIGTERM', () => {
    console.log("SIGTERM received");
    handleShutdown()
});
process.on('SIGINT', () => {
    console.log("SIGINT received");
    handleShutdown()
});