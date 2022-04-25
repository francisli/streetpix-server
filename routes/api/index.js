const express = require('express');

const router = express.Router();

router.use('/assets', require('./assets'));
router.use('/auth', require('./auth'));
router.use('/invites', require('./invites'));
router.use('/meetings/templates', require('./meetingTemplates'));
router.use('/meetings', require('./meetings'));
router.use('/passwords', require('./passwords'));
router.use('/photos', require('./photos'));
router.use('/users', require('./users'));

module.exports = router;
