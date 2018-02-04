const express = require('express');

const logger = require('../../lib/logger');
const graphqlGenerator = require('../../lib/graphql-generator');
const removeEndpoint = require('../../lib/express-remove-endpoint');
const utils = require('../../lib/utils');
const db = require('../../lib/db');
const authMiddleware = require('../../lib/authMiddleware');

const router = express.Router();

async function addSchemaToSysDB (username, dbName, schemaData) {
    try {
        const docs = await db.getDocumentsSysDB('accounts', {'username': username});

        for (const dNo in docs[0].databases) {
            if (docs[0].databases[dNo].name === dbName) {
                docs[0].databases[dNo].schema = JSON.stringify(schemaData);
            }
        }

        await db.updateDocumentSysDB('accounts', {'username': username}, docs[0]);
    }
    catch (err) {
        logger.log('error', err);
    }
}

const routes = function (app) {
    router.put('/:user/:database/schema', authMiddleware, async function (req, res) {
        res.setHeader('Content-Type', 'application/json');

        try {
            const database = req.params.database;
            const user = req.params.user;
            const token = utils.getToken(req.get('Authorization'));
            const schemaData = req.body.schema;

            // Add Schema to the Database
            addSchemaToSysDB(user, database, schemaData);

            removeEndpoint(app, '/api/v1/' + user + '/' + database);

            const userData = {
                username: user,
                database: database,
                token: token
            };

            graphqlGenerator.createEndpoint(app, '/api/v1/', userData, schemaData);

            res.send(JSON.stringify({'error': 0}));
        }
        catch (e) {
            logger.log('error', e);
            res.send(JSON.stringify({'error': 1, 'errorMessage': e}));
        }
    });

    // TODO: Add endpoint to change the API token

    return router;
};

module.exports = routes;
