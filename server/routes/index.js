const express = require('express');
const router = express.Router();

const authApiRoutes = require('./auth.routes');
const userApiRoutes = require('./users.routes');

router.use('/auth', authApiRoutes);
router.use('/users', userApiRoutes);

module.exports = router;