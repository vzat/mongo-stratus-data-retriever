const express = require('express');

const logger = require('../../lib/logger');

const router = express.Router();

function getToken(data) {
    return 'abc123';
}

function getUser(token) {
    return 'john';
}

module.exports = router;
