const express = require('express');

const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');

const logger = require('../../lib/logger');
const graphqlGenerator = require('../../lib/graphql-generator');
const removeEndpoint = require('../../lib/express-remove-endpoint');
const utils = require('../../lib/utils');
const db = require('../../lib/db');
const authMiddleware = require('../../lib/authMiddleware');

const router = express.Router();

const serverSchema = buildSchema(`
    type Query {
        getDatabases: [Database]
        getUsers: [User]
        ping: Boolean
    }
    type Mutation {
        createDatabase (name: String!): String
        dropDatabase (name: String!): String
        addUser (user: UserInput!): String
        removeUser (username: String!): String
    }
    type Database {
        name: String,
        sizeOnDisk: Int,
        empty: Boolean
    }
    input UserInput {
        username: String,
        password: String,
        database: String,
        roles: [String]
    }
    type User {
        username: String,
        database: String,
        roles: [String]
    }
`);

async function addSchemaToSysDB (username, serverName, dbName, schemaData) {
    try {
        const docs = await db.getDocumentsSysDB('accounts', {'username': username});

        for (const dNo in docs[0].databases) {
            if (docs[0].databases[dNo].serverName === serverName && docs[0].databases[dNo].name === dbName) {
                docs[0].databases[dNo].schema = JSON.stringify(schemaData);
            }
        }

        await db.updateDocumentSysDB('accounts', {'username': username}, docs[0]);
    }
    catch (err) {
        logger.log('error', err);
    }
}

async function getServerRootValue (req) {
    try {
        const server = req.params.server;
        const token = utils.getToken(req.get('Authorization'));

        return {
            getDatabases: async ()  => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: 'admin'
                    };
                    return await db.getDatabases(dataReq);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            createDatabase: async ({ name }) => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: name
                    };
                    return await db.createDatabase(dataReq);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            dropDatabase: async ({ name }) => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: name
                    };
                    return await db.dropDatabase(dataReq);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            getUsers: async ()  => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: 'admin'
                    };
                    return await db.getUsers(dataReq);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            addUser: async ({ user }) => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: user.database
                    };
                    return await db.addUser(dataReq, user);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            removeUser: async ({ username }) => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: 'admin'
                    };
                    return await db.removeUser(dataReq, username);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            ping: async () => {
                try {
                    const dataReq = {
                        token: token,
                        serverName: server,
                        databaseName: 'admin'
                    };
                    return await db.ping(dataReq);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            }
        };
    }
    catch (err) {
        logger.log('error', err);
        return {};
    }
}

const routes = function (app) {
    router.put('/:user/:server/:database/schema', authMiddleware, async function (req, res) {
        res.setHeader('Content-Type', 'application/json');

        try {
            const server = req.params.server;
            const database = req.params.database;
            const user = req.params.user;
            const token = utils.getToken(req.get('Authorization'));
            const schemaData = req.body.schema;

            removeEndpoint(app, '/api/v1/' + user + '/' + server + '/' + database);

            const userData = {
                username: user,
                server: server,
                database: database,
                token: token
            };

            const error = await graphqlGenerator.createEndpoint(app, '/api/v1/', userData, schemaData);

            if (error !== false) {
                throw new Error(error);
            }

            // Add Schema to the Database
            addSchemaToSysDB(user, server, database, schemaData);

            res.send(JSON.stringify({'error': 0}));
        }
        catch (e) {
            logger.log('error', e);
            res.send(JSON.stringify({'error': 1, 'errorMessage': e}));
        }
    });

    router.post('/:user/:server', authMiddleware, expressGraphQL(async (req) => ({
        schema: serverSchema,
        rootValue: await getServerRootValue(req)
    })));

    // TODO: GraphQL Endpoints
    // /:user/:server
    // 1. Get all databases for a server
    // 2. Add new database
    // 3. Remove database

    // /:user
    // Change API endpoint

    return router;
};

module.exports = routes;
