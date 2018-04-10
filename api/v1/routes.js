const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const express = require('express');

const expressGraphQL = require('express-graphql');
const { buildSchema } = require('graphql');
const rimraf = require('rimraf');
const ObjectID = require('mongodb').ObjectID;

const logger = require('../../lib/logger');
const graphqlGenerator = require('../../lib/graphql-generator');
const removeEndpoint = require('../../lib/express-remove-endpoint');
const utils = require('../../lib/utils');
const db = require('../../lib/db');
const authMiddleware = require('../../lib/authMiddleware');
const restAuthMiddleware = require('../../lib/restAuthMiddleware');

const router = express.Router();

const serverSchema = buildSchema(`
    type Query {
        getDatabases: [Database]
        getUsers: [User]
        getBackups: [Backup]
        getReplicaSetStatus: ReplicaSetStatus
        ping: Boolean
    }
    type Mutation {
        createDatabase (name: String!): String
        dropDatabase (name: String!): String
        addUser (user: UserInput!): String
        removeUser (username: String!): String
        backup: Boolean
        restore (timestamp: String!): Boolean
    }
    type Database {
        name: String,
        sizeOnDisk: Int,
        empty: Boolean
    }
    input UserInput {
        user: String,
        pass: String,
        db: String,
        roles: [RoleInput]
    }
    type User {
        user: String,
        db: String,
        roles: [Role]
    }
    input RoleInput {
        role: String,
        db: String
    }
    type Role {
        role: String,
        db: String
    }
    type Backup {
        timestamp: String
    }
    type ReplicaSetStatus {
        set: String,
        members: [ReplicaSetMembers]
    }
    type ReplicaSetMembers {
        _id: ID,
        name: String,
        health: Int,
        state: Int,
        stateStr: String
    }
`);

const userSchema = buildSchema(`
    type Query {
        getToken: String
    }
    type Mutation {
        refreshToken: String
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

async function createBackupDir (user, server) {
    // Create backup dir
    // const backupDir = __dirname + '../../../backup/';
    const backupDir = path.join(__dirname, '../../backup');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    // Create user dir
    // const userDir = __dirname + '../../../backup/' + user + '/';
    const userDir = path.join(backupDir, user);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir);
    }

    // Create instance dir
    // const instanceDir = __dirname + '../../../backup/' + user + '/' + server + '/';
    const instanceDir = path.join(userDir, server);
    if (!fs.existsSync(instanceDir)) {
        fs.mkdirSync(instanceDir);
    }

    return instanceDir;
}

async function getServerRootValue (req) {
    try {
        const user = req.params.user;
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
                        databaseName: user.db
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
            },
            getBackups: async () => {
                try {
                    // Read dir and delete oldest backup if there are more than 10
                    const instanceDir = await createBackupDir(user, server);

                    const timestamps = fs.readdirSync(instanceDir);

                    let backups = [];
                    for (let timestampNo = 0 ; timestampNo < timestamps.length ; timestampNo ++) {
                        backups.push({
                            timestamp: timestamps[timestampNo]
                        });
                    }

                    return backups;
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            backup: async () => {
                try {
                    const instanceDir = await createBackupDir(user, server);

                    // Read dir and delete oldest backup if there are more than 10
                    const backups = fs.readdirSync(instanceDir);
                    if (backups.length > 9) {
                        rimraf.sync(path.join(instanceDir, backups[0]));
                    }

                    const dataReq = {
                        token: token,
                        username: user,
                        serverName: server,
                        databaseName: 'admin'
                    };
                    return await db.backup(dataReq);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            restore: async ({ timestamp }) => {
                try {
                    const instanceDir = await createBackupDir(user, server);

                    // Read dir and delete oldest backup if there are more than 10
                    const backups = fs.readdirSync(instanceDir);
                    if (backups.indexOf(timestamp) === -1) {
                        return false;
                    }

                    const databases = fs.readdirSync(path.join(instanceDir, timestamp));
                    if (databases.length === 0) {
                        return false;
                    }

                    const dataReq = {
                        token: token,
                        username: user,
                        serverName: server,
                        databaseName: 'admin'
                    };
                    return await db.restore(dataReq, timestamp, databases);
                }
                catch (err) {
                    logger.log('error', err);
                    return err;
                }
            },
            getReplicaSetStatus: async () => {
                try {
                    const dataReq = {
                        token: token,
                        username: user,
                        serverName: server,
                        databaseName: 'admin'
                    };

                    return await db.getReplicaSetStatus(dataReq);
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

async function getUserRootValue (req) {
    try {
        const user = req.params.user;

        return {
            refreshToken: async () => {
                try {
                    const newToken = await crypto.randomBytes(16).toString('hex');

                    await db.updateDocumentSysDB('accounts', {'username': user}, {'token': newToken}, {});

                    return newToken;
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

function getToken (req) {
    const token = utils.getToken(req.get('Authorization'));

    if (!token && req.session && req.session.username && req.session.token) {
        return req.session.token;
    }

    return token;
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

    router.post('/:user', authMiddleware, expressGraphQL(async (req) => ({
        schema: userSchema,
        rootValue: await getUserRootValue(req)
    })));

    // TODO: REST API

    // Get Databases (Low Priority)
    // Get Collections
    // Get Documents from Collection

    // Create Collection
    // Insert Documents

    // Run Command

    router.get('/:user/:instance/databases', restAuthMiddleware, async (req, res) => {
        res.setHeader('Content-Type', 'application/json');

        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: 'admin'
            };

            const dbs = await db.getDatabases(dataReq);

            if (dbs) {
                res.send(JSON.stringify({'ok': 1, 'data': dbs}));
            }
            else {
                throw new Error('Cannot get databases');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.get('/:user/:instance/:database/collections', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            const collections = await db.getCollections(dataReq);

            if (collections) {
                res.send(JSON.stringify({'ok': 1, 'data': collections}));
            }
            else {
                throw new Error('Cannot get collections');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.get('/:user/:instance/:database/:collection/documents', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const collection = req.params.collection;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            const docs = await db.getDocuments(dataReq, collection, {}, {});

            if (docs) {
                res.send(JSON.stringify({'ok': 1, 'data': docs}));
            }
            else {
                throw new Error('Cannot get documents');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.post('/:user/:instance/:database/collection', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const collection = req.body.collection;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            const success = await db.createCollection(dataReq, collection);

            if (success) {
                res.send(JSON.stringify({'ok': 1}));
            }
            else {
                throw new Error('Cannot create collection');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.delete('/:user/:instance/:database/collection', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const collection = req.body.collection;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            const success = await db.deleteCollection(dataReq, collection);

            if (success) {
                res.send(JSON.stringify({'ok': 1}));
            }
            else {
                throw new Error('Cannot delete collection');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.post('/:user/:instance/:database/:collection/documents', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const collection = req.params.collection;
            const documents = req.body.documents;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            const success = await db.insertDocuments(dataReq, collection, documents);

            if (success) {
                res.send(JSON.stringify({'ok': 1}));
            }
            else {
                throw new Error('Cannot create collection');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.delete('/:user/:instance/:database/:collection/documents', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const collection = req.params.collection;
            const ids = req.body.ids;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            if (!(ids instanceof Array)) {
                throw new Error('Invalid field "ids"');
            }

            let success;
            for (let idNo = 0 ; idNo < ids.length ; idNo ++) {
                let docs = await db.deleteDocuments(dataReq, collection, {'_id': ObjectID(ids[idNo])}, {});
                if (docs && docs.length > 0) {
                    success = true;
                }
            }

            if (success) {
                res.send(JSON.stringify({'ok': 1}));
            }
            else {
                throw new Error('Cannot delete documents');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.put('/:user/:instance/:database/:collection/documents', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const collection = req.params.collection;
            const ids = req.body.ids;
            const documents = req.body.documents;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            if (!(ids instanceof Array) || !(documents instanceof Array) || ids.length !== documents.length) {
                throw new Error('Invalid field number of ids and/or documents');
            }

            let success;
            for (let idNo = 0 ; idNo < ids.length ; idNo ++) {

                let docs = await db.updateDocuments(dataReq, collection, {'_id': ObjectID(ids[idNo])}, documents[idNo]);
                if (docs && docs.length > 0) {
                    success = true;
                }
            }

            if (success) {
                res.send(JSON.stringify({'ok': 1}));
            }
            else {
                throw new Error('Cannot update documents');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    router.post('/:user/:instance/:database/command', restAuthMiddleware, async (req, res) => {
        try {
            const user = req.params.user;
            const instance = req.params.instance;
            const database = req.params.database;
            const command = req.body.command;
            const token = getToken(req);

            const dataReq = {
                token: token,
                username: user,
                serverName: instance,
                databaseName: database
            };

            const result = await db.runCommand(dataReq, command);

            if (result) {
                res.send(JSON.stringify({'ok': 1, 'data': result}));
            }
            else {
                throw new Error('Cannot create collection');
            }
        }
        catch (err) {
            logger.log('error', err);
            res.send(JSON.stringify({'ok': 0, 'error': err}));
        }
    });

    return router;
};

module.exports = routes;
