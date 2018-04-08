const utils = require('./utils');
const db = require('./db');
const logger = require('./logger');

async function authMiddleware(req, res, next) {
    try {
        const token = utils.getToken(req.get('Authorization'));
        const url = req.originalUrl;
        const user = utils.getUserFromUrl(url);
        const server = utils.getServerFromUrl(url);
        const database = utils.getDBFromUrl(url);

        const docs = await db.getDocumentsSysDB('accounts', {'username': user}, {'projection': {'token': 1, 'databases': 1}});

        // Check if the user exists
        if (docs === undefined || docs.length < 1) {
            throw new Error('User not found');
        }

        // Get the user document
        const doc = docs[0];

        // Check if the token is valid
        if (doc.token !== token) {
            throw new Error('Incorrect token');
        }

        // Check if the database exists
        let validDB;
        if (database !== undefined) {
            validDB = false;
            for (const databaseNo in doc.databases) {
                const dbInfo = doc.databases[databaseNo];
                if (dbInfo.serverName === server && dbInfo.name === database) {
                    validDB = true;
                }
            }
        }
        else {
            validDB = true;
        }


        if (!validDB) {
            throw new Error('Database not found');
        }

        // Valid user
        next();
    }
    catch (e) {
        logger.log('error', e);
        res.sendStatus(403);
    }
}

module.exports = authMiddleware;
