const utils = require('./utils');
const db = require('./db');
const logger = require('./logger');

async function authMiddleware(req, res, next) {
    try {
        const user = req.params.user;
        const instance = req.params.instance;
        // const database = req.params.database;
        let token = utils.getToken(req.get('Authorization'));

        if (!token && req.session && req.session.username && req.session.token) {
            token = req.session.token;
        }

        const docs = await db.getDocumentsSysDB('accounts', {'username': user, 'token': token}, {'projection': {'token': 1, 'databases': 1}});

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

        // Check if instance and database exist
        let validInstance = true;
        // let validDatabase = true;
        if (instance !== undefined) {

            validInstance = false;
            // if (database !== undefined) {
            //     validDatabase = false;
            // }

            for (let dbNo = 0 ; dbNo < doc.databases.length ; dbNo ++) {
                if (doc.databases[dbNo].serverName === instance) {
                    validInstance = true;
                }
                // if (doc.databases[dbNo].name === database) {
                //     validDatabase = true;
                // }

                if (validInstance) {
                    break;
                }
            }
        }

        if (!validInstance) {
            throw new Error('Instance not found');
        }

        // if (!validDatabase) {
        //     throw new Error('Database not found');
        // }

        // Valid user
        next();
    }
    catch (err) {
        logger.log('error', err);
        res.sendStatus(403);
    }
}

module.exports = authMiddleware;
