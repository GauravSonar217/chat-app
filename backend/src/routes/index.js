const express = require('express');
const userRouter = require('./user.routes.js');
const adminRouter = require('./admin.routes.js');

const router = express.Router();

router.use('/user', userRouter);
router.use('/admin', adminRouter);

module.exports = router;