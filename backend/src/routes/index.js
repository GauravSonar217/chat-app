const express = require('express');
const userRouter = require('./user.routes.js');
const adminRouter = require('./admin.routes.js');
const chatRouter = require('./chat.routes.js');

const router = express.Router();

router.use('/user', userRouter);
router.use('/chats', chatRouter);
router.use('/admin', adminRouter);

module.exports = router;