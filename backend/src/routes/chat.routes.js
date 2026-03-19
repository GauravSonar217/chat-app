const express = require("express");
const { chatController } = require("../controller");
const auth = require("../middleware/auth.middleware").protect;

const router = express.Router();

router.get("/chats-list", auth, chatController.getChatList);
router.post("/create-chat", auth, chatController.accessChat);
router.get("/messages/:chatId", auth, chatController.getChatMessages);

module.exports = router;