const MongoClient = require('mongodb').MongoClient;
// const ObjectID = require('mongodb').ObjectID;

const mongoBackup = require('mongodb-backup');
const mongoRestore = require('mongodb-restore');
const mongoSanitize = require('express-mongo-sanitize');

const logger = require('./logger.js');
const utils = require('./utils');

// MongoDB driver ^3.0.0
// this is a client
// use client.db(dbName) to get the db -> sysDB.db('mongoStatus')
let sysDB;

function connect (uri) {
    return MongoClient.connect(uri)
        .then(conn => {
            logger.log('info', 'Connected to ' + uri);
            return conn;
        })
        .catch(err => {
            logger.log('error', err);
        });
}

// dataReq
// "token"
// "serverName"
// "databaseName"
async function getServerInfo (dataReq) {
    const docs = await dbFunc.getDocumentsSysDB('accounts', {'token': dataReq.token}, {'projection': {'databases': 1}});

    // no need to verify if the db is correct as it's already been done
    // in the authorization middleware

    const databases = docs[0].databases;
    for (const dbNo in databases) {
        const database = databases[dbNo];

        //  && database.name === dataReq.databaseName

        if (database.serverName === dataReq.serverName) {
            if (database.users && database.users.length > 0) {
                return {
                    ip: database.ip,
                    port: database.port,
                    name: dataReq.databaseName,
                    serverName: database.serverName,
                    rootUser: database.users[0].username,
                    rootPass: database.users[0].password
                };
            }

            // For backwards compatability
            return {
                ip: database.ip,
                port: database.port,
                name: dataReq.databaseName,
                serverName: database.serverName
            };
        }
    }

    return undefined;
}

function getURI (serverInfo) {
    if (serverInfo === undefined) {
        return serverInfo;
    }

    if (serverInfo.ip === undefined) {
        return undefined;
    }

    // Replica Set
    if (serverInfo.ip instanceof Array) {
        let uri = 'mongodb://';

        if (serverInfo.rootUser && serverInfo.rootPass) {
            uri += serverInfo.rootUser + ':' + serverInfo.rootPass + '@';
        }

        for (let serverNo = 0 ; serverNo < serverInfo.ip.length ; serverNo ++) {
            uri += serverInfo.ip[serverNo] + ':' + serverInfo.port[serverNo];
            if (serverNo !== serverInfo.ip.length - 1) {
                uri += ',';
            }
        }
        uri += '/' + serverInfo.name;

        if (serverInfo.ip.length > 1) {
            uri += '?replicaSet=' + serverInfo.serverName + '&readPreference=nearest&authSource=admin';
        }
        else {
            uri += '?authSource=admin';
        }

        return uri;
    }

    // Single Node or Sharded Cluster
    if (serverInfo.rootUser && serverInfo.rootPass) {
        return 'mongodb://' + serverInfo.rootUser + ':' + serverInfo.rootPass + '@' + serverInfo.ip + ':' + serverInfo.port + '/' + serverInfo.name + '?authSource=admin';
    }
    return 'mongodb://' + serverInfo.ip + ':' + serverInfo.port + '/' + serverInfo.name;
}

const dbFunc = module.exports = {
    connectSysDB: () => {
        const uri = getURI(utils.getSysDBInfo());

        return MongoClient.connect(uri)
            .then(conn => {
                sysDB = conn;
                logger.log('info', 'Connected to ' + uri);
            })
            .catch(err => {
                logger.log('error', err);
            });
    },
    getDocuments: async (dataReq, collectionName, query, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize query
            query = mongoSanitize.sanitize(query);

            const docs = await collection.find(query, options).toArray();

            client.close();

            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getDocumentsSysDB: async (collectionName, query, options) => {
        try {
            const db = sysDB.db(utils.getSysDBInfo().name);
            let collection = db.collection(collectionName);

            // Sanitize query
            query = mongoSanitize.sanitize(query);

            const docs = await collection.find(query, options).toArray();
            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    insertDocument: async (dataReq, collectionName, doc) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize doc
            doc = mongoSanitize.sanitize(doc);

            await collection.insertOne(doc);

            client.close();

            return doc;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    insertDocuments: async (dataReq, collectionName, docs) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize docs
            docs = mongoSanitize.sanitize(docs);

            await collection.insertMany(docs);

            client.close();

            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    insertDocumentSysDB: async (collectionName, doc) => {
        try {
            const db = sysDB.db(utils.getSysDBInfo().name);
            let collection = db.collection(collectionName);

            // Sanitize doc
            doc = mongoSanitize.sanitize(doc);

            await collection.insertOne(doc);
            return doc;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    deleteDocument: async (dataReq, collectionName, filter, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize filter
            filter = mongoSanitize.sanitize(filter);

            const deletedDoc = await collection.findOneAndDelete(filter, options);

            client.close();

            return deletedDoc.value;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    deleteDocuments: async (dataReq, collectionName, filter, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize filter
            filter = mongoSanitize.sanitize(filter);

            const docs = await collection.find(filter, options).toArray();

            if (docs.length > 0) {
                await collection.deleteMany(filter, options);
            }

            client.close();

            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    updateDocument: async (dataReq, collectionName, filter, update, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize filter and update
            filter = mongoSanitize.sanitize(filter);
            update = mongoSanitize.sanitize(update);

            const updatedDoc = await collection.findOneAndUpdate(filter, update, options);

            client.close();

            return updatedDoc.value;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    updateDocuments: async (dataReq, collectionName, filter, update, options) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection(collectionName);

            // Sanitize filter and update
            filter = mongoSanitize.sanitize(filter);
            update = mongoSanitize.sanitize(update);

            const docs = await collection.find(filter, options).toArray();

            if (docs.length > 0) {
                await collection.updateMany(filter, {$set: update}, options);
            }

            client.close();

            return docs;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    updateDocumentSysDB: async (collectionName, filter, update, options) => {
        try {
            const db = sysDB.db(utils.getSysDBInfo().name);
            let collection = db.collection(collectionName);

            // Sanitize filter and update
            filter = mongoSanitize.sanitize(filter);
            update = mongoSanitize.sanitize(update);

            const updatedDoc = await collection.findOneAndUpdate(filter, update, options);
            return updatedDoc.value;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getDatabases: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            const res = await db.admin().listDatabases();

            client.close();

            return res.databases;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    createDatabase: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.createCollection('test');

            client.close();

            return dataReq.databaseName;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    dropDatabase: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.dropDatabase();

            client.close();

            return dataReq.databaseName;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getUsers: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);
            let collection = db.collection('system.users');

            const docs = await collection.find({}, { user: 1, db: 1, roles: 1}).toArray();

            client.close();

            let users = [];
            for (const docNo in docs) {
                const doc = docs[docNo];
                users.push(doc);
            }

            return users;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    addUser: async (dataReq, user) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.addUser(user.user, user.pass, {roles: user.roles});

            client.close();

            return user.user;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    removeUser: async (dataReq, username) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.removeUser(username);

            client.close();

            return username;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    ping: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            const res = await db.admin().ping();

            client.close();

            if (res.ok && res.ok === 1) {
                return true;
            }

            return false;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    backup: async (dataReq) => {
        try {
            let serverInfo = await getServerInfo(dataReq);

            const databases = await dbFunc.getDatabases(dataReq);
            const timestamp = (new Date()).toISOString().replace(/:/g, '-');

            for (const databaseNo in databases) {
                const databaseName = databases[databaseNo].name;

                if (databaseName !== 'admin') {
                    serverInfo.name = databaseName;

                    const uri = getURI(serverInfo);

                    await mongoBackup({
                        uri: uri,
                        root: __dirname + '../../backup/' + dataReq.username + '/' + dataReq.serverName + '/' + timestamp
                    });
                }
            }

            return true;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    restore: async (dataReq, timestamp, databases) => {
        try {
            let serverInfo = await getServerInfo(dataReq);

            for (const databaseNo in databases) {
                const databaseName = databases[databaseNo];

                if (databaseName !== 'admin') {
                    serverInfo.name = databaseName;

                    const uri = getURI(serverInfo);

                    await mongoRestore({
                        uri: uri,
                        root: __dirname + '/../backup/' + dataReq.username + '/' + dataReq.serverName + '/' + timestamp + '/' + databaseName,
                        drop: true
                    });
                }
            }

            return true;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getReplicaSetStatus: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            const res = await db.admin().replSetGetStatus();

            client.close();

            return res;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    getCollections: async (dataReq) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            const collections = await db.listCollections().toArray();

            client.close();

            return collections;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    createCollection: async (dataReq, collection) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.createCollection(collection);

            client.close();

            return true;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    deleteCollection: async (dataReq, collection) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            await db.dropCollection(collection);

            client.close();

            return true;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    },
    runCommand: async (dataReq, command) => {
        try {
            const serverInfo = await getServerInfo(dataReq);

            let client = await connect(getURI(serverInfo));
            const db = client.db(serverInfo.name);

            // Sanitize query
            // command = mongoSanitize.sanitize(command);

            const comp = command.split('.');

            if (comp === undefined || comp.length < 3) {
                throw new Error('Invalid command');
            }

            if (comp[0] !== 'db') {
                throw new Error('Syntax Error: "db" not specified');
            }

            const startBracketIndex = comp[2].indexOf('(');
            const endBracketIndex = comp[2].indexOf(')');

            if (startBracketIndex === -1 || endBracketIndex === -1) {
                throw new Error('Syntax Error: no brackets found');
            }

            const method = comp[2].substring(0, startBracketIndex);
            const paramsString = comp[2].substring(startBracketIndex + 1, endBracketIndex);
            const params = paramsString.split(',');

            let payload;
            switch(method) {
            case 'find':
                if (params.length > 2) {
                    throw new Error('Syntax Error: Invalid number of parameters');
                }

                payload = {
                    find: comp[1],
                    filter: params[0] === undefined ? {} : await JSON.parse(params[0]),
                    projection: params[1] === undefined ? {} : await JSON.parse(params[1])
                };
                break;
            }

            if (!payload) {
                throw new Error('No valid command found');
            }

            const result = await db.command(payload);

            client.close();

            return result.cursor.firstBatch;
        }
        catch (err) {
            logger.log('error', err);
            return err;
        }
    }
};
